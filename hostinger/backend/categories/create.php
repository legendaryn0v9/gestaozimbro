<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireAdmin();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || !isset($data['sector'])) {
    http_response_code(400);
    echo json_encode(['error' => 'name e sector são obrigatórios']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $id = generateUUID();

    // Optional UI fields
    $gradient = $data['gradient'] ?? null;
    $icon = $data['icon'] ?? null;
    $sortOrder = isset($data['sort_order']) ? (int)$data['sort_order'] : 0;
    
    $stmt = $db->prepare("INSERT INTO categories (id, name, sector, gradient, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $data['name'], $data['sector'], $gradient, $icon, $sortOrder]);
    
    $stmt = $db->prepare("SELECT * FROM categories WHERE id = ?");
    $stmt->execute([$id]);
    $category = $stmt->fetch();
    
    http_response_code(201);
    echo json_encode($category);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao criar categoria: ' . $e->getMessage()]);
}
?>
