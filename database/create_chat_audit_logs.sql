-- Chat Audit Logs Database Schema for PostgreSQL
-- Finans Akademi Chatbot

-- Drop tables if exists (for fresh install)
DROP TABLE IF EXISTS chat_feedback CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Chat Sessions Table
CREATE TABLE chat_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
    message_text TEXT NOT NULL,

    -- Response metadata
    source_type VARCHAR(50) CHECK (source_type IN ('site_content', 'web_search', 'hybrid', 'fallback')),
    confidence_score DECIMAL(5,4),
    response_time_ms INTEGER,

    -- RAG metadata
    documents_retrieved INTEGER,
    similarity_scores JSONB,

    -- Web search metadata
    web_search_performed BOOLEAN DEFAULT FALSE,
    web_sources JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_session FOREIGN KEY (session_id)
        REFERENCES chat_sessions(session_id)
        ON DELETE CASCADE
);

-- Chat Feedback Table (for user ratings)
CREATE TABLE chat_feedback (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_message FOREIGN KEY (message_id)
        REFERENCES chat_messages(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_session FOREIGN KEY (session_id)
        REFERENCES chat_sessions(session_id)
        ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_source_type ON chat_messages(source_type);
CREATE INDEX idx_chat_feedback_message_id ON chat_feedback(message_id);

-- View for analytics
CREATE OR REPLACE VIEW chat_analytics AS
SELECT
    cs.session_id,
    cs.user_id,
    cs.created_at as session_start,
    cs.message_count,
    COUNT(DISTINCT cm.id) as total_messages,
    COUNT(DISTINCT CASE WHEN cm.source_type = 'site_content' THEN cm.id END) as site_content_responses,
    COUNT(DISTINCT CASE WHEN cm.source_type = 'web_search' THEN cm.id END) as web_search_responses,
    AVG(cm.response_time_ms) as avg_response_time_ms,
    AVG(cm.confidence_score) as avg_confidence,
    AVG(cf.rating) as avg_rating
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cs.session_id = cm.session_id
LEFT JOIN chat_feedback cf ON cm.id = cf.message_id
GROUP BY cs.session_id, cs.user_id, cs.created_at, cs.message_count;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET last_activity = CURRENT_TIMESTAMP,
        message_count = message_count + 1
    WHERE session_id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session activity
CREATE TRIGGER trigger_update_session_activity
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_session_activity();

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_user;

COMMENT ON TABLE chat_sessions IS 'Stores user chat sessions with metadata';
COMMENT ON TABLE chat_messages IS 'Stores all chat messages with RAG and web search metadata';
COMMENT ON TABLE chat_feedback IS 'Stores user feedback and ratings for chat responses';
COMMENT ON VIEW chat_analytics IS 'Analytics view for chat performance metrics';
