#!/usr/bin/env python3
"""
MongoDB REST API Service
Provides HTTP interfaces to operate on a MongoDB database.
"""
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from mongodb_database import MongoDatabase
from util import DataElement
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Global database connection
db_connection = None
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    global db_connection
    # Initialization on startup
    logger.info("MongoDB API service starting")
    # Create database connection
    try:
        db_connection = MongoDatabase(
            connection_string="mongodb://admin:password123@localhost:27018",
            database_name="myapp",
            collection_name="data_elements"
        )
        logger.info("Database connection created successfully")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise
    
    yield
    
    # Cleanup on shutdown
    logger.info("Closing database connection...")
    if db_connection:
        try:
            db_connection.close()
            logger.info("Database connection closed")
        except Exception as e:
            logger.error(f"Failed to close connection: {e}")
# Create FastAPI application
app = FastAPI(
    title="MongoDB Database API",
    description="Provides HTTP interfaces to operate on a MongoDB database",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Pydantic model definitions
class DataElementRequest(BaseModel):
    """Request model for adding data elements"""
    time: str = Field(..., description="Timestamp")
    name: str = Field(..., description="Name")
    result: Dict[str, Any] = Field(..., description="Result (a dictionary containing fields like 'test')")
    program: str = Field(..., description="Program")
    analysis: str = Field(..., description="Analysis")
    cognition: str = Field(..., description="Cognition")
    log: str = Field(..., description="Complete experimental log")
    motivation: str = Field(..., description="Motivation")
    parent: Optional[int] = Field(None, description="Index of the parent node, None for root node")
    summary: str = Field("", description="Summary of the element")
class DataElementResponse(BaseModel):
    """Data element response model"""
    time: str
    name: str
    result: Dict[str, Any]
    program: str
    analysis: str
    cognition: str
    log: str
    motivation: str
    index: int
    parent: Optional[int] = None
    summary: str = ""
class ElementWithScore(DataElementResponse):
    """Data element response model, including an optional score"""
    score: Optional[float] = None
class CandidateResponse(DataElementResponse):
    """Candidate set element response model, including a score"""
    score: float
class ApiResponse(BaseModel):
    """General API response model"""
    success: bool
    message: str
    data: Optional[Any] = None
class StatsResponse(BaseModel):
    """Statistics information response model"""
    total_records: int
    unique_names: int
    database_size: int
    collection_size: int
    index_size: int
    storage_size: int
    average_object_size: int
    database_name: str
    collection_name: str
def get_database() -> MongoDatabase:
    """Get database connection"""
    if db_connection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not initialized"
        )
    return db_connection
# API route definitions
@app.get("/", response_model=ApiResponse)
async def root():
    """Root path, returns API information"""
    return ApiResponse(
        success=True,
        message="MongoDB database API service is running",
        data={
            "version": "1.0.0",
            "docs": "/docs",
            "redoc": "/redoc",
            "port": 8001
        }
    )
@app.get("/health")
async def health_check():
    """Health check"""
    try:
        # Test database connection
        db = get_database()
        stats = db.get_stats()
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": {
                "connected": True,
                "total_records": stats.get("total_records", 0)
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )
@app.post("/elements", response_model=ApiResponse)
async def add_element(element: DataElementRequest):
    """Add a data element"""
    try:
        db = get_database()
        
        success = await db.add_element(
            time=element.time,
            name=element.name,
            result=element.result,
            program=element.program,
            analysis=element.analysis,
            cognition=element.cognition,
            log=element.log,
            motivation=element.motivation,
            parent=element.parent,
            summary=element.summary
        )
        
        if success:
            return ApiResponse(
                success=True,
                message="Data element added successfully",
                data={"name": element.name}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add data element"
            )
            
    except Exception as e:
        logger.error(f"Failed to add element: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add element: {str(e)}"
        )
@app.get("/elements/sample", response_model=DataElementResponse)
async def sample_element():
    """Randomly sample a data element"""
    try:
        db = get_database()
        element = db.sample_element()
        
        if element:
            return DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data element not found"
            )
            
    except Exception as e:
        logger.error(f"Failed to sample element: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sample element: {str(e)}"
        )
@app.get("/elements/by-name/{name}", response_model=List[DataElementResponse])
async def get_elements_by_name(name: str):
    """Get data elements by name"""
    try:
        db = get_database()
        elements = db.get_by_name(name)
        
        response = []
        for element in elements:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to query by name: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query by name: {str(e)}"
        )
@app.get("/elements/with-score/by-name/{name}", response_model=List[ElementWithScore])
async def get_elements_with_score_by_name(name: str):
    """Get data elements and their scores by name"""
    try:
        db = get_database()
        elements = db.get_by_name(name)
        
        response = []
        for element in elements:
            # Get score (calculate if it doesn't exist)
            score = await db.get_or_calculate_element_score(element.index)
            
            response.append(ElementWithScore(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary,
                score=score
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get scored elements by name: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scored elements by name: {str(e)}"
        )
@app.get("/elements/with-score/by-index/{index}", response_model=ElementWithScore)
async def get_element_with_score_by_index(index: int):
    """Get a data element and its score by index"""
    try:
        db = get_database()
        element = db.get_by_index(index)
        if not element:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Element with index={index} not found"
            )
        
        # Get score (calculate if it doesn't exist)
        score = await db.get_or_calculate_element_score(element.index)
        
        return ElementWithScore(
            time=element.time,
            name=element.name,
            result=element.result,
            program=element.program,
            analysis=element.analysis,
            cognition=element.cognition,
            log=element.log,
            motivation=element.motivation,
            index=element.index,
            parent=element.parent,
            summary=element.summary,
            score=score
        )
            
    except Exception as e:
        logger.error(f"Failed to get scored element by index: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scored element by index: {str(e)}"
        )
@app.get("/elements/{index}/score", response_model=ApiResponse)
async def get_element_score(index: int):
    """Get the score of a single data element (calculate and cache if it doesn't exist)"""
    try:
        db = get_database()
        score = await db.get_or_calculate_element_score(index)
        
        if score is not None:
            return ApiResponse(
                success=True,
                message=f"Successfully retrieved the score for element {index}",
                data={"index": index, "score": score}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Element with index={index} not found"
            )
            
    except Exception as e:
        logger.error(f"Failed to get element score: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get element score: {str(e)}"
        )
@app.get("/elements/by-index/{index}", response_model=DataElementResponse)
async def get_element_by_index(index: int):
    """Get a data element by index"""
    try:
        db = get_database()
        element = db.get_by_index(index)
        if element:
            return DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data element not found"
            )
            
    except Exception as e:
        logger.error(f"Failed to query by index: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query by index: {str(e)}"
        )
@app.delete("/elements/by-index/{index}", response_model=ApiResponse)
async def delete_element_by_index(index: int):
    """Delete a data element by index"""
    try:
        db = get_database()
        success = db.delete_element_by_index(index)
        
        if success:
            return ApiResponse(success=True, message=f"Successfully deleted element with index={index}")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Element with index={index} not found or could not be deleted"
            )
            
    except Exception as e:
        logger.error(f"Failed to delete element: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete element: {str(e)}"
        )
    
@app.delete("/elements/by-name/{name}", response_model=ApiResponse)
async def delete_element_by_name(name: str):
    """Delete a data element by name"""
    try:
        db = get_database()
        success = db.delete_element_by_name(name)
        
        if success:
            return ApiResponse(success=True, message=f"Successfully deleted element with name={name}")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Element with name={name} not found or could not be deleted"
            )
            
    except Exception as e:
        logger.error(f"Failed to delete element: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete element: {str(e)}"
        )
@app.delete("/elements/all", response_model=ApiResponse)
async def delete_all_elements():
    """Delete all data elements"""
    try:
        db = get_database()
        success = db.delete_all_elements()
        
        if success:
            return ApiResponse(success=True, message="Successfully deleted all data elements")
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete all data elements"
            )
            
    except Exception as e:
        logger.error(f"Failed to delete all elements: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete all elements: {str(e)}"
        )
@app.post("/elements/clean-invalid", response_model=ApiResponse)
async def clean_invalid_elements():
    """
    Clean invalid elements where the result field only contains headers and no data.
    Child nodes of deleted nodes will be re-attached to their grandparents.
    """
    try:
        db = get_database()
        result = db.clean_invalid_result_elements()
        
        return ApiResponse(
            success=True,
            message="Cleaned invalid elements process completed.",
            data=result
        )
            
    except Exception as e:
        logger.error(f"Failed to clean invalid elements: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clean invalid elements: {str(e)}"
        )
@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get database statistics information"""
    try:
        db = get_database()
        stats = db.get_stats()
        
        return StatsResponse(
            total_records=stats.get("total_records", 0),
            unique_names=stats.get("unique_names", 0),
            database_size=stats.get("database_size", 0),
            collection_size=stats.get("collection_size", 0),
            index_size=stats.get("index_size", 0),
            storage_size=stats.get("storage_size", 0),
            average_object_size=stats.get("average_object_size", 0),
            database_name=stats.get("database_name", ""),
            collection_name=stats.get("collection_name", "")
        )
        
    except Exception as e:
        logger.error(f"Failed to get statistics information: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistics information: {str(e)}"
        )
@app.post("/repair", response_model=ApiResponse)
async def repair_database():
    """Repair the database"""
    try:
        db = get_database()
        success = db.repair_database()
        
        if success:
            return ApiResponse(
                success=True,
                message="Database repair successful"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database repair failed"
            )
            
    except Exception as e:
        logger.error(f"Database repair failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database repair failed: {str(e)}"
        )
@app.get("/elements/top-k/{k}", response_model=List[DataElementResponse])
async def get_top_k_results(k: int):
    """Get the top k results based on result"""
    try:
        if k <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="k must be a positive integer"
            )
        
        if k > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="k cannot exceed 1000"
            )
        
        db = get_database()
        elements = db.get_top_k_results(k)
        
        response = []
        for element in elements:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get top-k results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get top-k results: {str(e)}"
        )
@app.get("/elements/sample-range/{a}/{b}/{k}", response_model=List[DataElementResponse])
async def sample_from_range(a: int, b: int, k: int):
    """Randomly sample k results within the range of a to b (after sorting)"""
    try:
        # Parameter validation
        if a <= 0 or b <= 0 or k <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All parameters must be positive integers"
            )
        
        if a > b:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The starting position cannot be greater than the ending position"
            )
        
        if k > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The sampling quantity cannot exceed 1000"
            )
        
        if (b - a + 1) > 10000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The range cannot exceed 10000"
            )
        
        db = get_database()
        elements = db.sample_from_range(a, b, k)
        
        response = []
        for element in elements:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to sample from range: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sample from range: {str(e)}"
        )
@app.get("/elements/search-similar", response_model=List[DataElementResponse])
async def search_similar_motivations(
    motivation: str,
    top_k: int = 5
):
    """Search for the most similar data elements based on motivation text"""
    try:
        # Parameter validation
        if top_k <= 0 or top_k > 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="top_k must be between 1 and 20"
            )
        
        db = get_database()
        
        # Call the database search method
        similar_results = db.search_similar_motivations(
            query_motivation=motivation,
            k=top_k
        )
        
        # Directly return a list of DataElementResponse
        response = []
        for element, similarity_score in similar_results:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Similarity search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similarity search failed: {str(e)}"
        )
@app.post("/faiss/rebuild", response_model=ApiResponse)
async def rebuild_faiss_index():
    """Rebuild the FAISS index"""
    try:
        db = get_database()
        success = db.rebuild_faiss_index()
        
        if success:
            return ApiResponse(
                success=True,
                message="FAISS index rebuilt successfully",
                data={}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="FAISS index rebuild failed"
            )
            
    except Exception as e:
        logger.error(f"Failed to rebuild FAISS index: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild FAISS index: {str(e)}"
        )
@app.get("/faiss/stats")
async def get_faiss_stats():
    """Get FAISS index statistics"""
    try:
        db = get_database()
        stats = db.get_faiss_stats()
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get FAISS statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get FAISS statistics: {str(e)}"
        )
@app.post("/faiss/clean-orphans", response_model=ApiResponse)
async def clean_faiss_orphans():
    """Clean orphan vectors in the FAISS index"""
    try:
        db = get_database()
        result = db.clean_faiss_orphans()
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to clean FAISS orphan vectors: {result['error']}"
            )
        
        return ApiResponse(
            success=True,
            message=f"FAISS orphan vectors cleaned, cleaned {result.get('cleaned', 0)} orphan vectors",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Failed to clean FAISS orphan vectors: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clean FAISS orphan vectors: {str(e)}"
        )

@app.get("/candidates/stats")
async def get_candidate_stats():
    """Get candidate set statistics"""
    try:
        db = get_database()
        stats = db.get_candidate_stats()
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get candidate set statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get candidate set statistics: {str(e)}"
        )
@app.get("/candidates/new-data-count", response_model=ApiResponse)
async def get_candidate_new_data_count():
    """Get the current new data count of the candidate set"""
    try:
        db = get_database()
        count = db.get_candidate_new_data_count()
        
        if count != -1:
            return ApiResponse(
                success=True,
                message="Successfully retrieved new data count",
                data={"new_data_count": count}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get new data count"
            )
        
    except Exception as e:
        logger.error(f"Failed to get new data count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get new data count: {str(e)}"
        )
@app.get("/candidates/top-k/{k}", response_model=List[DataElementResponse])
async def get_candidate_top_k(k: int):
    """Get the top-k elements from the candidate set"""
    try:
        if k <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="k must be a positive integer"
            )
        
        if k > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="k cannot exceed 50 (candidate set capacity)"
            )
        
        db = get_database()
        elements = db.get_candidate_top_k(k)
        
        response = []
        for element in elements:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get candidate top-k: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get candidate top-k: {str(e)}"
        )
@app.get("/candidates/all", response_model=List[CandidateResponse])
async def get_all_candidates_with_scores():
    """Get all candidate set elements and their scores"""
    try:
        db = get_database()
        candidates = db.get_all_candidates_with_scores()
        
        response = []
        for element in candidates:
            response.append(CandidateResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary,
                score=element.score
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get all candidates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get all candidates: {str(e)}"
        )
@app.get("/candidates/sample-range/{a}/{b}/{k}", response_model=List[DataElementResponse])
async def candidate_sample_from_range(a: int, b: int, k: int):
    """Randomly sample k elements within a specified range in the candidate set"""
    try:
        # Parameter validation
        if a <= 0 or b <= 0 or k <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All parameters must be positive integers"
            )
        
        if a > b:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The starting position cannot be greater than the ending position"
            )
        
        if k > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The sampling quantity cannot exceed 50"
            )
        
        if (b - a + 1) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The range cannot exceed 50"
            )
        
        db = get_database()
        elements = db.candidate_sample_from_range(a, b, k)
        
        response = []
        for element in elements:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to sample from candidate set range: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sample from candidate set range: {str(e)}"
        )
@app.post("/candidates/{index}/add", response_model=ApiResponse)
async def add_to_candidates(index: int):
    """Manually add the specified element to the candidate set"""
    try:
        db = get_database()
        
        # First, get the element
        element = db.get_by_index(index)
        if not element:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Element with index={index} not found"
            )
        
        # Add to the candidate set
        success = await db.add_to_candidates(element)
        
        if success:
            return ApiResponse(
                success=True,
                message=f"Successfully added element with index={index} to the candidate set",
                data={"index": index}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add to candidate set"
            )
            
    except Exception as e:
        logger.error(f"Failed to add to candidate set: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add to candidate set: {str(e)}"
        )
@app.delete("/candidates/by-index/{index}", response_model=ApiResponse)
async def delete_candidate_by_index(index: int):
    """Delete an element from the candidate set by index"""
    try:
        db = get_database()
        success = db.delete_candidate_by_index(index)
        
        if success:
            return ApiResponse(
                success=True,
                message=f"Successfully deleted element with index={index} from the candidate set"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Element with index={index} not found in the candidate set"
            )
            
    except Exception as e:
        logger.error(f"Failed to delete element from candidate set: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete element from candidate set: {str(e)}"
        )
@app.delete("/candidates/by-name/{name}", response_model=ApiResponse)
async def delete_candidate_by_name(name: str):
    """Delete elements from the candidate set by name"""
    try:
        db = get_database()
        deleted_count = db.delete_candidate_by_name(name)
        
        return ApiResponse(
            success=True,
            message=f"Successfully deleted {deleted_count} elements with name={name} from the candidate set",
            data={"deleted_count": deleted_count}
        )
        
    except Exception as e:
        logger.error(f"Failed to delete element from candidate set: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete element from candidate set: {str(e)}"
        )
@app.put("/candidates/{index}", response_model=ApiResponse)
async def update_candidate(index: int):
    """Update a specific element in the candidate set (re-fetch from the database and update the score)"""
    try:
        db = get_database()
        
        # First, get the latest version of the element
        element = db.get_by_index(index)
        if not element:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Element with index={index} not found"
            )
        
        # Update the element in the candidate set
        success = await db.update_candidate(element)
        
        if success:
            return ApiResponse(
                success=True,
                message=f"Successfully updated element with index={index} in the candidate set",
                data={"index": index}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Element with index={index} not found in the candidate set"
            )
            
    except Exception as e:
        logger.error(f"Failed to update candidate set element: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update candidate set element: {str(e)}"
        )
@app.post("/candidates/force-update", response_model=ApiResponse)
async def force_update_candidates():
    """Force update the candidate set"""
    try:
        db = get_database()
        result = await db.force_update_candidates()
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to force update candidate set: {result['error']}"
            )
        
        return ApiResponse(
            success=True,
            message="Candidate set force update completed",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Failed to force update candidate set: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to force update candidate set: {str(e)}"
        )
@app.post("/candidates/rebuild-from-scored", response_model=ApiResponse)
async def rebuild_candidates_from_scored():
    """Rebuild the candidate set using all scored elements in the database (Top-50)"""
    try:
        db = get_database()
        result = await db.rebuild_candidates_from_scored_elements()
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to rebuild candidate set: {result['error']}"
            )
        
        return ApiResponse(
            success=True,
            message="Successfully rebuilt candidate set using scored elements",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Failed to rebuild candidate set: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild candidate set: {str(e)}"
        )
@app.delete("/candidates/all", response_model=ApiResponse)
async def clear_candidates():
    """Clear the candidate set"""
    try:
        db = get_database()
        success = db.clear_candidates()
        
        if success:
            return ApiResponse(
                success=True,
                message="Candidate set cleared"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clear candidate set"
            )
            
    except Exception as e:
        logger.error(f"Failed to clear candidate set: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear candidate set: {str(e)}"
        )
# Tree Structure Related API Interfaces
class SetParentRequest(BaseModel):
    """Request model for setting the parent node"""
    parent_index: Optional[int] = Field(None, description="Index of the parent node, None means set to root node")
@app.post("/elements/{child_index}/set-parent", response_model=ApiResponse)
async def set_parent(
    child_index: int,
    request: SetParentRequest
):
    """Set the parent node of a specified element"""
    try:
        db = get_database()
        success = db.set_parent(child_index, request.parent_index)
        
        if success:
            return ApiResponse(
                success=True,
                message=f"Successfully set the parent node of element {child_index} to {request.parent_index}",
                data={"child_index": child_index, "parent_index": request.parent_index}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to set parent node"
            )
            
    except Exception as e:
        logger.error(f"Failed to set parent node: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set parent node: {str(e)}"
        )
@app.get("/elements/{parent_index}/children", response_model=List[DataElementResponse])
async def get_children(parent_index: int):
    """Get all child nodes of a specified node"""
    try:
        db = get_database()
        children = db.get_children(parent_index)
        
        response = []
        for element in children:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get child nodes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get child nodes: {str(e)}"
        )
@app.get("/elements/roots", response_model=List[DataElementResponse])
async def get_root_nodes():
    """Get all root nodes"""
    try:
        db = get_database()
        roots = db.get_root_nodes()
        
        response = []
        for element in roots:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get root nodes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get root nodes: {str(e)}"
        )
@app.get("/elements/{index}/path", response_model=List[DataElementResponse])
async def get_tree_path(index: int):
    """Get the path from the root node to a specified node"""
    try:
        db = get_database()
        path = db.get_tree_path(index)
        
        response = []
        for element in path:
            response.append(DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get tree path: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tree path: {str(e)}"
        )
@app.get("/tree-structure")
async def get_tree_structure(root_index: Optional[int] = None):
    """Get the complete information of the tree structure"""
    try:
        db = get_database()
        tree_structure = db.get_tree_structure(root_index)
        
        return {
            "success": True,
            "data": tree_structure
        }
        
    except Exception as e:
        logger.error(f"Failed to get tree structure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tree structure: {str(e)}"
        )
def _to_response_model(element: Optional[DataElement]) -> Optional[DataElementResponse]:
    """Converts a DataElement to a DataElementResponse model, handling the None case"""
    if element is None:
        return None
    return DataElementResponse(
        time=element.time,
        name=element.name,
        result=element.result,
        program=element.program,
        analysis=element.analysis,
        cognition=element.cognition,
        log=element.log,
        motivation=element.motivation,
        index=element.index,
        parent=element.parent,
        summary=element.summary
    )
@app.get("/elements/context/{parent_index}", response_model=ApiResponse)
async def get_contextual_nodes(parent_index: int):
    """Get contextual nodes based on the parent index (parent, grandparent, strongest siblings)"""
    try:
        db = get_database()
        context = db.get_contextual_nodes(parent_index)
        
        # If the parent node doesn't exist, get_contextual_nodes will return a dictionary containing None values
        if context.get("direct_parent") is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent node {parent_index} does not exist"
            )
        
        response_data = {
            "direct_parent": _to_response_model(context["direct_parent"]),
            "strongest_siblings": [_to_response_model(element) for element in context["strongest_siblings"]],
            "grandparent": _to_response_model(context["grandparent"])
        }
        
        return ApiResponse(
            success=True,
            message="Successfully obtained contextual nodes",
            data=response_data
        )
    except HTTPException as e:
        # Re-raise known HTTP exceptions
        raise e
    except Exception as e:
        logger.error(f"Failed to get contextual nodes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get contextual nodes: {str(e)}"
        )
# UCT Algorithm Related API Interfaces
class UCTScoreResponse(BaseModel):
    """UCT score response model"""
    index: int
    name: str
    base_score: float
    n_node: int
    exploration_term: Any  # Can be a number or "infinite"
    uct_score: Any  # Can be a number or "infinite"
    summary: str
@app.get("/elements/uct-select", response_model=DataElementResponse)
async def uct_select_node(c_param: float = 1.414):
    """Select a node using the UCT algorithm"""
    try:
        # Parameter validation
        if c_param <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="c_param must be positive"
            )
        
        if c_param > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="c_param cannot exceed 10"
            )
        
        db = get_database()
        element = db.uct_select_node(c_param)
        
        if element:
            return DataElementResponse(
                time=element.time,
                name=element.name,
                result=element.result,
                program=element.program,
                analysis=element.analysis,
                cognition=element.cognition,
                log=element.log,
                motivation=element.motivation,
                index=element.index,
                parent=element.parent,
                summary=element.summary
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No selectable nodes found"
            )
            
    except Exception as e:
        logger.error(f"UCT node selection failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"UCT node selection failed: {str(e)}"
        )
@app.get("/elements/uct-scores", response_model=List[UCTScoreResponse])
async def get_uct_scores(c_param: float = 1.414):
    """Get UCT score details for all nodes"""
    try:
        # Parameter validation
        if c_param <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="c_param must be positive"
            )
        
        if c_param > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="c_param cannot exceed 10"
            )
        
        db = get_database()
        uct_scores = db.get_uct_scores(c_param)
        
        response = []
        for score_info in uct_scores:
            response.append(UCTScoreResponse(
                index=score_info["index"],
                name=score_info["name"],
                base_score=score_info["base_score"],
                n_node=score_info["n_node"],
                exploration_term=score_info["exploration_term"],
                uct_score=score_info["uct_score"],
                summary=score_info["summary"]
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get UCT scores: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get UCT scores: {str(e)}"
        )
# Startup Configuration
if __name__ == "__main__":
    uvicorn.run(
        "mongodb_api:app",
        host="0.0.0.0",
        port=8001,  # Changed to port 8001
        reload=True,
        log_level="info"
    )