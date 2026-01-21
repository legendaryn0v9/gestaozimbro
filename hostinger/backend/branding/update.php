<?php
require_once '../config/database.php';
require_once '../lib/branding.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit();
}

// Apenas Dono pode atualizar nome do sistema
requireDono();

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data) || !array_key_exists('system_name', $data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'system_name é obrigatório']);
    exit();
}

$name = trim((string)$data['system_name']);
if ($name === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nome não pode ficar vazio']);
    exit();
}

if (mb_strlen($name) > 60) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nome muito longo (máx 60 caracteres)']);
    exit();
}

$saveOk = branding_save_settings([
    'system_name' => $name,
]);

if (!$saveOk) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Falha ao salvar configurações']);
    exit();
}

echo json_encode(['success' => true, 'data' => branding_get_settings()]);
