<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireAdmin();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['category_id']) || !isset($data['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'category_id e name são obrigatórios']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $id = generateUUID();

    // Ensure category exists
    $check = $db->prepare('SELECT id FROM categories WHERE id = ?');
    $check->execute([$data['category_id']]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Categoria não encontrada']);
        exit();
    }

    $stmt = $db->prepare('INSERT INTO subcategories (id, name, category_id) VALUES (?, ?, ?)');
    $stmt->execute([$id, $data['name'], $data['category_id']]);

    $stmt = $db->prepare('SELECT * FROM subcategories WHERE id = ?');
    $stmt->execute([$id]);
    $subcategory = $stmt->fetch();

    http_response_code(201);
    echo json_encode($subcategory);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao criar subcategoria: ' . $e->getMessage()]);
}
?>
