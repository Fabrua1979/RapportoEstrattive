import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.config_price_materials import Config_price_materialsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/config_price_materials", tags=["config_price_materials"])


# ---------- Pydantic Schemas ----------
class Config_price_materialsData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    general_material: str
    created_at: Optional[datetime] = None


class Config_price_materialsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    general_material: Optional[str] = None
    created_at: Optional[datetime] = None


class Config_price_materialsResponse(BaseModel):
    """Entity response schema"""
    id: int
    name: str
    general_material: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Config_price_materialsListResponse(BaseModel):
    """List response schema"""
    items: List[Config_price_materialsResponse]
    total: int
    skip: int
    limit: int


class Config_price_materialsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Config_price_materialsData]


class Config_price_materialsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Config_price_materialsUpdateData


class Config_price_materialsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Config_price_materialsBatchUpdateItem]


class Config_price_materialsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Config_price_materialsListResponse)
async def query_config_price_materialss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query config_price_materialss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying config_price_materialss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Config_price_materialsService(db)
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
        logger.debug(f"Found {result['total']} config_price_materialss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying config_price_materialss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Config_price_materialsListResponse)
async def query_config_price_materialss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query config_price_materialss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying config_price_materialss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Config_price_materialsService(db)
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
        logger.debug(f"Found {result['total']} config_price_materialss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying config_price_materialss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Config_price_materialsResponse)
async def get_config_price_materials(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single config_price_materials by ID (user can only see their own records)"""
    logger.debug(f"Fetching config_price_materials with id: {id}, fields={fields}")
    
    service = Config_price_materialsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Config_price_materials with id {id} not found")
            raise HTTPException(status_code=404, detail="Config_price_materials not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching config_price_materials {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Config_price_materialsResponse, status_code=201)
async def create_config_price_materials(
    data: Config_price_materialsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new config_price_materials"""
    logger.debug(f"Creating new config_price_materials with data: {data}")
    
    service = Config_price_materialsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create config_price_materials")
        
        logger.info(f"Config_price_materials created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating config_price_materials: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating config_price_materials: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Config_price_materialsResponse], status_code=201)
async def create_config_price_materialss_batch(
    request: Config_price_materialsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple config_price_materialss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} config_price_materialss")
    
    service = Config_price_materialsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} config_price_materialss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Config_price_materialsResponse])
async def update_config_price_materialss_batch(
    request: Config_price_materialsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple config_price_materialss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} config_price_materialss")
    
    service = Config_price_materialsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} config_price_materialss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Config_price_materialsResponse)
async def update_config_price_materials(
    id: int,
    data: Config_price_materialsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing config_price_materials (requires ownership)"""
    logger.debug(f"Updating config_price_materials {id} with data: {data}")

    service = Config_price_materialsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Config_price_materials with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Config_price_materials not found")
        
        logger.info(f"Config_price_materials {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating config_price_materials {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating config_price_materials {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_config_price_materialss_batch(
    request: Config_price_materialsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple config_price_materialss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} config_price_materialss")
    
    service = Config_price_materialsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} config_price_materialss successfully")
        return {"message": f"Successfully deleted {deleted_count} config_price_materialss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_config_price_materials(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single config_price_materials by ID (requires ownership)"""
    logger.debug(f"Deleting config_price_materials with id: {id}")
    
    service = Config_price_materialsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Config_price_materials with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Config_price_materials not found")
        
        logger.info(f"Config_price_materials {id} deleted successfully")
        return {"message": "Config_price_materials deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting config_price_materials {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")