from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.config import ConfigService

router = APIRouter(prefix="/api/v1/config", tags=["config"])


# Request/Response Models
class ProvinceCreate(BaseModel):
    code: str
    name: str


class MaterialCreate(BaseModel):
    name: str


class PriceMaterialCreate(BaseModel):
    name: str
    general_material: str


class ForeignDestinationCreate(BaseModel):
    country: str


# Province Endpoints
@router.get("/provinces")
async def get_provinces(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    provinces = await ConfigService.get_provinces(db, current_user.id)
    return {"provinces": [{"id": p.id, "code": p.code, "name": p.name} for p in provinces]}


@router.post("/provinces")
async def create_province(
    data: ProvinceCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        province = await ConfigService.create_province(db, current_user.id, data.code, data.name)
        return {"id": province.id, "code": province.code, "name": province.name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/provinces/{province_id}")
async def delete_province(
    province_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await ConfigService.delete_province(db, current_user.id, province_id)
    return {"success": True}


# Material Endpoints
@router.get("/materials")
async def get_materials(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    materials = await ConfigService.get_materials(db, current_user.id)
    return {"materials": [{"id": m.id, "name": m.name} for m in materials]}


@router.post("/materials")
async def create_material(
    data: MaterialCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        material = await ConfigService.create_material(db, current_user.id, data.name)
        return {"id": material.id, "name": material.name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/materials/{material_id}")
async def delete_material(
    material_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await ConfigService.delete_material(db, current_user.id, material_id)
    return {"success": True}


# Price Material Endpoints
@router.get("/price-materials")
async def get_price_materials(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    price_materials = await ConfigService.get_price_materials(db, current_user.id)
    return {"price_materials": [{"id": pm.id, "name": pm.name, "general_material": pm.general_material} for pm in price_materials]}


@router.post("/price-materials")
async def create_price_material(
    data: PriceMaterialCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        price_material = await ConfigService.create_price_material(db, current_user.id, data.name, data.general_material)
        return {"id": price_material.id, "name": price_material.name, "general_material": price_material.general_material}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/price-materials/{price_material_id}")
async def delete_price_material(
    price_material_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await ConfigService.delete_price_material(db, current_user.id, price_material_id)
    return {"success": True}


# Foreign Destination Endpoints
@router.get("/foreign-destinations")
async def get_foreign_destinations(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    destinations = await ConfigService.get_foreign_destinations(db, current_user.id)
    return {"destinations": [{"id": d.id, "country": d.country} for d in destinations]}


@router.post("/foreign-destinations")
async def create_foreign_destination(
    data: ForeignDestinationCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        destination = await ConfigService.create_foreign_destination(db, current_user.id, data.country)
        return {"id": destination.id, "country": destination.country}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/foreign-destinations/{destination_id}")
async def delete_foreign_destination(
    destination_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await ConfigService.delete_foreign_destination(db, current_user.id, destination_id)
    return {"success": True}