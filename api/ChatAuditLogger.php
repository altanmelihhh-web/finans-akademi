<?php
/**
 * Finans Akademi - Chat Audit Logger
 * Logs all chat interactions to PostgreSQL database
 */

class ChatAuditLogger {
    private $conn;
    private $config;

    public function __construct($dbConfig) {
        $this->config = $dbConfig;
        $this->connect();
    }

    private function connect() {
        $connString = sprintf(
            "host=%s port=%s dbname=%s user=%s password=%s",
            $this->config['host'],
            $this->config['port'],
            $this->config['dbname'],
            $this->config['user'],
            $this->config['password']
        );

        $this->conn = pg_connect($connString);

        if (!$this->conn) {
            throw new Exception("Database connection failed");
        }
    }

    /**
     * Create or get chat session
     */
    public function getOrCreateSession($sessionId, $userId = null, $ipAddress = null, $userAgent = null) {
        // Check if session exists
        $query = "SELECT session_id FROM chat_sessions WHERE session_id = $1";
        $result = pg_query_params($this->conn, $query, array($sessionId));

        if (pg_num_rows($result) > 0) {
            // Update last activity
            $updateQuery = "UPDATE chat_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1";
            pg_query_params($this->conn, $updateQuery, array($sessionId));
            return $sessionId;
        }

        // Create new session
        $insertQuery = "
            INSERT INTO chat_sessions (session_id, user_id, ip_address, user_agent)
            VALUES ($1, $2, $3, $4)
            RETURNING session_id
        ";

        $result = pg_query_params($this->conn, $insertQuery, array(
            $sessionId,
            $userId,
            $ipAddress,
            $userAgent
        ));

        if (!$result) {
            throw new Exception("Failed to create session: " . pg_last_error($this->conn));
        }

        return $sessionId;
    }

    /**
     * Log chat message
     */
    public function logMessage(
        $sessionId,
        $messageType,
        $messageText,
        $sourceType = null,
        $confidenceScore = null,
        $responseTimeMs = null,
        $documentsRetrieved = null,
        $similarityScores = null,
        $webSearchPerformed = false,
        $webSources = null
    ) {
        $query = "
            INSERT INTO chat_messages (
                session_id,
                message_type,
                message_text,
                source_type,
                confidence_score,
                response_time_ms,
                documents_retrieved,
                similarity_scores,
                web_search_performed,
                web_sources
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        ";

        // Convert arrays to JSON
        $similarityScoresJson = $similarityScores ? json_encode($similarityScores) : null;
        $webSourcesJson = $webSources ? json_encode($webSources) : null;

        $result = pg_query_params($this->conn, $query, array(
            $sessionId,
            $messageType,
            $messageText,
            $sourceType,
            $confidenceScore,
            $responseTimeMs,
            $documentsRetrieved,
            $similarityScoresJson,
            $webSearchPerformed ? 't' : 'f',
            $webSourcesJson
        ));

        if (!$result) {
            throw new Exception("Failed to log message: " . pg_last_error($this->conn));
        }

        $row = pg_fetch_assoc($result);
        return $row['id'];
    }

    /**
     * Log user feedback
     */
    public function logFeedback($messageId, $sessionId, $rating, $feedbackText = null) {
        $query = "
            INSERT INTO chat_feedback (message_id, session_id, rating, feedback_text)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        ";

        $result = pg_query_params($this->conn, $query, array(
            $messageId,
            $sessionId,
            $rating,
            $feedbackText
        ));

        if (!$result) {
            throw new Exception("Failed to log feedback: " . pg_last_error($this->conn));
        }

        $row = pg_fetch_assoc($result);
        return $row['id'];
    }

    /**
     * Get session history
     */
    public function getSessionHistory($sessionId, $limit = 10) {
        $query = "
            SELECT
                id,
                message_type,
                message_text,
                source_type,
                confidence_score,
                created_at
            FROM chat_messages
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        ";

        $result = pg_query_params($this->conn, $query, array($sessionId, $limit));

        if (!$result) {
            throw new Exception("Failed to get history: " . pg_last_error($this->conn));
        }

        $messages = array();
        while ($row = pg_fetch_assoc($result)) {
            $messages[] = $row;
        }

        return array_reverse($messages); // Oldest first
    }

    /**
     * Get analytics for date range
     */
    public function getAnalytics($startDate = null, $endDate = null) {
        $query = "
            SELECT
                COUNT(DISTINCT session_id) as total_sessions,
                COUNT(*) as total_messages,
                COUNT(DISTINCT CASE WHEN source_type = 'site_content' THEN id END) as site_content_count,
                COUNT(DISTINCT CASE WHEN source_type = 'web_search' THEN id END) as web_search_count,
                COUNT(DISTINCT CASE WHEN source_type = 'hybrid' THEN id END) as hybrid_count,
                AVG(response_time_ms) as avg_response_time,
                AVG(confidence_score) as avg_confidence
            FROM chat_messages
            WHERE 1=1
        ";

        $params = array();
        $paramCount = 1;

        if ($startDate) {
            $query .= " AND created_at >= $" . $paramCount++;
            $params[] = $startDate;
        }

        if ($endDate) {
            $query .= " AND created_at <= $" . $paramCount++;
            $params[] = $endDate;
        }

        $result = pg_query_params($this->conn, $query, $params);

        if (!$result) {
            throw new Exception("Failed to get analytics: " . pg_last_error($this->conn));
        }

        return pg_fetch_assoc($result);
    }

    /**
     * Mark session as inactive
     */
    public function closeSession($sessionId) {
        $query = "UPDATE chat_sessions SET is_active = false WHERE session_id = $1";
        pg_query_params($this->conn, $query, array($sessionId));
    }

    public function __destruct() {
        if ($this->conn) {
            pg_close($this->conn);
        }
    }
}
