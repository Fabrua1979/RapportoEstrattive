import asyncio
import sys
sys.path.insert(0, '/workspace/app/backend')

from core.database import db_manager
from models.regional_revenue_data import Regional_revenue_data

async def create_table():
    """Create the regional_revenue_data table"""
    try:
        print("Initializing database...")
        await db_manager.init_db()
        
        print("Creating regional_revenue_data table...")
        await db_manager.create_tables()
        
        print("✓ Table regional_revenue_data created successfully!")
        
    except Exception as e:
        print(f"✗ Error creating table: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_table())