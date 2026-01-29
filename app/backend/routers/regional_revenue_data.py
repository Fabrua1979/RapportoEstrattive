import json
import logging
from typing import List, Optional


from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.regional_revenue_data import Regional_revenue_dataService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/regional_revenue_data", tags=["regional_revenue_data"])


# ---------- Pydantic Schemas ----------
class Regional_revenue_dataData(BaseModel):
    """Entity data schema (for create/update)"""
    anno: int
    importo_euro: float


class Regional_revenue_dataUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    anno: Optional[int] = None
    importo_euro: Optional[float] = None


class Regional_revenue_dataResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    anno: int
    importo_euro: float

    class Config:
        from_attributes = True


class Regional_revenue_dataListResponse(BaseModel):
    """List response schema"""
    items: List[Regional_revenue_dataResponse]
    total: int
    skip: int
    limit: int


class Regional_revenue_dataBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Regional_revenue_dataData]


class Regional_revenue_dataBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Regional_revenue_dataUpdateData


class Regional_revenue_dataBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Regional_revenue_dataBatchUpdateItem]


class Regional_revenue_dataBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Regional_revenue_dataListResponse)
async def query_regional_revenue_datas(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query regional_revenue_datas with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying regional_revenue_datas: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Regional_revenue_dataService(db)
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
        logger.debug(f"Found {result['total']} regional_revenue_datas")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying regional_revenue_datas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Regional_revenue_dataListResponse)
async def query_regional_revenue_datas_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query regional_revenue_datas with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying regional_revenue_datas: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Regional_revenue_dataService(db)
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
        logger.debug(f"Found {result['total']} regional_revenue_datas")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying regional_revenue_datas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Regional_revenue_dataResponse)
async def get_regional_revenue_data(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single regional_revenue_data by ID (user can only see their own records)"""
    logger.debug(f"Fetching regional_revenue_data with id: {id}, fields={fields}")
    
    service = Regional_revenue_dataService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Regional_revenue_data with id {id} not found")
            raise HTTPException(status_code=404, detail="Regional_revenue_data not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching regional_revenue_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Regional_revenue_dataResponse, status_code=201)
async def create_regional_revenue_data(
    data: Regional_revenue_dataData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new regional_revenue_data"""
    logger.debug(f"Creating new regional_revenue_data with data: {data}")
    
    service = Regional_revenue_dataService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create regional_revenue_data")
        
        logger.info(f"Regional_revenue_data created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating regional_revenue_data: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating regional_revenue_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Regional_revenue_dataResponse], status_code=201)
async def create_regional_revenue_datas_batch(
    request: Regional_revenue_dataBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple regional_revenue_datas in a single request"""
    logger.debug(f"Batch creating {len(request.items)} regional_revenue_datas")
    
    service = Regional_revenue_dataService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} regional_revenue_datas successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Regional_revenue_dataResponse])
async def update_regional_revenue_datas_batch(
    request: Regional_revenue_dataBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple regional_revenue_datas in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} regional_revenue_datas")
    
    service = Regional_revenue_dataService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} regional_revenue_datas successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Regional_revenue_dataResponse)
async def update_regional_revenue_data(
    id: int,
    data: Regional_revenue_dataUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing regional_revenue_data (requires ownership)"""
    logger.debug(f"Updating regional_revenue_data {id} with data: {data}")

    service = Regional_revenue_dataService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Regional_revenue_data with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Regional_revenue_data not found")
        
        logger.info(f"Regional_revenue_data {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating regional_revenue_data {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating regional_revenue_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_regional_revenue_datas_batch(
    request: Regional_revenue_dataBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple regional_revenue_datas by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} regional_revenue_datas")
    
    service = Regional_revenue_dataService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} regional_revenue_datas successfully")
        return {"message": f"Successfully deleted {deleted_count} regional_revenue_datas", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_regional_revenue_data(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single regional_revenue_data by ID (requires ownership)"""
    logger.debug(f"Deleting regional_revenue_data with id: {id}")
    
    service = Regional_revenue_dataService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Regional_revenue_data with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Regional_revenue_data not found")
        
        logger.info(f"Regional_revenue_data {id} deleted successfully")
        return {"message": "Regional_revenue_data deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting regional_revenue_data {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")