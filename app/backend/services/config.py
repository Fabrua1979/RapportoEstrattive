from datetime import datetime
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from models.config import ConfigProvince, ConfigMaterial, ConfigPriceMaterial, ConfigForeignDestination


class ConfigService:
    """Service for managing configuration data"""

    # Province Management
    @staticmethod
    async def get_provinces(db: AsyncSession, user_id: str):
        result = await db.execute(
            select(ConfigProvince).where(ConfigProvince.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create_province(db: AsyncSession, user_id: str, code: str, name: str):
        province = ConfigProvince(
            code=code,
            name=name,
            user_id=user_id,
            created_at=datetime.now()
        )
        db.add(province)
        await db.commit()
        await db.refresh(province)
        return province

    @staticmethod
    async def delete_province(db: AsyncSession, user_id: str, province_id: int):
        await db.execute(
            delete(ConfigProvince).where(
                ConfigProvince.id == province_id,
                ConfigProvince.user_id == user_id
            )
        )
        await db.commit()

    # Material Management
    @staticmethod
    async def get_materials(db: AsyncSession, user_id: str):
        result = await db.execute(
            select(ConfigMaterial).where(ConfigMaterial.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create_material(db: AsyncSession, user_id: str, name: str):
        material = ConfigMaterial(
            name=name,
            user_id=user_id,
            created_at=datetime.now()
        )
        db.add(material)
        await db.commit()
        await db.refresh(material)
        return material

    @staticmethod
    async def delete_material(db: AsyncSession, user_id: str, material_id: int):
        await db.execute(
            delete(ConfigMaterial).where(
                ConfigMaterial.id == material_id,
                ConfigMaterial.user_id == user_id
            )
        )
        await db.commit()

    # Price Material Management
    @staticmethod
    async def get_price_materials(db: AsyncSession, user_id: str):
        result = await db.execute(
            select(ConfigPriceMaterial).where(ConfigPriceMaterial.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create_price_material(db: AsyncSession, user_id: str, name: str, general_material: str):
        price_material = ConfigPriceMaterial(
            name=name,
            general_material=general_material,
            user_id=user_id,
            created_at=datetime.now()
        )
        db.add(price_material)
        await db.commit()
        await db.refresh(price_material)
        return price_material

    @staticmethod
    async def delete_price_material(db: AsyncSession, user_id: str, price_material_id: int):
        await db.execute(
            delete(ConfigPriceMaterial).where(
                ConfigPriceMaterial.id == price_material_id,
                ConfigPriceMaterial.user_id == user_id
            )
        )
        await db.commit()

    # Foreign Destination Management
    @staticmethod
    async def get_foreign_destinations(db: AsyncSession, user_id: str):
        result = await db.execute(
            select(ConfigForeignDestination).where(ConfigForeignDestination.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create_foreign_destination(db: AsyncSession, user_id: str, country: str):
        destination = ConfigForeignDestination(
            country=country,
            user_id=user_id,
            created_at=datetime.now()
        )
        db.add(destination)
        await db.commit()
        await db.refresh(destination)
        return destination

    @staticmethod
    async def delete_foreign_destination(db: AsyncSession, user_id: str, destination_id: int):
        await db.execute(
            delete(ConfigForeignDestination).where(
                ConfigForeignDestination.id == destination_id,
                ConfigForeignDestination.user_id == user_id
            )
        )
        await db.commit()