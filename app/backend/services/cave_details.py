import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.cave_details import Cave_details

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Cave_detailsService:
    """Service layer for Cave_details operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Cave_details]:
        """Create a new cave_details"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Cave_details(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created cave_details with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating cave_details: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for cave_details {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Cave_details]:
        """Get cave_details by ID (user can only see their own records)"""
        try:
            query = select(Cave_details).where(Cave_details.id == obj_id)
            if user_id:
                query = query.where(Cave_details.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching cave_details {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of cave_detailss (user can only see their own records)"""
        try:
            query = select(Cave_details)
            count_query = select(func.count(Cave_details.id))
            
            if user_id:
                query = query.where(Cave_details.user_id == user_id)
                count_query = count_query.where(Cave_details.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Cave_details, field):
                        query = query.where(getattr(Cave_details, field) == value)
                        count_query = count_query.where(getattr(Cave_details, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Cave_details, field_name):
                        query = query.order_by(getattr(Cave_details, field_name).desc())
                else:
                    if hasattr(Cave_details, sort):
                        query = query.order_by(getattr(Cave_details, sort))
            else:
                query = query.order_by(Cave_details.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching cave_details list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Cave_details]:
        """Update cave_details (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Cave_details {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated cave_details {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating cave_details {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete cave_details (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Cave_details {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted cave_details {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting cave_details {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Cave_details]:
        """Get cave_details by any field"""
        try:
            if not hasattr(Cave_details, field_name):
                raise ValueError(f"Field {field_name} does not exist on Cave_details")
            result = await self.db.execute(
                select(Cave_details).where(getattr(Cave_details, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching cave_details by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Cave_details]:
        """Get list of cave_detailss filtered by field"""
        try:
            if not hasattr(Cave_details, field_name):
                raise ValueError(f"Field {field_name} does not exist on Cave_details")
            result = await self.db.execute(
                select(Cave_details)
                .where(getattr(Cave_details, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Cave_details.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching cave_detailss by {field_name}: {str(e)}")
            raise