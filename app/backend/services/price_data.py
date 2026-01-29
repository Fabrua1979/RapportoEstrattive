import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.price_data import Price_data

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Price_dataService:
    """Service layer for Price_data operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Price_data]:
        """Create a new price_data"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Price_data(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created price_data with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating price_data: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for price_data {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Price_data]:
        """Get price_data by ID (user can only see their own records)"""
        try:
            query = select(Price_data).where(Price_data.id == obj_id)
            if user_id:
                query = query.where(Price_data.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching price_data {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of price_datas (user can only see their own records)"""
        try:
            query = select(Price_data)
            count_query = select(func.count(Price_data.id))
            
            if user_id:
                query = query.where(Price_data.user_id == user_id)
                count_query = count_query.where(Price_data.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Price_data, field):
                        query = query.where(getattr(Price_data, field) == value)
                        count_query = count_query.where(getattr(Price_data, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Price_data, field_name):
                        query = query.order_by(getattr(Price_data, field_name).desc())
                else:
                    if hasattr(Price_data, sort):
                        query = query.order_by(getattr(Price_data, sort))
            else:
                query = query.order_by(Price_data.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching price_data list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Price_data]:
        """Update price_data (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Price_data {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated price_data {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating price_data {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete price_data (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Price_data {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted price_data {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting price_data {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Price_data]:
        """Get price_data by any field"""
        try:
            if not hasattr(Price_data, field_name):
                raise ValueError(f"Field {field_name} does not exist on Price_data")
            result = await self.db.execute(
                select(Price_data).where(getattr(Price_data, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching price_data by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Price_data]:
        """Get list of price_datas filtered by field"""
        try:
            if not hasattr(Price_data, field_name):
                raise ValueError(f"Field {field_name} does not exist on Price_data")
            result = await self.db.execute(
                select(Price_data)
                .where(getattr(Price_data, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Price_data.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching price_datas by {field_name}: {str(e)}")
            raise