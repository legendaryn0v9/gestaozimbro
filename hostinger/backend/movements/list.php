<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireAuth();

$database = new Database();
$db = $database->getConnection();

try {
    $itemId = $_GET['item_id'] ?? null;
    $type = $_GET['type'] ?? null;
    $date = $_GET['date'] ?? null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    
    // Check if user is admin/dono or funcionario
    $userRole = $authUser['role'] ?? 'funcionario';
    $isAdmin = in_array($userRole, ['admin', 'dono']);
    
    $sql = "
        SELECT sm.*, i.name as item_name, i.sector, i.unit, i.price, u.full_name as user_name,
               ur.role as user_role
        FROM stock_movements sm
        LEFT JOIN inventory_items i ON sm.item_id = i.id
        JOIN users u ON sm.user_id = u.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
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
    
    if ($date) {
        $conditions[] = "DATE(sm.created_at) = ?";
        $params[] = $date;
    }
    
    // IMPORTANT: Funcionarios only see their own movements
    // Admins and Donos see all movements
    if (!$isAdmin) {
        $conditions[] = "sm.user_id = ?";
        $params[] = $authUser['user_id'];
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(' AND ', $conditions);
    }
    
    $sql .= " ORDER BY sm.created_at DESC LIMIT ?";
    $params[] = $limit;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    $movements = $stmt->fetchAll();
    
    // Formatar para o frontend
    $result = array_map(function($m) {
        return [
            'id' => $m['id'],
            'item_id' => $m['item_id'],
            'user_id' => $m['user_id'],
            'movement_type' => $m['movement_type'],
            'quantity' => floatval($m['quantity']),
            'notes' => $m['notes'],
            'created_at' => $m['created_at'],
            'item_name' => $m['item_name'] ?? $m['item_name_snapshot'] ?? 'Item excluído',
            'user_name' => $m['user_name'],
            'user_role' => $m['user_role'] ?? 'funcionario',
            'sector' => $m['sector'] ?? $m['item_sector'],
            'inventory_items' => [
                'name' => $m['item_name'] ?? $m['item_name_snapshot'] ?? 'Item excluído',
                'sector' => $m['sector'] ?? $m['item_sector'],
                'unit' => $m['unit'] ?? $m['item_unit'] ?? 'unidade',
                'price' => floatval($m['price'] ?? $m['item_price'] ?? 0)
            ],
            'profiles' => [
                'full_name' => $m['user_name']
            ]
        ];
    }, $movements);
    
    echo json_encode($result);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar movimentações: ' . $e->getMessage()]);
}
?>
