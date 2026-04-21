# Phase 0 Validation Report — ASI-Evolve Source Analysis

> **Date**: 2026-04-21
> **Analyst**: AI (WorkBuddy)
> **Source**: `prepare/ASI-Evolve-main/` (55 Python files)

---

## Status: ✅ Code Analysis Complete — Local Execution Pending

> Execution is blocked until two Windows compatibility issues are resolved.
> Both are documented below with workarounds. See §5 (Windows Compatibility Issues).

---

## 1. Annotated Pipeline Flow

### 1.1 Full System Initialization

```
Pipeline.__init__()
├── load_config()             — layered: repo default → experiment config → explicit file
├── init_logger()             — file logs + console + optional wandb
├── create_llm_client()       — OpenAI-compatible (any provider)
├── PromptManager             — loads .jinja2 prompt templates from experiment dir
├── Database                  — FAISS + sampling (UCB1/island/random/greedy)
├── Cognition                  — FAISS + sentence-transformers
├── Researcher (if enabled)
├── Engineer (if enabled)
├── Analyzer (if enabled)
└── Manager (if enabled, one-time init only)
```

### 1.2 run() Entry Point

```
Pipeline.run(max_steps, task_description, eval_script)
├── _create_initial_node()    ← runs Engineer + Analyzer on initial_program seed (step 0)
└── _run_sequential()         ← default (num_workers=1)
    └── run_step() × max_steps

    OR

└── _run_parallel()           ← ThreadPoolExecutor (num_workers>1)
    └── run_step() × max_steps
```

### 1.3 run_step() — The Core Loop (4-stage closed loop)

```
Step N
│
├─ 1. DATABASE.sample(N)      → sample_n nodes from FAISS (UCB1 / island / random)
│
├─ 2. COGNITION.search()      → top_k items per sampled node (semantic retrieval)
│
├─ 3. RESEARCHER.run()        ← LLM call (Researcher Agent)
│   ├─ if diff_based_evolution:
│   │   └─ LLM generates SEARCH/REPLACE diff blocks → apply_diff() → new code
│   └─ else:
│       └─ LLM generates full <name>/<motivation>/<code> XML tags
│
├─ 4. NODE created            ← name, motivation, code from Researcher
│
├─ 5. ENGINEER.run()          ← subprocess exec + LLM judge (optional, Engineer Agent)
│   │   (only if eval_script provided OR judge_enabled)
│   ├─ write code to step_dir/code
│   ├─ subprocess.Popen(["bash", eval_script])  ← CRITICAL: POSIX-only!
│   ├─ parse results.json OR results.txt
│   └─ optional: LLM judge → final_score = (1-judge_ratio)*eval + judge_ratio*judge
│
├─ 6. ANALYZER.run()          ← LLM call (Analyzer Agent)
│   └─ LLM generates <analysis> XML tag comparing new node vs best sampled node
│
├─ 7. DATABASE.add(node)      → FAISS upsert + metadata JSON
│
├─ 8. BEST_SNAPSHOT.update_if_better()  → copies best node files to steps_dir/best/
│
└─ return node
```

### 1.4 Agent Input/Output Summary

| Agent | Input | Output | LLM Calls |
|-------|-------|--------|-----------|
| **Researcher** | task + context_nodes + cognition_items + base_code | `{name, motivation, code, changes}` | 1 per step |
| **Engineer** | code + eval_script | `{score, runtime, success, results}` | 1 (judge, optional) |
| **Analyzer** | code + results + best_sampled_node | `{analysis}` | 1 per step |

---

## 2. Data Structures (structures.py)

### Node (experiment database record)
```
id          : Optional[int]   ← assigned by database on add()
name        : str             ← short label for this candidate
created_at  : str             ← ISO timestamp
parent      : List[int]       ← parent node IDs
motivation  : str             ← natural-language rationale (from Researcher)
code        : str             ← generated program
results     : Dict[str, Any]  ← structured eval results (from Engineer)
analysis    : str             ← natural-language lesson (from Analyzer)
meta_info   : Dict[str, Any]  ← runtime, success, eval_score, error...
visit_count : int             ← times this node has been sampled
score       : float           ← final scalar used for ranking/selection
```

### CognitionItem (knowledge base record)
```
id       : Optional[str]
content  : str                ← the knowledge text
source   : str                ← provenance label
metadata : Dict[str, Any]
```

### LLMResponse
```
content       : str
raw_response  : Any             ← original API response object
usage         : Dict[str,int]  ← {prompt_tokens, completion_tokens, total_tokens}
model         : str
call_time     : float
```

---

## 3. Config System

### Layered override priority (highest wins):
1. Explicit `config_path` argument
2. `experiments/<name>/config.yaml`
3. Repository `config.yaml`

### Environment variable substitution:
```yaml
api_key: "${OPENAI_API_KEY}"   # reads os.environ["OPENAI_API_KEY"]
```

### Config schema:
```yaml
experiment_name  : str
api              : {provider, base_url, api_key, model, temperature, timeout, ...}
logging          : {level, console, wandb}
pipeline         : {agents, researcher, max_retries, engineer_timeout, parallel, sample_n, judge}
cognition        : {storage_dir, embedding, faiss, retrieval, web_search}
database         : {storage_dir, max_size, embedding, sampling, faiss}
```

---

## 4. Dependency Inventory

### Declared in requirements.txt (9 packages)
```
openai>=1.0.0
pyyaml>=6.0
jinja2>=3.0
numpy>=1.20.0
faiss-cpu>=1.7.0
sentence-transformers>=2.2.0
wandb>=0.15.0          ← declared but only used when logging.wandb.enabled=true
```

### Actually imported (stdlib, no surprises)
```
json, traceback, concurrent.futures, threading, subprocess,
time, re, dataclasses, pathlib, datetime, typing, shutil, copy
```

### Actually imported (third-party)
```
openai          (from requirements.txt)
pyyaml          (from requirements.txt)
jinja2          (from requirements.txt)
numpy           (from requirements.txt)
faiss-cpu       (from requirements.txt)
sentence-transformers  (from requirements.txt)
wandb           (soft — only imported when enabled)
psutil          ← MISSING from requirements.txt but actually used in engineer.py
```

### psutil issue:
In `pipeline/engineer/engineer.py` lines 146–175, psutil is imported inside a try/except:
```python
try:
    import psutil
    parent = psutil.Process(process.pid)
    children = parent.children(recursive=True)
except ImportError:
    children = []
    logger.warning("[Engineer] psutil not available, may not kill all subprocesses")
```
- psutil is **not listed in requirements.txt**
- If psutil is absent, timeouts rely on `process.terminate()` only (no recursive kill)
- This is a **silent degradation** on Windows where process cleanup may be incomplete

---

## 5. Windows Compatibility Issues

### Issue #1 — CRITICAL: Engineer uses `bash` (POSIX-only)

**File**: `pipeline/engineer/engineer.py` line 120

```python
process = subprocess.Popen(
    ["bash", script_path],   # ← bash not available on Windows by default
    cwd=cwd,
    ...
)
```

**Impact**: Any experiment with `eval_script` (i.e., any real experiment) will fail immediately on Windows with `FileNotFoundError: [WinError 2] The system cannot find the file specified`.

**eval.sh content**: The demo experiment uses a bash script (`eval.sh`) that calls `python3 evaluator.py`. This is completely non-functional on Windows without WSL/Git Bash/MSYS2.

**Workaround for Phase 0**: Use Git Bash, WSL, or modify engineer.py to use `python` instead of `bash`. The eval script is thin wrapper — the actual evaluation is in `evaluator.py` which is Python.

### Issue #2 — Package naming mismatch

**Import path in code**: `from Evolve.cognition.cognition import Cognition`
**Directory on disk**: `prepare/ASI-Evolve-main/` (contains hyphens)

Python module names cannot contain hyphens. The directory on disk must be named `Evolve` (no hyphen) for these imports to work.

**Workaround**: Either:
- Rename the directory to `Evolve` in the local working copy, OR
- Create a symlink: `prepare/Evolve` → `prepare/ASI-Evolve-main`, OR
- Add `prepare/ASI-Evolve-main` to `sys.path` and install it as a package (needs `__init__.py` + package name in `pyproject.toml`)

### Issue #3 — `python3` in eval.sh

**File**: `experiments/circle_packing_demo/eval.sh` line 75
```bash
python3 "$EVALUATOR_PY" "$RESULT_JSON"
```
`python3` command name does not exist on Windows (should be `python`).

---

## 6. Architecture Findings for Phase 1

### 6.1 What is actually reusable from ASI-Evolve

| Component | Reusable? | Adaptation needed |
|-----------|-----------|-------------------|
| `utils/llm.py` LLMClient | ✅ Yes | Wrap with LiteLLM (ADR-003) |
| `utils/structures.py` Node/CognitionItem | ✅ Yes | Port to TypeScript in packages/types |
| `pipeline/researcher/` | ✅ Yes | Fork into services/worker/researcher.py |
| `pipeline/engineer/` | ⚠️ Partial | Replace subprocess exec with ADR-002 (process+timeout) |
| `pipeline/analyzer/` | ✅ Yes | Fork into services/worker/analyzer.py |
| `database/` FAISS + sampling | ✅ Yes | Fork into services/memory/ |
| `cognition/` | ✅ Yes | Fork into services/memory/ |
| `utils/prompt.py` PromptManager | ✅ Yes | Keep Jinja2 rendering |
| `utils/config.py` | ✅ Yes | Fork with env var substitution |
| `utils/logger.py` | ✅ Yes | Fork |
| `utils/diff.py` | ✅ Yes | Keep for diff-based evolution |
| `pipeline/main.py` Pipeline | ✅ Yes | Fork as services/worker/executor.py |
| eval scripts (.sh) | ❌ No | Rewrite as Python; ADR-002 |

### 6.2 What is NOT reusable (must be rebuilt)

- Manager agent: unused in demo experiments (manager: false)
- wandb logging: not carried forward to R U Socrates
- The entire `skills/evolve/` directory: different CLI paradigm (our API is FastAPI)

### 6.3 The eval_script pattern is the key abstraction

The Engineer agent's contract is:
1. Write generated code to `step_dir/code`
2. Call `eval_script` (any executable that produces `step_dir/results.json`)
3. Read `results.json` with required field `eval_score`

This is a clean abstraction. For Phase 1, we replace `bash script.sh` with a Python `subprocess.run()` call and keep the `results.json` contract.

### 6.4 LLM provider: any OpenAI-compatible API

The `create_llm_client()` reads:
```yaml
api:
  provider: "openai"   # label only, not actually used
  base_url: "..."      # any OpenAI-compatible endpoint
  api_key: "..."
  model: "..."
```

This means LiteLLM, Ollama, vLLM, DeepSeek, any custom endpoint — all work without code changes, as long as they implement the OpenAI `/v1/chat/completions` interface.

---

## 7. Execution Plan for Phase 0 (Local Run)

### Option A — Git Bash / WSL (Recommended)
```
cd prepare/ASI-Evolve-main
# Create symlink if needed
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -c "from Evolve.pipeline.main import Pipeline; ..."  # requires Evolve dir rename
```

### Option B — Modify Engineer for Windows
1. Change `["bash", script_path]` → `["python", evaluator_py, code_path, results_json]`
2. Bypass eval.sh entirely; call evaluator.py directly
3. Rename `ASI-Evolve-main` → `Evolve` (or add to PYTHONPATH)

### Recommended approach for Phase 0:
**Minimal changes to upstream source** — create a thin Windows launcher script that patches the engineer subprocess call at runtime, without modifying the upstream files.

---

## 8. Corrected Planning Assumptions

| Original Assumption | Correction |
|---------------------|------------|
| "ASI-Evolve runs locally with minimal config" | Partially true — requires package name fix and bash replacement |
| "wandb is optional" | ✅ Confirmed — only imported when `logging.wandb.enabled=true` |
| "psutil is available" | ❌ Not in requirements.txt — silent degradation without it |
| "eval.sh is a standard pattern" | Confirmed — results.json contract is the key abstraction |
| "LLM client works with any OpenAI-compatible API" | ✅ Confirmed — base_url + api_key is all that's needed |
| "Package import path is Evolve" | Confirmed — directory must be named `Evolve` (no hyphen) |

---

## 9. Decision Impact

### Items that do NOT need changes to ADRs or EXECUTION_PLAN:
- **ADR-001** (SQLite dev): No change. Confirmed — database is already FAISS-only, no SQL needed.
- **ADR-002** (no sandbox): Reinforced. Engineer already uses `subprocess.Popen` with timeout — sandboxing is the next layer.
- **ADR-003** (LiteLLM): Reinforced. LLM client already wraps OpenAI-compatible APIs; LiteLLM fits perfectly.

### Items that DO need to be noted:
- **Windows compatibility**: Phase 0 must be executed in a Unix-like environment (Git Bash / WSL) OR with minor engineer.py patches. Document this in EXECUTION_PLAN.
- **Package installation**: Need to handle `Evolve` vs `ASI-Evolve-main` naming before pip installing.
- **psutil**: Add to requirements.txt when forking into services/worker/.

---

## 10. Exit Criterion Assessment

> **One complete research loop run without error — STATUS: Blocked by Windows compatibility**

Execution cannot proceed until either:
1. A Unix-like shell (Git Bash / WSL) is available, OR
2. Engineer subprocess call is patched to use `python` instead of `bash`

Recommend: Option 1 (use Git Bash or WSL) for Phase 0, then build the Windows-compatible subprocess wrapper in Phase 1.
