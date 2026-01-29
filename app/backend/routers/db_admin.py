"""
Database Administration Router
Provides endpoints for database inspection and management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, inspect
from typing import List, Dict, Any
from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

router = APIRouter(prefix="/api/v1/db-admin", tags=["db-admin"])


@router.get("/tables")
async def list_tables(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all tables in the database"""
    try:
        result = await db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result.fetchall()]
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/table/{table_name}/schema")
async def get_table_schema(
    table_name: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get schema information for a specific table"""
    try:
        result = await db.execute(text(f"""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = :table_name
            ORDER BY ordinal_position
        """), {"table_name": table_name})
        
        columns = []
        for row in result.fetchall():
            columns.append({
                "name": row[0],
                "type": row[1],
                "nullable": row[2] == "YES",
                "default": row[3]
            })
        
        return {"table": table_name, "columns": columns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/table/{table_name}/data")
async def get_table_data(
    table_name: str,
    limit: int = 100,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get data from a specific table with pagination"""
    try:
        # Get total count
        count_result = await db.execute(
            text(f"SELECT COUNT(*) FROM {table_name}")
        )
        total = count_result.scalar()
        
        # Get data
        result = await db.execute(
            text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset"),
            {"limit": limit, "offset": offset}
        )
        
        rows = []
        for row in result.fetchall():
            rows.append(dict(row._mapping))
        
        return {
            "table": table_name,
            "total": total,
            "limit": limit,
            "offset": offset,
            "data": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def execute_query(
    query: Dict[str, str],
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Execute a custom SQL query (SELECT only for safety)"""
    try:
        sql = query.get("sql", "").strip().upper()
        
        # Only allow SELECT queries for safety
        if not sql.startswith("SELECT"):
            raise HTTPException(
                status_code=400, 
                detail="Only SELECT queries are allowed"
            )
        
        result = await db.execute(text(query["sql"]))
        
        rows = []
        for row in result.fetchall():
            rows.append(dict(row._mapping))
        
        return {
            "success": True,
            "rows": len(rows),
            "data": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/table/{table_name}/truncate")
async def truncate_table(
    table_name: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Truncate (delete all data from) a specific table"""
    try:
        await db.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
        await db.commit()
        
        return {
            "success": True,
            "message": f"Table {table_name} truncated successfully"
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))