import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.extraction_data import Extraction_dataService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/extraction_data", tags=["extraction_data"])


# ---------- Pydantic Schemas ----------
class Extraction_dataData(BaseModel):
    """Entity data schema (for create/update)"""
    anno: int
    provincia: str
    materiale: str
    volume_m3: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Extraction_dataUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    anno: Optional[int] = None
    provincia: Optional[str] = None
    materiale: Optional[str] = None
    volume_m3: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Extraction_dataResponse(BaseModel):
    """Entity response schema"""
    id: int
    anno: int
    provincia: str
    materiale: str
    volume_m3: float
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Extraction_dataListResponse(BaseModel):
    """List response schema"""
    items: List[Extraction_dataResponse]
    total: int
    skip: int
    limit: int


class Extraction_dataBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Extraction_dataData]


class Extraction_dataBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Extraction_dataUpdateData


class Extraction_dataBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Extraction_dataBatchUpdateItem]


class Extraction_dataBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Extraction_dataListResponse)
async def query_extraction_datas(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query extraction_datas with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying extraction_datas: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Extraction_dataService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} extraction_datas")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying extraction_datas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Extraction_dataListResponse)
async def query_extraction_datas_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query extraction_datas with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying extraction_datas: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Extraction_dataService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} extraction_datas")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying extraction_datas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Extraction_dataResponse)
async def get_extraction_data(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single extraction_data by ID (user can only see their own records)"""
    logger.debug(f"Fetching extraction_data with id: {id}, fields={fields}")
    
    service = Extraction_dataService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Extraction_data with id {id} not found")
            raise HTTPException(status_code=404, detail="Extraction_data not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching extraction_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Extraction_dataResponse, status_code=201)
async def create_extraction_data(
    data: Extraction_dataData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new extraction_data"""
    logger.debug(f"Creating new extraction_data with data: {data}")
    
    service = Extraction_dataService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create extraction_data")
        
        logger.info(f"Extraction_data created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating extraction_data: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating extraction_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Extraction_dataResponse], status_code=201)
async def create_extraction_datas_batch(
    request: Extraction_dataBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple extraction_datas in a single request"""
    logger.debug(f"Batch creating {len(request.items)} extraction_datas")
    
    service = Extraction_dataService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} extraction_datas successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Extraction_dataResponse])
async def update_extraction_datas_batch(
    request: Extraction_dataBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple extraction_datas in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} extraction_datas")
    
    service = Extraction_dataService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} extraction_datas successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Extraction_dataResponse)
async def update_extraction_data(
    id: int,
    data: Extraction_dataUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing extraction_data (requires ownership)"""
    logger.debug(f"Updating extraction_data {id} with data: {data}")

    service = Extraction_dataService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Extraction_data with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Extraction_data not found")
        
        logger.info(f"Extraction_data {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating extraction_data {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating extraction_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_extraction_datas_batch(
    request: Extraction_dataBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple extraction_datas by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} extraction_datas")
    
    service = Extraction_dataService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} extraction_datas successfully")
        return {"message": f"Successfully deleted {deleted_count} extraction_datas", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_extraction_data(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single extraction_data by ID (requires ownership)"""
    logger.debug(f"Deleting extraction_data with id: {id}")
    
    service = Extraction_dataService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Extraction_data with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Extraction_data not found")
        
        logger.info(f"Extraction_data {id} deleted successfully")
        return {"message": "Extraction_data deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting extraction_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")