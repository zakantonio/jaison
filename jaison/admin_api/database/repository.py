"""
Repository pattern implementation for database access in Admin API
"""
from typing import List, Optional, TypeVar, Generic, Type, Dict, Any, Union
from datetime import datetime, timezone
import json
from jaison.admin_api.utils.logger import logger
from pydantic import BaseModel

from jaison.admin_api.database.client import supabase
from jaison.admin_api.database.models import BaseDBModel, User, APIKey, UsageStatistics

T = TypeVar('T', bound=BaseDBModel)

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class Repository(Generic[T]):
    """Generic repository for database access"""

    def __init__(self, model_class: Type[T], table_name: str):
        self.model_class = model_class
        self.table_name = table_name

    async def create(self, model: Union[T, Dict[str, Any]]) -> T:
        """Create a new record"""
        try:
            # Convert model to dict if it's not already
            if not isinstance(model, dict):
                data = model.model_dump()
            else:
                data = model

            # Add created_at timestamp
            if 'created_at' not in data:
                data['created_at'] = datetime.now(timezone.utc).isoformat()

            # Convert datetime objects to ISO format strings
            json_data = json.loads(json.dumps(data, cls=DateTimeEncoder))

            result = supabase.table(self.table_name).insert(json_data).execute()

            if result.data and len(result.data) > 0:
                return self.model_class(**result.data[0])

            raise Exception(f"Failed to create record in {self.table_name}")
        except Exception as e:
            logger.error(f"Repository error in create: {e}")

            # Check for foreign key constraint error
            if 'api_keys_user_id_fkey' in str(e) and 'violates foreign key constraint' in str(e):
                # This is a schema issue - the foreign key is pointing to auth.users but we're using public.users
                logger.error("Foreign key constraint error: api_keys table is referencing auth.users instead of public.users")
                raise Exception("Database schema issue: The API keys table is referencing the wrong users table. Please check your database setup.")

            raise

    async def get_by_id(self, id: str) -> Optional[T]:
        """Get record by ID"""
        try:
            result = supabase.table(self.table_name).select("*").eq("id", id).execute()

            if result.data and len(result.data) > 0:
                return self.model_class(**result.data[0])

            return None
        except Exception as e:
            logger.error(f"Repository error in get_by_id: {e}")
            raise

    async def get_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        """Get all records with pagination"""
        try:
            result = supabase.table(self.table_name).select("*").range(offset, offset + limit - 1).execute()

            if result.data:
                return [self.model_class(**item) for item in result.data]

            return []
        except Exception as e:
            logger.error(f"Repository error in get_all: {e}")
            raise

    async def update(self, id: str, data: Dict[str, Any]) -> Optional[T]:
        """Update a record"""
        try:
            # Add updated_at timestamp
            data['updated_at'] = datetime.now(timezone.utc).isoformat()

            # Convert datetime objects to ISO format strings
            json_data = json.loads(json.dumps(data, cls=DateTimeEncoder))

            result = supabase.table(self.table_name).update(json_data).eq("id", id).execute()

            if result.data and len(result.data) > 0:
                return self.model_class(**result.data[0])

            return None
        except Exception as e:
            logger.error(f"Repository error in update: {e}")
            raise

    async def delete(self, id: str) -> bool:
        """Delete a record"""
        try:
            result = supabase.table(self.table_name).delete().eq("id", id).execute()

            return result.data is not None and len(result.data) > 0
        except Exception as e:
            logger.error(f"Repository error in delete: {e}")
            raise

    async def find(self, filters: Dict[str, Any], limit: int = 100, offset: int = 0) -> List[T]:
        """Find records by filters"""
        try:
            query = supabase.table(self.table_name).select("*")

            # Apply filters
            for key, value in filters.items():
                query = query.eq(key, value)

            # Apply pagination
            query = query.range(offset, offset + limit - 1)

            result = query.execute()

            if result.data:
                return [self.model_class(**item) for item in result.data]

            return []
        except Exception as e:
            logger.error(f"Repository error in find: {e}")
            raise


class UserRepository(Repository[User]):
    """User repository"""

    def __init__(self):
        super().__init__(User, "users")

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            result = supabase.table(self.table_name).select("*").eq("email", email).execute()

            if result.data and len(result.data) > 0:
                return self.model_class(**result.data[0])

            return None
        except Exception as e:
            logger.error(f"Repository error in get_by_email: {e}")
            raise


class APIKeyRepository(Repository[APIKey]):
    """API Key repository"""

    def __init__(self):
        super().__init__(APIKey, "api_keys")

    async def get_by_key(self, key: str) -> Optional[APIKey]:
        """Get API key by key value"""
        try:
            result = supabase.table(self.table_name).select("*").eq("key", key).execute()

            if result.data and len(result.data) > 0:
                return self.model_class(**result.data[0])

            return None
        except Exception as e:
            logger.error(f"Repository error in get_by_key: {e}")
            raise

    async def get_user_keys(self, user_id: str) -> List[APIKey]:
        """Get all API keys for a user"""
        try:
            result = supabase.table(self.table_name).select("*").eq("user_id", user_id).execute()

            if result.data:
                return [self.model_class(**item) for item in result.data]

            return []
        except Exception as e:
            logger.error(f"Repository error in get_user_keys: {e}")
            raise

    async def update_last_used(self, key_id: str) -> None:
        """Update the last_used timestamp for an API key"""
        try:
            data = {"last_used": datetime.now(timezone.utc).isoformat()}
            supabase.table(self.table_name).update(data).eq("id", key_id).execute()
        except Exception as e:
            logger.error(f"Repository error in update_last_used: {e}")
            # Don't raise the exception, just log it
            # We don't want to fail the request if updating last_used fails


class UsageStatisticsRepository(Repository[UsageStatistics]):
    """Usage statistics repository"""

    def __init__(self):
        super().__init__(UsageStatistics, "usage_statistics")

    async def record_api_usage(self,
                              user_id: str,
                              api_key_id: Optional[str],
                              endpoint: str,
                              status_code: int,
                              processing_time_ms: int,
                              request_size_bytes: Optional[int] = None,
                              response_size_bytes: Optional[int] = None,
                              document_type: Optional[str] = None,
                              model_used: str = "default",
                              credits_used: float = 1.0) -> UsageStatistics:
        """Record API usage statistics"""
        try:
            # Create usage statistics object
            usage_stats = UsageStatistics(
                user_id=user_id,
                api_key_id=api_key_id,
                endpoint=endpoint,
                status_code=status_code,
                processing_time_ms=processing_time_ms,
                request_size_bytes=request_size_bytes,
                response_size_bytes=response_size_bytes,
                document_type=document_type,
                model_used=model_used,
                credits_used=credits_used
            )

            # Save to database
            return await self.create(usage_stats)
        except Exception as e:
            logger.error(f"Repository error in record_api_usage: {e}")
            # Don't raise the exception, just log it
            # We don't want to fail the request if recording usage fails
            return None

    async def get_user_usage(self, user_id: str, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[UsageStatistics]:
        """Get usage statistics for a user within a date range"""
        try:
            query = supabase.table(self.table_name).select("*").eq("user_id", user_id)

            # Apply date filters if provided
            if start_date:
                query = query.gte("created_at", start_date.isoformat())
            if end_date:
                query = query.lte("created_at", end_date.isoformat())

            # Execute query
            result = query.execute()

            if result.data:
                return [self.model_class(**item) for item in result.data]

            return []
        except Exception as e:
            logger.error(f"Repository error in get_user_usage: {e}")
            raise
