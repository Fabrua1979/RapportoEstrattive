from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from pydantic import BaseModel
from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.annual_cave_data import Annual_cave_data
from models.cave_details import Cave_details
from models.province_material_data import Province_material_data
from models.active_caves_data import Active_caves_data
from models.extraction_data import Extraction_data
from models.sales_data import Sales_data
from models.economic_data import Economic_data
from models.employment_data import Employment_data
from models.price_data import Price_data
from models.destination_data import Destination_data
from models.competitor_data import Competitor_data

router = APIRouter(prefix="/api/v1/data-reset", tags=["data-reset"])


class ResetDataRequest(BaseModel):
    chapter: str  # "cave_autorizzate", "cave_attive", "estrazioni", etc.
    anno: int


@router.post("/reset")
async def reset_data(
    data: ResetDataRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reset data for a specific chapter and year"""
    try:
        chapter_map = {
            "cave_autorizzate": [Annual_cave_data, Cave_details, Province_material_data],
            "cave_attive": [Active_caves_data],
            "estrazioni": [Extraction_data],
            "vendite": [Sales_data],
            "dati_economici": [Economic_data],
            "occupazione": [Employment_data],
            "prezzi": [Price_data],
            "destinazioni": [Destination_data],
            "concorrenti": [Competitor_data]
        }
        
        if data.chapter not in chapter_map:
            raise HTTPException(status_code=400, detail="Invalid chapter")
        
        models = chapter_map[data.chapter]
        deleted_count = 0
        
        for model in models:
            result = await db.execute(
                delete(model).where(
                    model.user_id == current_user.id,
                    model.anno == data.anno
                )
            )
            deleted_count += result.rowcount
        
        await db.commit()
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} records for chapter '{data.chapter}' and year {data.anno}"
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))