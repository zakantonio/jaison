"""
Supabase client configuration and connection for Admin API
"""
from supabase import create_client, Client
from jaison.admin_api.utils.logger import logger
from jaison.admin_api.config.settings import settings

class SupabaseClient:
    """Supabase client singleton"""
    
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
            cls._instance._initialize_client()
        return cls._instance
    
    def _initialize_client(self):
        """Initialize Supabase client"""
        try:
            logger.info("Initializing Supabase client")
            self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    
    @property
    def client(self) -> Client:
        """Get Supabase client instance"""
        return self._client

# Create a singleton instance
supabase = SupabaseClient().client
