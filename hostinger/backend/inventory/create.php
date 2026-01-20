<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireAuth();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || !isset($data['sector'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Nome e setor são obrigatórios']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $id = generateUUID();
    
    $stmt = $db->prepare("
        INSERT INTO inventory_items (id, name, description, quantity, min_quantity, unit, sector, category, image_url, price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $id,
        $data['name'],
        $data['description'] ?? null,
        $data['quantity'] ?? 0,
        $data['min_quantity'] ?? 0,
        $data['unit'] ?? 'unidade',
        $data['sector'],
        $data['category'] ?? null,
        $data['image_url'] ?? null,
        $data['price'] ?? 0
    ]);
    
    // Retornar o item criado
    $stmt = $db->prepare("SELECT * FROM inventory_items WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch();
    
    http_response_code(201);
    echo json_encode($item);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao criar item: ' . $e->getMessage()]);
}
?>
