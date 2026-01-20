<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireAuth();

$database = new Database();
$db = $database->getConnection();

try {
    $date = $_GET['date'] ?? null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    
    $sql = "
        SELECT peh.*, u.full_name as user_name
        FROM product_edit_history peh
        JOIN users u ON peh.user_id = u.id
    ";
    
    $params = [];
    
    if ($date) {
        $sql .= " WHERE DATE(peh.created_at) = ?";
        $params[] = $date;
    }
    
    $sql .= " ORDER BY peh.created_at DESC LIMIT ?";
    $params[] = $limit;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    $history = $stmt->fetchAll();
    echo json_encode($history);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar histórico: ' . $e->getMessage()]);
}
?>
