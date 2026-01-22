import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.cave_details import Cave_detailsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/cave_details", tags=["cave_details"])


# ---------- Pydantic Schemas ----------
class Cave_detailsData(BaseModel):
    """Entity data schema (for create/update)"""
    anno: int
    numero_fascicolo: str = None
    azienda: str = None
    localita: str = None
    comune: str = None
    provincia: str = None
    dati_catastali: str = None
    stato_cava: str = None
    aperta_fino_al: int = None
    materiale: str = None
    numero_decreto: str = None
    data_decreto: str = None
    scadenza_autorizzazione: str = None
    created_at: Optional[datetime] = None


class Cave_detailsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    anno: Optional[int] = None
    numero_fascicolo: Optional[str] = None
    azienda: Optional[str] = None
    localita: Optional[str] = None
    comune: Optional[str] = None
    provincia: Optional[str] = None
    dati_catastali: Optional[str] = None
    stato_cava: Optional[str] = None
    aperta_fino_al: Optional[int] = None
    materiale: Optional[str] = None
    numero_decreto: Optional[str] = None
    data_decreto: Optional[str] = None
    scadenza_autorizzazione: Optional[str] = None
    created_at: Optional[datetime] = None


class Cave_detailsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    anno: int
    numero_fascicolo: Optional[str] = None
    azienda: Optional[str] = None
    localita: Optional[str] = None
    comune: Optional[str] = None
    provincia: Optional[str] = None
    dati_catastali: Optional[str] = None
    stato_cava: Optional[str] = None
    aperta_fino_al: Optional[int] = None
    materiale: Optional[str] = None
    numero_decreto: Optional[str] = None
    data_decreto: Optional[str] = None
    scadenza_autorizzazione: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Cave_detailsListResponse(BaseModel):
    """List response schema"""
    items: List[Cave_detailsResponse]
    total: int
    skip: int
    limit: int


class Cave_detailsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Cave_detailsData]


class Cave_detailsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Cave_detailsUpdateData


class Cave_detailsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Cave_detailsBatchUpdateItem]


class Cave_detailsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Cave_detailsListResponse)
async def query_cave_detailss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query cave_detailss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying cave_detailss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Cave_detailsService(db)
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
        logger.debug(f"Found {result['total']} cave_detailss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying cave_detailss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Cave_detailsListResponse)
async def query_cave_detailss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query cave_detailss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying cave_detailss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Cave_detailsService(db)
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
        logger.debug(f"Found {result['total']} cave_detailss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying cave_detailss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Cave_detailsResponse)
async def get_cave_details(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single cave_details by ID (user can only see their own records)"""
    logger.debug(f"Fetching cave_details with id: {id}, fields={fields}")
    
    service = Cave_detailsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Cave_details with id {id} not found")
            raise HTTPException(status_code=404, detail="Cave_details not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching cave_details {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Cave_detailsResponse, status_code=201)
async def create_cave_details(
    data: Cave_detailsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new cave_details"""
    logger.debug(f"Creating new cave_details with data: {data}")
    
    service = Cave_detailsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create cave_details")
        
        logger.info(f"Cave_details created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating cave_details: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating cave_details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Cave_detailsResponse], status_code=201)
async def create_cave_detailss_batch(
    request: Cave_detailsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple cave_detailss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} cave_detailss")
    
    service = Cave_detailsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} cave_detailss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Cave_detailsResponse])
async def update_cave_detailss_batch(
    request: Cave_detailsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple cave_detailss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} cave_detailss")
    
    service = Cave_detailsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} cave_detailss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Cave_detailsResponse)
async def update_cave_details(
    id: int,
    data: Cave_detailsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing cave_details (requires ownership)"""
    logger.debug(f"Updating cave_details {id} with data: {data}")

    service = Cave_detailsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Cave_details with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Cave_details not found")
        
        logger.info(f"Cave_details {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating cave_details {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating cave_details {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_cave_detailss_batch(
    request: Cave_detailsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple cave_detailss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} cave_detailss")
    
    service = Cave_detailsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} cave_detailss successfully")
        return {"message": f"Successfully deleted {deleted_count} cave_detailss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_cave_details(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single cave_details by ID (requires ownership)"""
    logger.debug(f"Deleting cave_details with id: {id}")
    
    service = Cave_detailsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Cave_details with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Cave_details not found")
        
        logger.info(f"Cave_details {id} deleted successfully")
        return {"message": "Cave_details deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting cave_details {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")