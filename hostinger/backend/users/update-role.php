<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireDono(); // Apenas dono pode alterar cargos

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id']) || !isset($data['role'])) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id e role são obrigatórios']);
    exit();
}

if (!in_array($data['role'], ['dono', 'admin', 'funcionario'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Role inválido']);
    exit();
}

// Regras adicionais de segurança/negócio:
// - Dono não pode trocar o próprio cargo
// - Dono não pode atribuir cargo de Dono a ninguém
if (!empty($authUser['user_id']) && $data['user_id'] === $authUser['user_id']) {
    http_response_code(403);
    echo json_encode(['error' => 'Você não pode alterar o seu próprio cargo']);
    exit();
}

if ($data['role'] === 'dono') {
    http_response_code(403);
    echo json_encode(['error' => 'Não é permitido atribuir o cargo de Dono']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    // Verificar se usuário existe
    $stmt = $db->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$data['user_id']]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuário não encontrado']);
        exit();
    }

    // Não permitir alterar cargo de um usuário que já seja Dono
    $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ? LIMIT 1");
    $stmt->execute([$data['user_id']]);
    $currentRoleRow = $stmt->fetch();
    if ($currentRoleRow && isset($currentRoleRow['role']) && $currentRoleRow['role'] === 'dono') {
        http_response_code(403);
        echo json_encode(['error' => 'Não é permitido alterar o cargo do Dono']);
        exit();
    }
    
    // Atualizar ou inserir role
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ?");
    $stmt->execute([$data['user_id']]);
    
    if ($stmt->fetch()) {
        $stmt = $db->prepare("UPDATE user_roles SET role = ? WHERE user_id = ?");
        $stmt->execute([$data['role'], $data['user_id']]);
    } else {
        $roleId = generateUUID();
        $stmt = $db->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)");
        $stmt->execute([$roleId, $data['user_id'], $data['role']]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Role atualizado']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao atualizar role: ' . $e->getMessage()]);
}
?>
