<?php
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireAuth();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || !isset($data['sector'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and sector are required']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $id = bin2hex(random_bytes(16));
    
    $stmt = $db->prepare("
        INSERT INTO inventory_items (id, name, description, quantity, min_quantity, unit, sector, category, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        $data['image_url'] ?? null
    ]);
    
    // Fetch and return the created item
    $stmt = $db->prepare("SELECT * FROM inventory_items WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch();
    
    http_response_code(201);
    echo json_encode($item);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create item: ' . $e->getMessage()]);
}
?>
