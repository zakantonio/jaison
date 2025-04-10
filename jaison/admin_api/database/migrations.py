"""
Database migration utilities for Admin API
"""
import os
import re
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from jaison.admin_api.database.client import supabase
from jaison.admin_api.utils.logger import logger

# Path to migration files
MIGRATIONS_DIR = Path(__file__).parent / "migrations" / "versions"

async def check_migrations_table() -> bool:
    """Check if the migrations table exists."""
    try:
        result = await supabase.table('_migrations').select('id').limit(1).execute()
        return not result.error
    except Exception as e:
        logger.error(f"Error checking migrations table: {e}")
        return False

async def get_applied_migrations() -> List[str]:
    """Get a list of already applied migrations."""
    try:
        if not await check_migrations_table():
            return []
        
        result = await supabase.table('_migrations').select('version').execute()
        if result.error:
            logger.error(f"Error fetching applied migrations: {result.error}")
            return []
        
        return [row['version'] for row in result.data]
    except Exception as e:
        logger.error(f"Error fetching applied migrations: {e}")
        return []

async def get_pending_migrations() -> List[Tuple[str, str, str]]:
    """Get a list of pending migrations."""
    try:
        # Get applied migrations
        applied_migrations = await get_applied_migrations()
        
        # Get all migration files
        pending_migrations = []
        for migration_file in sorted([f for f in MIGRATIONS_DIR.glob("*.sql")]):
            # Parse version and name from filename (e.g., 001_create_users_table.sql)
            match = re.match(r"(\d+)_(.+)\.sql", migration_file.name)
            if not match:
                logger.warning(f"Invalid migration filename: {migration_file.name}, skipping")
                continue
            
            version, name = match.groups()
            name = name.replace("_", " ")
            
            # Skip if already applied
            if version in applied_migrations:
                continue
            
            # Read the migration SQL
            with open(migration_file, "r") as f:
                sql = f.read()
            
            pending_migrations.append((version, name, sql))
        
        return pending_migrations
    except Exception as e:
        logger.error(f"Error getting pending migrations: {e}")
        return []

async def apply_migration(version: str, name: str, sql: str) -> bool:
    """Apply a single migration."""
    try:
        # Execute the migration SQL
        result = await supabase.rpc('exec_sql', {'sql_text': sql})
        if result.error:
            logger.error(f"Error applying migration {version}: {result.error}")
            return False
        
        # Record the migration in the _migrations table
        result = await supabase.table('_migrations').insert({
            'version': version,
            'name': name
        }).execute()
        
        if result.error:
            logger.error(f"Error recording migration {version}: {result.error}")
            return False
        
        return True
    except Exception as e:
        logger.error(f"Error applying migration {version}: {e}")
        return False

async def get_migration_status() -> Dict[str, Any]:
    """Get the status of migrations."""
    try:
        applied = await get_applied_migrations()
        pending = await get_pending_migrations()
        
        return {
            "database_ready": await check_migrations_table(),
            "applied_migrations": len(applied),
            "pending_migrations": len(pending),
            "applied": applied,
            "pending": [f"{v}: {n}" for v, n, _ in pending]
        }
    except Exception as e:
        logger.error(f"Error getting migration status: {e}")
        return {
            "database_ready": False,
            "applied_migrations": 0,
            "pending_migrations": 0,
            "applied": [],
            "pending": [],
            "error": str(e)
        }
