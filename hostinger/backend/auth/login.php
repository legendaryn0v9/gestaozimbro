<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Suporta login por email ou telefone
$phone = $data['phone'] ?? null;
$email = $data['email'] ?? null;
$password = $data['password'] ?? null;

if ((!$phone && !$email) || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Telefone/Email e senha são obrigatórios']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    // Buscar usuário por telefone ou email
    if ($phone) {
        $normalizedPhone = normalizePhone($phone);
        $stmt = $db->prepare("
            SELECT u.*, ur.role 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            WHERE u.phone = ? OR u.phone = ?
        ");
        $stmt->execute([$normalizedPhone, $phone]);
    } else {
        $stmt = $db->prepare("
            SELECT u.*, ur.role 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            WHERE u.email = ?
        ");
        $stmt->execute([$email]);
    }
    
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciais inválidas']);
        exit();
    }
    
    $token = generateToken($user['id'], $user['email'], $user['role'] ?? 'funcionario');
    
    echo json_encode([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'phone' => $user['phone'],
            'sector' => $user['sector'],
            'avatar_url' => $user['avatar_url'],
            'role' => $user['role'] ?? 'funcionario'
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro no login: ' . $e->getMessage()]);
}
?>
