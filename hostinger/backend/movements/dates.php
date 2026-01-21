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
    // Check if user is admin/dono or funcionario
    $userRole = $authUser['role'] ?? 'funcionario';
    $isAdmin = in_array($userRole, ['admin', 'dono']);
    
    // Buscar datas únicas de movimentações
    // Funcionarios only see dates where THEY had movements
    if ($isAdmin) {
        $stmt = $db->query("SELECT DISTINCT DATE(created_at) as date FROM stock_movements ORDER BY date DESC");
    } else {
        $stmt = $db->prepare("SELECT DISTINCT DATE(created_at) as date FROM stock_movements WHERE user_id = ? ORDER BY date DESC");
        $stmt->execute([$authUser['user_id']]);
    }
    
    $dates = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode($dates);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar datas: ' . $e->getMessage()]);
}
?>
