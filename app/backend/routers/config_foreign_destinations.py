import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.config_foreign_destinations import Config_foreign_destinationsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/config_foreign_destinations", tags=["config_foreign_destinations"])


# ---------- Pydantic Schemas ----------
class Config_foreign_destinationsData(BaseModel):
    """Entity data schema (for create/update)"""
    country: str
    created_at: Optional[datetime] = None


class Config_foreign_destinationsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    country: Optional[str] = None
    created_at: Optional[datetime] = None


class Config_foreign_destinationsResponse(BaseModel):
    """Entity response schema"""
    id: int
    country: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Config_foreign_destinationsListResponse(BaseModel):
    """List response schema"""
    items: List[Config_foreign_destinationsResponse]
    total: int
    skip: int
    limit: int


class Config_foreign_destinationsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Config_foreign_destinationsData]


class Config_foreign_destinationsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Config_foreign_destinationsUpdateData


class Config_foreign_destinationsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Config_foreign_destinationsBatchUpdateItem]


class Config_foreign_destinationsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Config_foreign_destinationsListResponse)
async def query_config_foreign_destinationss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query config_foreign_destinationss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying config_foreign_destinationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Config_foreign_destinationsService(db)
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
        logger.debug(f"Found {result['total']} config_foreign_destinationss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying config_foreign_destinationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Config_foreign_destinationsListResponse)
async def query_config_foreign_destinationss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query config_foreign_destinationss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying config_foreign_destinationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Config_foreign_destinationsService(db)
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
        logger.debug(f"Found {result['total']} config_foreign_destinationss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying config_foreign_destinationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Config_foreign_destinationsResponse)
async def get_config_foreign_destinations(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single config_foreign_destinations by ID (user can only see their own records)"""
    logger.debug(f"Fetching config_foreign_destinations with id: {id}, fields={fields}")
    
    service = Config_foreign_destinationsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Config_foreign_destinations with id {id} not found")
            raise HTTPException(status_code=404, detail="Config_foreign_destinations not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching config_foreign_destinations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Config_foreign_destinationsResponse, status_code=201)
async def create_config_foreign_destinations(
    data: Config_foreign_destinationsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new config_foreign_destinations"""
    logger.debug(f"Creating new config_foreign_destinations with data: {data}")
    
    service = Config_foreign_destinationsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create config_foreign_destinations")
        
        logger.info(f"Config_foreign_destinations created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating config_foreign_destinations: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating config_foreign_destinations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Config_foreign_destinationsResponse], status_code=201)
async def create_config_foreign_destinationss_batch(
    request: Config_foreign_destinationsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple config_foreign_destinationss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} config_foreign_destinationss")
    
    service = Config_foreign_destinationsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} config_foreign_destinationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Config_foreign_destinationsResponse])
async def update_config_foreign_destinationss_batch(
    request: Config_foreign_destinationsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple config_foreign_destinationss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} config_foreign_destinationss")
    
    service = Config_foreign_destinationsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} config_foreign_destinationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Config_foreign_destinationsResponse)
async def update_config_foreign_destinations(
    id: int,
    data: Config_foreign_destinationsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing config_foreign_destinations (requires ownership)"""
    logger.debug(f"Updating config_foreign_destinations {id} with data: {data}")

    service = Config_foreign_destinationsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Config_foreign_destinations with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Config_foreign_destinations not found")
        
        logger.info(f"Config_foreign_destinations {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating config_foreign_destinations {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating config_foreign_destinations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_config_foreign_destinationss_batch(
    request: Config_foreign_destinationsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple config_foreign_destinationss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} config_foreign_destinationss")
    
    service = Config_foreign_destinationsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} config_foreign_destinationss successfully")
        return {"message": f"Successfully deleted {deleted_count} config_foreign_destinationss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_config_foreign_destinations(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single config_foreign_destinations by ID (requires ownership)"""
    logger.debug(f"Deleting config_foreign_destinations with id: {id}")
    
    service = Config_foreign_destinationsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Config_foreign_destinations with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Config_foreign_destinations not found")
        
        logger.info(f"Config_foreign_destinations {id} deleted successfully")
        return {"message": "Config_foreign_destinations deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting config_foreign_destinations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")