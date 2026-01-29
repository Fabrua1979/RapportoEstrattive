import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.config_materials import Config_materials

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Config_materialsService:
    """Service layer for Config_materials operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Config_materials]:
        """Create a new config_materials"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Config_materials(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created config_materials with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating config_materials: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for config_materials {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Config_materials]:
        """Get config_materials by ID (user can only see their own records)"""
        try:
            query = select(Config_materials).where(Config_materials.id == obj_id)
            if user_id:
                query = query.where(Config_materials.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching config_materials {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of config_materialss (user can only see their own records)"""
        try:
            query = select(Config_materials)
            count_query = select(func.count(Config_materials.id))
            
            if user_id:
                query = query.where(Config_materials.user_id == user_id)
                count_query = count_query.where(Config_materials.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Config_materials, field):
                        query = query.where(getattr(Config_materials, field) == value)
                        count_query = count_query.where(getattr(Config_materials, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Config_materials, field_name):
                        query = query.order_by(getattr(Config_materials, field_name).desc())
                else:
                    if hasattr(Config_materials, sort):
                        query = query.order_by(getattr(Config_materials, sort))
            else:
                query = query.order_by(Config_materials.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching config_materials list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Config_materials]:
        """Update config_materials (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Config_materials {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated config_materials {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating config_materials {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete config_materials (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Config_materials {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted config_materials {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting config_materials {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Config_materials]:
        """Get config_materials by any field"""
        try:
            if not hasattr(Config_materials, field_name):
                raise ValueError(f"Field {field_name} does not exist on Config_materials")
            result = await self.db.execute(
                select(Config_materials).where(getattr(Config_materials, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching config_materials by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Config_materials]:
        """Get list of config_materialss filtered by field"""
        try:
            if not hasattr(Config_materials, field_name):
                raise ValueError(f"Field {field_name} does not exist on Config_materials")
            result = await self.db.execute(
                select(Config_materials)
                .where(getattr(Config_materials, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Config_materials.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching config_materialss by {field_name}: {str(e)}")
            raise