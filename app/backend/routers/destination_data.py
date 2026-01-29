import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.destination_data import Destination_dataService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/destination_data", tags=["destination_data"])


# ---------- Pydantic Schemas ----------
class Destination_dataData(BaseModel):
    """Entity data schema (for create/update)"""
    anno: int
    provincia: str
    materiale: str
    destinazione_tipo: str
    destinazione_dettaglio: str = None
    volume_m3: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Destination_dataUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    anno: Optional[int] = None
    provincia: Optional[str] = None
    materiale: Optional[str] = None
    destinazione_tipo: Optional[str] = None
    destinazione_dettaglio: Optional[str] = None
    volume_m3: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Destination_dataResponse(BaseModel):
    """Entity response schema"""
    id: int
    anno: int
    provincia: str
    materiale: str
    destinazione_tipo: str
    destinazione_dettaglio: Optional[str] = None
    volume_m3: float
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Destination_dataListResponse(BaseModel):
    """List response schema"""
    items: List[Destination_dataResponse]
    total: int
    skip: int
    limit: int


class Destination_dataBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Destination_dataData]


class Destination_dataBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Destination_dataUpdateData


class Destination_dataBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Destination_dataBatchUpdateItem]


class Destination_dataBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Destination_dataListResponse)
async def query_destination_datas(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query destination_datas with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying destination_datas: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Destination_dataService(db)
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
        logger.debug(f"Found {result['total']} destination_datas")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying destination_datas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Destination_dataListResponse)
async def query_destination_datas_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query destination_datas with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying destination_datas: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Destination_dataService(db)
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
        logger.debug(f"Found {result['total']} destination_datas")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying destination_datas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Destination_dataResponse)
async def get_destination_data(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single destination_data by ID (user can only see their own records)"""
    logger.debug(f"Fetching destination_data with id: {id}, fields={fields}")
    
    service = Destination_dataService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Destination_data with id {id} not found")
            raise HTTPException(status_code=404, detail="Destination_data not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching destination_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Destination_dataResponse, status_code=201)
async def create_destination_data(
    data: Destination_dataData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new destination_data"""
    logger.debug(f"Creating new destination_data with data: {data}")
    
    service = Destination_dataService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create destination_data")
        
        logger.info(f"Destination_data created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating destination_data: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating destination_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Destination_dataResponse], status_code=201)
async def create_destination_datas_batch(
    request: Destination_dataBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple destination_datas in a single request"""
    logger.debug(f"Batch creating {len(request.items)} destination_datas")
    
    service = Destination_dataService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} destination_datas successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Destination_dataResponse])
async def update_destination_datas_batch(
    request: Destination_dataBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple destination_datas in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} destination_datas")
    
    service = Destination_dataService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} destination_datas successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Destination_dataResponse)
async def update_destination_data(
    id: int,
    data: Destination_dataUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing destination_data (requires ownership)"""
    logger.debug(f"Updating destination_data {id} with data: {data}")

    service = Destination_dataService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Destination_data with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Destination_data not found")
        
        logger.info(f"Destination_data {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating destination_data {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating destination_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_destination_datas_batch(
    request: Destination_dataBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple destination_datas by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} destination_datas")
    
    service = Destination_dataService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} destination_datas successfully")
        return {"message": f"Successfully deleted {deleted_count} destination_datas", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_destination_data(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single destination_data by ID (requires ownership)"""
    logger.debug(f"Deleting destination_data with id: {id}")
    
    service = Destination_dataService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Destination_data with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Destination_data not found")
        
        logger.info(f"Destination_data {id} deleted successfully")
        return {"message": "Destination_data deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting destination_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")