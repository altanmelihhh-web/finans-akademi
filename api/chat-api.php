<?php
/**
 * Finans Akademi - Chat API Gateway
 * PHP wrapper for Python FastAPI backend with security and logging
 */

require_once __DIR__ . '/chat-security.php';
require_once __DIR__ . '/ChatAuditLogger.php';

// Load environment variables
if (file_exists(__DIR__ . '/../config/.env')) {
    $envFile = file_get_contents(__DIR__ . '/../config/.env');
    foreach (explode("\n", $envFile) as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            putenv(trim($line));
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Configuration
$config = [
    'python_api_url' => 'http://localhost:8000',
    'db' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'port' => getenv('DB_PORT') ?: '5432',
        'dbname' => getenv('DB_NAME') ?: 'finans_chatbot',
        'user' => getenv('DB_USER') ?: 'postgres',
        'password' => getenv('DB_PASSWORD') ?: '',
    ],
    'rate_limit' => [
        'max_requests' => (int)(getenv('RATE_LIMIT_PER_MINUTE') ?: 20),
        'window_minutes' => 1
    ]
];

// Initialize security and logger
$security = new ChatSecurity();
$logger = new ChatAuditLogger($config['db']);

// Set headers
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $security->verifyCorsOrigin();
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // CORS check
    $security->verifyCorsOrigin();

    // Rate limiting
    $clientId = $security->getClientIdentifier();
    $security->checkRateLimit(
        $clientId,
        $config['rate_limit']['max_requests'],
        $config['rate_limit']['window_minutes']
    );

    // Get request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON in request body');
    }

    // Validate required fields
    if (empty($data['message'])) {
        throw new Exception('Message is required');
    }

    // Validate and sanitize message
    $message = $security->validateInput($data['message']);

    // Check for attack patterns
    $security->detectAttack($message);

    // Get or create session ID
    $sessionId = !empty($data['session_id'])
        ? $security->validateSessionId($data['session_id'])
        : $security->generateSessionId();

    // Get client info
    $ipAddress = $security->getClientIP();
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    $userId = $data['user_id'] ?? null;

    // Create or update session in database
    $logger->getOrCreateSession($sessionId, $userId, $ipAddress, $userAgent);

    // Log user message
    $logger->logMessage(
        $sessionId,
        'user',
        $message
    );

    // Prepare request to Python API
    $apiRequest = [
        'message' => $message,
        'session_id' => $sessionId,
        'history' => $data['history'] ?? [],
        'force_web_search' => $data['force_web_search'] ?? false
    ];

    // Call Python FastAPI
    $ch = curl_init($config['python_api_url'] . '/chat');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($apiRequest),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 5
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception("Python API connection failed: {$curlError}");
    }

    if ($httpCode !== 200) {
        $errorData = json_decode($response, true);
        $errorMsg = $errorData['detail'] ?? 'Unknown error from Python API';
        throw new Exception("Python API error ({$httpCode}): {$errorMsg}");
    }

    $result = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON response from Python API');
    }

    // Log assistant response
    $logger->logMessage(
        $sessionId,
        'assistant',
        $result['answer'],
        $result['source_type'] ?? null,
        $result['confidence'] ?? null,
        $result['response_time_ms'] ?? null,
        $result['metadata']['documents_retrieved'] ?? null,
        json_encode($result['metadata']['similarity_scores'] ?? []),
        $result['web_search_performed'] ?? false,
        json_encode($result['web_sources'] ?? [])
    );

    // Return response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result,
        'timestamp' => time()
    ]);

} catch (Exception $e) {
    // Log error
    $security->logSecurityEvent('ERROR', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);

    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => time()
    ]);
}
