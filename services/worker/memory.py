"""
Memory layer for the R U Socrates worker.

Combines the node Database and Cognition store from ASI-Evolve into a single
module. Internal imports only — no HTTP, no external service.

Classes:
    EmbeddingService  — sentence-transformers wrapper
    FAISSIndex        — FAISS vector index
    NodeDatabase      — persistent node store with UCB1 sampling
    CognitionStore    — persistent cognition item store with semantic retrieval
"""

from __future__ import annotations

import json
import pickle
import uuid
from pathlib import Path
from threading import RLock
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from .models import Node, CognitionItem

# ---------------------------------------------------------------------------
# Optional heavy dependencies (graceful ImportError for environments without them)
# ---------------------------------------------------------------------------

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except ImportError:
    ST_AVAILABLE = False


# ---------------------------------------------------------------------------
# Embedding service
# ---------------------------------------------------------------------------

class EmbeddingService:
    """Local embedding service backed by sentence-transformers."""

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: str = "cpu",
    ):
        if not ST_AVAILABLE:
            raise ImportError(
                "sentence-transformers not installed. "
                "Run: pip install sentence-transformers"
            )
        self.model = SentenceTransformer(model_name, device=device)
        self.dimension: int = self.model.get_sentence_embedding_dimension()

    def encode(self, texts: str | List[str], normalize: bool = True) -> np.ndarray:
        if isinstance(texts, str):
            texts = [texts]
        embeddings = self.model.encode(
            texts,
            normalize_embeddings=normalize,
            show_progress_bar=False,
        )
        return np.array(embeddings, dtype=np.float32)


# ---------------------------------------------------------------------------
# FAISS index wrapper
# ---------------------------------------------------------------------------

class FAISSIndex:
    """Manage FAISS-based vector indexing for similarity search."""

    def __init__(
        self,
        dimension: int = 384,
        index_type: str = "IP",
        storage_path: Optional[Path] = None,
    ):
        if not FAISS_AVAILABLE:
            raise ImportError("faiss-cpu not installed. Run: pip install faiss-cpu")

        self.dimension = dimension
        self.index_type = index_type
        self.storage_path = Path(storage_path) if storage_path else None
        self.lock = RLock()

        self.index = faiss.IndexFlatIP(dimension) if index_type == "IP" else faiss.IndexFlatL2(dimension)
        self.id_to_idx: Dict[int, int] = {}
        self.idx_to_id: Dict[int, int] = {}
        self.next_idx = 0

        if self.storage_path:
            self._load()

    def add(self, node_id: int, vector: np.ndarray) -> None:
        with self.lock:
            if node_id in self.id_to_idx:
                return
            v = self._normalize(vector.reshape(1, -1).astype(np.float32))
            self.index.add(v)
            self.id_to_idx[node_id] = self.next_idx
            self.idx_to_id[self.next_idx] = node_id
            self.next_idx += 1

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 5,
        score_threshold: float = 0.0,
    ) -> List[Tuple[int, float]]:
        with self.lock:
            if self.index.ntotal == 0:
                return []
            qv = self._normalize(query_vector.reshape(1, -1).astype(np.float32))
            k = min(top_k, self.index.ntotal)
            scores, indices = self.index.search(qv, k)
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or score < score_threshold:
                    continue
                nid = self.idx_to_id.get(idx)
                if nid is not None:
                    results.append((nid, float(score)))
            return results

    def remove(self, node_id: int) -> None:
        with self.lock:
            if node_id in self.id_to_idx:
                idx = self.id_to_idx.pop(node_id)
                self.idx_to_id.pop(idx, None)

    def _normalize(self, vectors: np.ndarray) -> np.ndarray:
        if self.index_type == "IP":
            norms = np.linalg.norm(vectors, axis=1, keepdims=True)
            norms[norms == 0] = 1
            return vectors / norms
        return vectors

    def save(self) -> None:
        if not self.storage_path:
            return
        with self.lock:
            self.storage_path.mkdir(parents=True, exist_ok=True)
            faiss.write_index(self.index, str(self.storage_path / "faiss.index"))
            with open(self.storage_path / "faiss_meta.pkl", "wb") as f:
                pickle.dump(
                    {"id_to_idx": self.id_to_idx, "idx_to_id": self.idx_to_id, "next_idx": self.next_idx},
                    f,
                )

    def _load(self) -> None:
        if not self.storage_path:
            return
        index_file = self.storage_path / "faiss.index"
        meta_file = self.storage_path / "faiss_meta.pkl"
        if not index_file.exists() or not meta_file.exists():
            return
        with self.lock:
            self.index = faiss.read_index(str(index_file))
            with open(meta_file, "rb") as f:
                meta = pickle.load(f)
            self.id_to_idx = meta["id_to_idx"]
            self.idx_to_id = meta["idx_to_id"]
            self.next_idx = meta["next_idx"]

    def reset(self) -> None:
        with self.lock:
            self.index = faiss.IndexFlatIP(self.dimension) if self.index_type == "IP" else faiss.IndexFlatL2(self.dimension)
            self.id_to_idx.clear()
            self.idx_to_id.clear()
            self.next_idx = 0
            if self.storage_path:
                for f in self.storage_path.glob("faiss*"):
                    f.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# UCB1 sampler (simplified from ASI-Evolve database/algorithms.py)
# ---------------------------------------------------------------------------

import math


class UCB1Sampler:
    """Upper Confidence Bound 1 sampling for node exploration."""

    def __init__(self, c: float = 1.414):
        self.c = c
        self.total_visits = 0

    def sample(self, nodes: List[Node], n: int) -> List[Node]:
        if not nodes:
            return []
        n = min(n, len(nodes))
        if self.total_visits == 0:
            return nodes[:n]
        scored = []
        for node in nodes:
            exploitation = node.score
            exploration = self.c * math.sqrt(math.log(self.total_visits + 1) / (node.visit_count + 1))
            scored.append((node, exploitation + exploration))
        scored.sort(key=lambda x: x[1], reverse=True)
        selected = [node for node, _ in scored[:n]]
        for node in selected:
            node.visit_count += 1
        self.total_visits += 1
        return selected

    def on_node_added(self, node: Node) -> None:
        pass

    def on_node_removed(self, node: Node) -> None:
        pass


# ---------------------------------------------------------------------------
# Node database
# ---------------------------------------------------------------------------

class NodeDatabase:
    """
    Persistent node store.

    Stores nodes as JSON on disk; uses FAISS for similarity search
    and UCB1 for exploration-exploitation sampling.
    """

    def __init__(
        self,
        storage_dir: Path,
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        embedding_dim: int = 384,
        max_size: Optional[int] = None,
    ):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.lock = RLock()
        self.nodes: Dict[int, Node] = {}
        self.next_id = 0
        self.max_size = max_size

        # Defer heavy model loading to first use (lazy-init) so FastAPI startup
        # is not blocked by sentence-transformers model downloads (~200 MB).
        self._embedding_model_name = embedding_model
        self._embedding_dim = embedding_dim
        self._embedding: Optional["EmbeddingService"] = None
        self._faiss: Optional["FAISSIndex"] = None

        self.sampler = UCB1Sampler()
        self._load()

    @property
    def embedding(self) -> "EmbeddingService":
        """Lazy-load EmbeddingService on first use."""
        if self._embedding is None:
            self._embedding = EmbeddingService(model_name=self._embedding_model_name)
        return self._embedding

    @property
    def faiss(self) -> "FAISSIndex":
        """Lazy-load FAISSIndex on first use."""
        if self._faiss is None:
            self._faiss = FAISSIndex(
                dimension=self._embedding_dim,
                storage_path=self.storage_dir / "faiss",
            )
        return self._faiss

    def sample(self, n: int) -> List[Node]:
        with self.lock:
            nodes = list(self.nodes.values())
            selected = self.sampler.sample(nodes, n)
            self._save()
            return selected

    def add(self, node: Node) -> int:
        with self.lock:
            if self.max_size and len(self.nodes) >= self.max_size:
                self._remove_worst()
            node.id = self.next_id
            self.next_id += 1
            self.nodes[node.id] = node
            self.sampler.on_node_added(node)
            text = node.get_context_text()
            if text:
                vector = self.embedding.encode(text)
                self.faiss.add(node.id, vector[0])
            self._save()
            return node.id

    def get_all(self) -> List[Node]:
        return list(self.nodes.values())

    def get_best(self) -> Optional[Node]:
        if not self.nodes:
            return None
        return max(self.nodes.values(), key=lambda n: n.score)

    def _remove_worst(self) -> None:
        if not self.nodes:
            return
        worst_id = min(self.nodes, key=lambda nid: (self.nodes[nid].score, nid))
        node = self.nodes.pop(worst_id)
        self.sampler.on_node_removed(node)
        self.faiss.remove(worst_id)

    def _save(self) -> None:
        data = {
            "next_id": self.next_id,
            "nodes": {str(k): v.to_dict() for k, v in self.nodes.items()},
        }
        with open(self.storage_dir / "nodes.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        self.faiss.save()

    def _load(self) -> None:
        data_file = self.storage_dir / "nodes.json"
        if not data_file.exists():
            return
        with open(data_file, encoding="utf-8") as f:
            data = json.load(f)
        self.next_id = data.get("next_id", 0)
        for node_id, node_data in data.get("nodes", {}).items():
            self.nodes[int(node_id)] = Node.from_dict(node_data)

    def __len__(self) -> int:
        return len(self.nodes)


# ---------------------------------------------------------------------------
# Cognition store
# ---------------------------------------------------------------------------

class CognitionStore:
    """
    Persistent cognition store with embedding-based retrieval.
    """

    def __init__(
        self,
        storage_dir: Path,
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        embedding_dim: int = 384,
        retrieval_top_k: int = 5,
        score_threshold: float = 0.5,
    ):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.lock = RLock()
        self.retrieval_top_k = retrieval_top_k
        self.score_threshold = score_threshold
        self.items: Dict[str, CognitionItem] = {}

        self.embedding = EmbeddingService(model_name=embedding_model)
        self.faiss = FAISSIndex(
            dimension=embedding_dim,
            storage_path=self.storage_dir / "faiss",
        )
        self.str_to_int: Dict[str, int] = {}
        self.int_to_str: Dict[int, str] = {}
        self.next_int_id = 0
        self._load()

    def add(self, item: CognitionItem) -> str:
        with self.lock:
            if not item.id:
                item.id = str(uuid.uuid4())
            self.items[item.id] = item
            if item.content:
                int_id = self._get_int_id(item.id)
                vector = self.embedding.encode(item.content)
                self.faiss.add(int_id, vector[0])
            self._save()
            return item.id

    def search(self, query: str, top_k: Optional[int] = None) -> List[CognitionItem]:
        top_k = top_k or self.retrieval_top_k
        qv = self.embedding.encode(query)
        results = self.faiss.search(qv[0], top_k, self.score_threshold)
        items = []
        for int_id, _ in results:
            str_id = self.int_to_str.get(int_id)
            if str_id:
                item = self.items.get(str_id)
                if item:
                    items.append(item)
        return items

    def _get_int_id(self, str_id: str) -> int:
        if str_id not in self.str_to_int:
            self.str_to_int[str_id] = self.next_int_id
            self.int_to_str[self.next_int_id] = str_id
            self.next_int_id += 1
        return self.str_to_int[str_id]

    def _save(self) -> None:
        data = {
            "items": {k: v.to_dict() for k, v in self.items.items()},
            "str_to_int": self.str_to_int,
            "int_to_str": {str(k): v for k, v in self.int_to_str.items()},
            "next_int_id": self.next_int_id,
        }
        with open(self.storage_dir / "cognition.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        self.faiss.save()

    def _load(self) -> None:
        data_file = self.storage_dir / "cognition.json"
        if not data_file.exists():
            return
        with open(data_file, encoding="utf-8") as f:
            data = json.load(f)
        for item_id, item_data in data.get("items", {}).items():
            self.items[item_id] = CognitionItem.from_dict(item_data)
        self.str_to_int = data.get("str_to_int", {})
        self.int_to_str = {int(k): v for k, v in data.get("int_to_str", {}).items()}
        self.next_int_id = data.get("next_int_id", 0)

    def __len__(self) -> int:
        return len(self.items)
