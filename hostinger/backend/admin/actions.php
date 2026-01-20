<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireAdmin();

$database = new Database();
$db = $database->getConnection();

try {
    $date = $_GET['date'] ?? null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    
    $sql = "
        SELECT aa.*, 
               u.full_name as user_name,
               tu.full_name as target_user_name
        FROM admin_actions aa
        JOIN users u ON aa.user_id = u.id
        LEFT JOIN users tu ON aa.target_user_id = tu.id
    ";
    
    $params = [];
    
    if ($date) {
        $sql .= " WHERE DATE(aa.created_at) = ?";
        $params[] = $date;
    }
    
    $sql .= " ORDER BY aa.created_at DESC LIMIT ?";
    $params[] = $limit;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    $actions = $stmt->fetchAll();
    echo json_encode($actions);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar ações: ' . $e->getMessage()]);
}
?>
