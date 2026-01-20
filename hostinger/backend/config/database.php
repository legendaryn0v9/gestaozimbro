<?php
/**
 * Configuração do Banco de Dados - Sistema de Estoque Zimbro
 * 
 * INSTRUÇÕES:
 * 1. Altere as constantes abaixo com os dados do seu banco na Hostinger
 * 2. O DB_HOST geralmente é 'localhost' na Hostinger
 * 3. Crie uma JWT_SECRET única e forte
 */

// =====================================================
// CONFIGURAÇÃO DO BANCO - ALTERE AQUI!
// =====================================================
define('DB_HOST', 'localhost');           // Geralmente é 'localhost'
define('DB_NAME', 'SEU_BANCO_AQUI');       // Nome do banco que você criou
define('DB_USER', 'SEU_USUARIO_AQUI');     // Usuário do banco
define('DB_PASS', 'SUA_SENHA_AQUI');       // Senha do banco
define('DB_CHARSET', 'utf8mb4');

// =====================================================
// CONFIGURAÇÃO JWT - ALTERE A CHAVE!
// =====================================================
define('JWT_SECRET', 'MUDE_ESTA_CHAVE_PARA_ALGO_SUPER_SECRETO_E_UNICO');
define('JWT_EXPIRY', 86400 * 7); // 7 dias

// =====================================================
// CONFIGURAÇÃO DE CORS E HEADERS
// =====================================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =====================================================
// CLASSE DE CONEXÃO COM O BANCO
// =====================================================
class Database {
    private $connection = null;

    public function getConnection() {
        if ($this->connection === null) {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro de conexão com o banco de dados']);
                exit();
            }
        }
        return $this->connection;
    }
}

// =====================================================
// FUNÇÕES JWT
// =====================================================
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateToken($userId, $email, $role) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + JWT_EXPIRY
    ]);

    $base64Header = base64UrlEncode($header);
    $base64Payload = base64UrlEncode($payload);
    $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, JWT_SECRET, true);
    $base64Signature = base64UrlEncode($signature);

    return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
}

function validateToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    list($base64Header, $base64Payload, $base64Signature) = $parts;

    $signature = base64UrlDecode($base64Signature);
    $expectedSignature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, JWT_SECRET, true);

    if (!hash_equals($signature, $expectedSignature)) return null;

    $payload = json_decode(base64UrlDecode($base64Payload), true);
    
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return null;
    }

    return $payload;
}

// =====================================================
// FUNÇÕES DE AUTENTICAÇÃO
// =====================================================
function getAuthUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }

    return validateToken($matches[1]);
}

function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit();
    }
    return $user;
}

function requireAdmin() {
    $user = requireAuth();
    if (!in_array($user['role'], ['admin', 'dono'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado - requer privilégios de administrador']);
        exit();
    }
    return $user;
}

function requireDono() {
    $user = requireAuth();
    if ($user['role'] !== 'dono') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado - requer privilégios de dono']);
        exit();
    }
    return $user;
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function normalizePhone($phone) {
    return preg_replace('/\D/', '', $phone);
}
?>
