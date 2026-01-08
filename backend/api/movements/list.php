<?php
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireAuth();

$database = new Database();
$db = $database->getConnection();

try {
    $itemId = $_GET['item_id'] ?? null;
    $type = $_GET['type'] ?? null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    
    $sql = "
        SELECT sm.*, i.name as item_name, i.sector, u.full_name as user_name
        FROM stock_movements sm
        JOIN inventory_items i ON sm.item_id = i.id
        JOIN users u ON sm.user_id = u.id
    ";
    
    $conditions = [];
    $params = [];
    
    if ($itemId) {
        $conditions[] = "sm.item_id = ?";
        $params[] = $itemId;
    }
    
    if ($type) {
        $conditions[] = "sm.movement_type = ?";
        $params[] = $type;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(' AND ', $conditions);
    }
    
    $sql .= " ORDER BY sm.created_at DESC LIMIT ?";
    $params[] = $limit;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    $movements = $stmt->fetchAll();
    echo json_encode($movements);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch movements: ' . $e->getMessage()]);
}
?>
