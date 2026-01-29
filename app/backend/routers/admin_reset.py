import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.province_material_data import Province_material_data

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

@router.post("/reset_cave_autorizzate")
async def reset_cave_autorizzate(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reset all data in province_material_data table (Cave Autorizzate)"""
    try:
        result = await db.execute(delete(Province_material_data))
        await db.commit()
        
        deleted_count = result.rowcount
        logging.info(f"Admin {current_user.id} deleted {deleted_count} records from province_material_data")
        
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} records from Cave Autorizzate",
            "deleted_count": deleted_count
        }
    except Exception as e:
        await db.rollback()
        logging.error(f"Error resetting cave_autorizzate data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset data: {str(e)}")