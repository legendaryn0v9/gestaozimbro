<?php
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireAuth();

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Item ID is required']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$database = new Database();
$db = $database->getConnection();

try {
    // Build dynamic update query
    $fields = [];
    $values = [];
    
    $allowedFields = ['name', 'description', 'quantity', 'min_quantity', 'unit', 'sector', 'category', 'image_url'];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit();
    }
    
    $values[] = $id;
    $sql = "UPDATE inventory_items SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($values);
    
    // Fetch and return the updated item
    $stmt = $db->prepare("SELECT * FROM inventory_items WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch();
    
    echo json_encode($item);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update item: ' . $e->getMessage()]);
}
?>
