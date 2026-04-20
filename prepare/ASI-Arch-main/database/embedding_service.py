import logging
import os
from typing import List, Optional

import requests


class EmbeddingService:
    """Embedding service client for calling remote API to compute text vectors."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize embedding service.
        
        Args:
            api_key: API key, if not provided, will read from ARK_API_KEY environment variable
        """
        self.api_key = api_key or os.getenv('ARK_API_KEY')
        if not self.api_key:
            raise ValueError("Please set ARK_API_KEY environment variable or provide api_key parameter")
        
        self.base_url = "https://ark.cn-beijing.volces.com/api/v3/embeddings"
        self.model = "doubao-embedding-large-text-240915"
        self.logger = logging.getLogger(__name__)
        
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Get embedding vectors for texts.
        
        Args:
            texts: List of texts to compute embeddings for
            
        Returns:
            List[List[float]]: List of embedding vectors corresponding to each text
        """
        if not texts:
            return []
            
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "encoding_format": "float",
            "input": texts,
            "model": self.model
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # Extract embedding data
            embeddings = []
            for item in sorted(result['data'], key=lambda x: x['index']):
                embeddings.append(item['embedding'])
            
            self.logger.info(f"Successfully obtained embeddings for {len(embeddings)} texts")
            return embeddings
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to request embedding API: {e}")
            raise
        except KeyError as e:
            self.logger.error(f"Failed to parse embedding API response: {e}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to get embeddings: {e}")
            raise
    
    def get_single_embedding(self, text: str) -> List[float]:
        """
        Get embedding vector for single text.
        
        Args:
            text: Text to compute embedding for
            
        Returns:
            List[float]: Embedding vector of the text
        """
        embeddings = self.get_embeddings([text])
        return embeddings[0] if embeddings else []
    

# Global embedding service instance
_embedding_service = None

def get_embedding_service() -> EmbeddingService:
    """Get global embedding service instance."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service