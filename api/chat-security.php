<?php
/**
 * Finans Akademi - Chat Security Utilities
 * Handles rate limiting, input validation, and security
 */

class ChatSecurity {
    private $redis; // Optional: use Redis for distributed rate limiting
    private $rateLimitFile;

    public function __construct() {
        $this->rateLimitFile = __DIR__ . '/../logs/rate_limits.json';

        // Create logs directory if not exists
        if (!file_exists(dirname($this->rateLimitFile))) {
            mkdir(dirname($this->rateLimitFile), 0755, true);
        }
    }

    /**
     * Validate and sanitize user input
     */
    public function validateInput($message, $maxLength = 1000) {
        // Remove null bytes
        $message = str_replace("\0", '', $message);

        // Trim whitespace
        $message = trim($message);

        // Check length
        if (strlen($message) === 0) {
            throw new Exception("Message cannot be empty");
        }

        if (strlen($message) > $maxLength) {
            throw new Exception("Message too long (max {$maxLength} characters)");
        }

        // Check for suspicious patterns
        $suspiciousPatterns = [
            '/<script/i',
            '/javascript:/i',
            '/on\w+\s*=/i', // onclick, onerror, etc.
            '/<iframe/i',
            '/eval\(/i',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $message)) {
                throw new Exception("Message contains suspicious content");
            }
        }

        // Sanitize HTML entities
        $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

        return $message;
    }

    /**
     * Rate limiting check
     */
    public function checkRateLimit($identifier, $maxRequests = 20, $windowMinutes = 1) {
        $limits = $this->loadRateLimits();
        $now = time();
        $windowSeconds = $windowMinutes * 60;

        // Clean old entries
        $limits = array_filter($limits, function($data) use ($now, $windowSeconds) {
            return ($now - $data['timestamp']) < $windowSeconds;
        });

        // Count requests from this identifier
        $identifierLimits = array_filter($limits, function($data) use ($identifier) {
            return $data['identifier'] === $identifier;
        });

        if (count($identifierLimits) >= $maxRequests) {
            $oldestRequest = min(array_column($identifierLimits, 'timestamp'));
            $resetTime = $oldestRequest + $windowSeconds - $now;

            throw new Exception("Rate limit exceeded. Try again in {$resetTime} seconds.");
        }

        // Add current request
        $limits[] = [
            'identifier' => $identifier,
            'timestamp' => $now
        ];

        $this->saveRateLimits($limits);
        return true;
    }

    private function loadRateLimits() {
        if (!file_exists($this->rateLimitFile)) {
            return [];
        }

        $content = file_get_contents($this->rateLimitFile);
        $data = json_decode($content, true);

        return $data ?: [];
    }

    private function saveRateLimits($limits) {
        file_put_contents(
            $this->rateLimitFile,
            json_encode($limits, JSON_PRETTY_PRINT)
        );
    }

    /**
     * Get client identifier (IP + User Agent hash)
     */
    public function getClientIdentifier() {
        $ip = $this->getClientIP();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

        return md5($ip . '|' . $userAgent);
    }

    /**
     * Get real client IP (handles proxies)
     */
    public function getClientIP() {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR'
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];

                // If multiple IPs (proxy chain), take the first
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }

                // Validate IP
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Validate session ID format
     */
    public function validateSessionId($sessionId) {
        // UUID v4 format
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';

        if (!preg_match($pattern, $sessionId)) {
            throw new Exception("Invalid session ID format");
        }

        return $sessionId;
    }

    /**
     * Generate secure session ID
     */
    public function generateSessionId() {
        // UUID v4
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // version 4
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // variant

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Verify CORS origin
     */
    public function verifyCorsOrigin() {
        $allowedOrigins = explode(',', $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost');

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (!in_array($origin, $allowedOrigins)) {
            // Allow same-origin requests
            if (empty($origin)) {
                return true;
            }

            throw new Exception("CORS policy: Origin not allowed");
        }

        header("Access-Control-Allow-Origin: {$origin}");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");

        return true;
    }

    /**
     * Log security event
     */
    public function logSecurityEvent($event, $details = []) {
        $logFile = __DIR__ . '/../logs/security.log';
        $logEntry = sprintf(
            "[%s] %s - %s - IP: %s - Details: %s\n",
            date('Y-m-d H:i:s'),
            $event,
            $this->getClientIdentifier(),
            $this->getClientIP(),
            json_encode($details)
        );

        file_put_contents($logFile, $logEntry, FILE_APPEND);
    }

    /**
     * Check for common attack patterns
     */
    public function detectAttack($message) {
        $attackPatterns = [
            // SQL Injection
            '/(\bunion\b.*\bselect\b)|(\bselect\b.*\bfrom\b)/i',
            // Command Injection
            '/[;&|`]\s*(rm|cat|ls|wget|curl|bash|sh)/i',
            // Path Traversal
            '/\.\.(\/|\\)/',
            // XXE
            '/<!(DOCTYPE|ENTITY)/i',
        ];

        foreach ($attackPatterns as $pattern) {
            if (preg_match($pattern, $message)) {
                $this->logSecurityEvent('ATTACK_DETECTED', [
                    'pattern' => $pattern,
                    'message' => substr($message, 0, 100)
                ]);
                throw new Exception("Suspicious input detected");
            }
        }

        return true;
    }
}
