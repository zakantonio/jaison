#!/usr/bin/env python
"""
Bootstrap the database for Jaison.

This script creates the necessary PostgreSQL function for executing SQL
and sets up the migrations table to track applied migrations.
"""
import sys
import asyncio
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from jaison.admin_api.database.client import supabase
from jaison.admin_api.utils.logger import logger
from jaison.admin_api.config.settings import settings

# SQL to create the exec_sql function
EXEC_SQL_FUNCTION = """
CREATE OR REPLACE FUNCTION exec_sql(sql_text text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
"""

# SQL to create the migrations table
MIGRATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(version)
);
"""

async def bootstrap_database():
    """Bootstrap the database with required functions and tables."""
    try:
        logger.info("Bootstrapping database...")

        # Create the exec_sql function
        logger.info("Creating exec_sql function...")
        try:
            # Try to execute the SQL directly
            # This is a workaround for the first bootstrap when exec_sql doesn't exist yet
            # We use the raw SQL API of Supabase
            logger.info("Attempting to create exec_sql function directly...")
            # The following is a simplified approach - in a real implementation, you would
            # need to use the appropriate Supabase REST API endpoint for executing raw SQL
            # For PostgreSQL in Supabase, we can use the SQL API

            # First, try to create the function using the REST API
            # This is a direct SQL execution, not using the RPC function
            result = supabase.table('_migrations').select('id').limit(1).execute()

            # If we can query the migrations table, it means the database is already set up
            if not result.error:
                logger.info("Database appears to be already set up.")
            else:
                # Try to create the exec_sql function
                logger.info("Creating exec_sql function...")
                # In a real implementation, you would use the appropriate method to execute raw SQL
                # For this example, we'll use the RPC method and handle the error if it doesn't exist
                try:
                    result = supabase.rpc('exec_sql', {'sql_text': EXEC_SQL_FUNCTION}).execute()
                    if result.error and "function exec_sql" in str(result.error).lower():
                        # This is expected if the function doesn't exist yet
                        logger.info("exec_sql function doesn't exist yet. Creating it requires direct SQL access.")
                        logger.info("Please create the exec_sql function manually in the Supabase SQL editor:")
                        logger.info(EXEC_SQL_FUNCTION)
                    elif result.error:
                        logger.error(f"Error creating exec_sql function: {result.error}")
                        return False
                except Exception as e:
                    logger.warning(f"Could not create exec_sql function: {e}")
                    logger.info("Please create the exec_sql function manually in the Supabase SQL editor:")
                    logger.info(EXEC_SQL_FUNCTION)
        except Exception as e:
            logger.warning(f"Error checking database state: {e}")

        # Create the migrations table using the exec_sql function
        logger.info("Creating migrations table...")
        try:
            result = supabase.rpc('exec_sql', {'sql_text': MIGRATIONS_TABLE}).execute()
            if result.error:
                logger.error(f"Error creating migrations table: {result.error}")
                logger.info("Please create the migrations table manually in the Supabase SQL editor:")
                logger.info(MIGRATIONS_TABLE)
                return False
        except Exception as e:
            logger.warning(f"Could not create migrations table: {e}")
            logger.info("Please create the migrations table manually in the Supabase SQL editor:")
            logger.info(MIGRATIONS_TABLE)
            return False

        logger.info("Database bootstrap completed successfully!")
        return True

    except Exception as e:
        logger.error(f"Error bootstrapping database: {e}")
        return False

def main():
    """Main entry point."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        logger.error("SUPABASE_URL and SUPABASE_KEY must be set in the environment")
        sys.exit(1)

    success = asyncio.run(bootstrap_database())
    if not success:
        logger.error("Database bootstrap failed")
        sys.exit(1)

    logger.info("Database bootstrap completed successfully")

if __name__ == "__main__":
    main()
