-- Create usage statistics table
CREATE TABLE IF NOT EXISTS usage_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    document_type VARCHAR(50),
    model_used VARCHAR(255) NOT NULL,
    credits_used DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_statistics_user_id ON usage_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_statistics_api_key_id ON usage_statistics(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_statistics_created_at ON usage_statistics(created_at);

-- Add a trigger to update the updated_at timestamp
CREATE TRIGGER update_usage_statistics_updated_at
BEFORE UPDATE ON usage_statistics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
