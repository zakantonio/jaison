#!/usr/bin/env python
"""
Run database migrations for Jaison.

This script applies any pending migrations to the database.
"""
import sys
import asyncio
import re
from pathlib import Path
from typing import List

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from jaison.admin_api.database.client import supabase
from jaison.admin_api.utils.logger import logger
from jaison.admin_api.config.settings import settings
from scripts.bootstrap_database import bootstrap_database

# Path to migration files
MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "jaison" / "admin_api" / "database" / "migrations" / "versions"

async def get_applied_migrations() -> List[str]:
    """Get a list of already applied migrations."""
    try:
        result = supabase.table('_migrations').select('version').execute()
        if result.error:
            logger.error(f"Error fetching applied migrations: {result.error}")
            return []

        return [row['version'] for row in result.data]
    except Exception as e:
        logger.error(f"Error fetching applied migrations: {e}")
        return []

async def apply_migration(version: str, name: str, sql: str) -> bool:
    """Apply a single migration."""
    try:
        # Execute the migration SQL
        result = supabase.rpc('exec_sql', {'sql_text': sql}).execute()
        if result.error:
            logger.error(f"Error applying migration {version}: {result.error}")
            return False

        # Record the migration in the _migrations table
        result = supabase.table('_migrations').insert({
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

async def run_migrations():
    """Run all pending migrations."""
    # First, bootstrap the database if needed
    bootstrap_success = await bootstrap_database()
    if not bootstrap_success:
        logger.error("Database bootstrap failed, cannot run migrations")
        return False

    # Get list of applied migrations
    applied_migrations = await get_applied_migrations()
    logger.info(f"Found {len(applied_migrations)} already applied migrations")

    # Get all migration files
    migration_files = sorted([f for f in MIGRATIONS_DIR.glob("*.sql")])
    logger.info(f"Found {len(migration_files)} migration files")

    # Apply pending migrations
    applied_count = 0
    for migration_file in migration_files:
        # Parse version and name from filename (e.g., 001_create_users_table.sql)
        match = re.match(r"(\d+)_(.+)\.sql", migration_file.name)
        if not match:
            logger.warning(f"Invalid migration filename: {migration_file.name}, skipping")
            continue

        version, name = match.groups()
        name = name.replace("_", " ")

        # Skip if already applied
        if version in applied_migrations:
            logger.info(f"Migration {version} ({name}) already applied, skipping")
            continue

        # Read and apply the migration
        logger.info(f"Applying migration {version}: {name}")
        with open(migration_file, "r") as f:
            sql = f.read()

        success = await apply_migration(version, name, sql)
        if not success:
            logger.error(f"Failed to apply migration {version}: {name}")
            return False

        logger.info(f"Successfully applied migration {version}: {name}")
        applied_count += 1

    logger.info(f"Applied {applied_count} new migrations")
    return True

def main():
    """Main entry point."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        logger.error("SUPABASE_URL and SUPABASE_KEY must be set in the environment")
        sys.exit(1)

    success = asyncio.run(run_migrations())
    if not success:
        logger.error("Migrations failed")
        sys.exit(1)

    logger.info("Migrations completed successfully")

if __name__ == "__main__":
    main()
