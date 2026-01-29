import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.config_foreign_destinations import Config_foreign_destinations

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Config_foreign_destinationsService:
    """Service layer for Config_foreign_destinations operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Config_foreign_destinations]:
        """Create a new config_foreign_destinations"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Config_foreign_destinations(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created config_foreign_destinations with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating config_foreign_destinations: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for config_foreign_destinations {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Config_foreign_destinations]:
        """Get config_foreign_destinations by ID (user can only see their own records)"""
        try:
            query = select(Config_foreign_destinations).where(Config_foreign_destinations.id == obj_id)
            if user_id:
                query = query.where(Config_foreign_destinations.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching config_foreign_destinations {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of config_foreign_destinationss (user can only see their own records)"""
        try:
            query = select(Config_foreign_destinations)
            count_query = select(func.count(Config_foreign_destinations.id))
            
            if user_id:
                query = query.where(Config_foreign_destinations.user_id == user_id)
                count_query = count_query.where(Config_foreign_destinations.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Config_foreign_destinations, field):
                        query = query.where(getattr(Config_foreign_destinations, field) == value)
                        count_query = count_query.where(getattr(Config_foreign_destinations, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Config_foreign_destinations, field_name):
                        query = query.order_by(getattr(Config_foreign_destinations, field_name).desc())
                else:
                    if hasattr(Config_foreign_destinations, sort):
                        query = query.order_by(getattr(Config_foreign_destinations, sort))
            else:
                query = query.order_by(Config_foreign_destinations.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching config_foreign_destinations list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Config_foreign_destinations]:
        """Update config_foreign_destinations (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Config_foreign_destinations {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated config_foreign_destinations {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating config_foreign_destinations {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete config_foreign_destinations (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Config_foreign_destinations {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted config_foreign_destinations {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting config_foreign_destinations {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Config_foreign_destinations]:
        """Get config_foreign_destinations by any field"""
        try:
            if not hasattr(Config_foreign_destinations, field_name):
                raise ValueError(f"Field {field_name} does not exist on Config_foreign_destinations")
            result = await self.db.execute(
                select(Config_foreign_destinations).where(getattr(Config_foreign_destinations, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching config_foreign_destinations by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Config_foreign_destinations]:
        """Get list of config_foreign_destinationss filtered by field"""
        try:
            if not hasattr(Config_foreign_destinations, field_name):
                raise ValueError(f"Field {field_name} does not exist on Config_foreign_destinations")
            result = await self.db.execute(
                select(Config_foreign_destinations)
                .where(getattr(Config_foreign_destinations, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Config_foreign_destinations.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching config_foreign_destinationss by {field_name}: {str(e)}")
            raise