-- =====================================================
-- EXPORT SQL PARA HOSTINGER - Sistema de Inventário
-- Gerado em: 2026-01-20
-- =====================================================

-- Desabilitar verificações de chave estrangeira temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- CRIAÇÃO DAS TABELAS
-- =====================================================

-- Tabela: profiles (usuários)
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    sector VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela: user_roles (papéis dos usuários)
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('funcionario', 'admin', 'dono') DEFAULT 'funcionario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Tabela: categories (categorias)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    icon VARCHAR(50) DEFAULT 'Package',
    gradient VARCHAR(100) DEFAULT 'from-amber-500 to-orange-600',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela: subcategories (subcategorias)
CREATE TABLE IF NOT EXISTS subcategories (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Tabela: inventory_items (itens do inventário)
CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 0,
    min_quantity DECIMAL(10,2) DEFAULT 0,
    unit ENUM('unidade', 'kg', 'litro', 'caixa', 'pacote') DEFAULT 'unidade',
    sector ENUM('bar', 'cozinha') NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela: stock_movements (movimentações de estoque)
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36),
    user_id VARCHAR(36) NOT NULL,
    movement_type ENUM('entrada', 'saida') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    notes TEXT,
    item_name_snapshot VARCHAR(255),
    item_sector VARCHAR(50),
    item_unit VARCHAR(50),
    item_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Tabela: admin_actions (ações administrativas)
CREATE TABLE IF NOT EXISTS admin_actions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    target_user_id VARCHAR(36),
    target_user_name VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Tabela: product_edit_history (histórico de edições)
CREATE TABLE IF NOT EXISTS product_edit_history (
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36),
    user_id VARCHAR(36) NOT NULL,
    item_name_snapshot VARCHAR(255) NOT NULL,
    field_changed VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_inventory_sector ON inventory_items(sector);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_movements_item ON stock_movements(item_id);
CREATE INDEX idx_movements_user ON stock_movements(user_id);
CREATE INDEX idx_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_movements_date ON stock_movements(created_at);

-- =====================================================
-- DADOS: PROFILES (USUÁRIOS)
-- =====================================================

INSERT INTO profiles (id, full_name, email, phone, sector, avatar_url, created_at, updated_at) VALUES
('f0133204-e70f-40aa-b8dc-3381afc40666', '@CREMARI4', '62993909390@funcionario.local', '62993909390', 'bar', 'https://klltuuwzedbhkbykayyn.supabase.co/storage/v1/object/public/avatars/f0133204-e70f-40aa-b8dc-3381afc40666-1768361012999.webp', '2026-01-12 20:09:46', '2026-01-14 05:41:11'),
('5f93d945-f371-49ee-bcbb-42b3d2f9f38b', 'admin', 'admin@superadmin.local', 'admin', NULL, NULL, '2026-01-16 02:52:07', '2026-01-16 02:52:08'),
('404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'GESTOR PRINCIPAL', 'parker@gmail.com', '62994615131', '', 'https://klltuuwzedbhkbykayyn.supabase.co/storage/v1/object/public/avatars/404ae1ce-6bf0-41d4-a479-2c97f7d97841-1768175055101.png', '2026-01-08 05:11:14', '2026-01-16 14:23:10'),
('aec0fc98-9144-4c29-a90b-6d812539e670', 'FULANO', '62994949494@funcionario.local', '62994949494', 'cozinha', 'https://klltuuwzedbhkbykayyn.supabase.co/storage/v1/object/public/avatars/aec0fc98-9144-4c29-a90b-6d812539e670-1768175022612.png', '2026-01-10 22:18:32', '2026-01-16 14:29:03'),
('548ea9cd-fe5a-4ee0-aa46-fc4d59a9005d', 'IKARO MORAIS', '62998280739@funcionario.local', '62998280739', 'bar', 'https://klltuuwzedbhkbykayyn.supabase.co/storage/v1/object/public/avatars/548ea9cd-fe5a-4ee0-aa46-fc4d59a9005d-1768422880906.png', '2026-01-08 06:48:23', '2026-01-16 14:29:23');

-- =====================================================
-- DADOS: USER_ROLES (PAPÉIS)
-- =====================================================

INSERT INTO user_roles (id, user_id, role, created_at) VALUES
('3466adec-9620-4907-b46b-278aadaca506', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'admin', '2026-01-08 06:36:40'),
('4354da07-59ea-4e1f-8ad6-31d2e71c121f', 'aec0fc98-9144-4c29-a90b-6d812539e670', 'funcionario', '2026-01-10 22:18:32'),
('633a8b24-69d4-4763-8a35-536ccd12b23a', 'f0133204-e70f-40aa-b8dc-3381afc40666', 'dono', '2026-01-12 20:09:46'),
('36f83524-329c-43ff-83b6-fe755255b6ab', '548ea9cd-fe5a-4ee0-aa46-fc4d59a9005d', 'funcionario', '2026-01-08 06:48:23'),
('28257eee-1949-4f84-983e-beb15fd78192', '5f93d945-f371-49ee-bcbb-42b3d2f9f38b', 'admin', '2026-01-16 02:52:07');

-- =====================================================
-- DADOS: CATEGORIES (CATEGORIAS)
-- =====================================================

INSERT INTO categories (id, name, sector, icon, gradient, sort_order, created_at, updated_at) VALUES
('de7348b1-0d11-45b1-98d5-6fb857e99b7c', 'Secos', 'cozinha', 'Package', 'from-amber-500 to-orange-600', 0, '2026-01-10 13:42:41', '2026-01-10 13:42:41'),
('408c3481-e416-47c1-831a-d92b3dfda6d6', 'Carnes', 'cozinha', 'Package', 'from-red-500 to-rose-600', 0, '2026-01-10 13:47:10', '2026-01-10 13:47:10'),
('070e0b33-ff55-4007-ad5c-0a3389800838', 'Destilados', 'bar', 'Martini', 'from-amber-500 to-orange-600', 1, '2026-01-10 21:22:45', '2026-01-10 21:22:45'),
('e76182c5-9b43-4dfa-8656-19269415f88d', 'Não Alcoólicos', 'bar', 'GlassWater', 'from-blue-500 to-cyan-600', 2, '2026-01-10 21:22:45', '2026-01-10 21:22:45'),
('a6295525-6991-45bd-b7b8-4b16618327a0', 'Alcoólicos', 'bar', 'Beer', 'from-purple-500 to-pink-600', 3, '2026-01-10 21:22:45', '2026-01-10 21:22:45'),
('da33b3f4-28d6-4ca2-bc97-cc65c979eb71', 'Condimentos', 'cozinha', 'Package', 'from-green-500 to-emerald-600', 0, '2026-01-11 00:31:58', '2026-01-11 00:31:58'),
('0a63a3a3-09d3-4a01-94cc-35c269c5ff78', 'FRIOS', 'cozinha', 'Package', 'from-teal-500 to-cyan-600', 0, '2026-01-11 05:28:02', '2026-01-11 05:28:02'),
('827a1cc5-01d7-4995-aa4e-0f9897498772', 'Hortalicias', 'cozinha', 'Package', 'from-green-500 to-emerald-600', 0, '2026-01-11 06:13:25', '2026-01-11 06:13:25'),
('61bb6288-d3cf-4a08-8189-bccf74ebea3d', 'FRUTAS', 'cozinha', 'Package', 'from-purple-500 to-pink-600', 0, '2026-01-11 06:40:14', '2026-01-11 06:40:14');

-- =====================================================
-- DADOS: SUBCATEGORIES (SUBCATEGORIAS)
-- =====================================================

INSERT INTO subcategories (id, category_id, name, sort_order, created_at) VALUES
('00bf3e81-c810-4287-a6f9-e26fc1e540a2', 'de7348b1-0d11-45b1-98d5-6fb857e99b7c', 'Tempeiros', 0, '2026-01-10 13:42:51'),
('b67454d3-bcc8-4c87-bc39-1b0dc9ea1743', 'de7348b1-0d11-45b1-98d5-6fb857e99b7c', 'Adicionais', 0, '2026-01-10 13:47:44'),
('a1bdf2d6-625f-4481-b47f-332e85e15b0d', '070e0b33-ff55-4007-ad5c-0a3389800838', 'Vodka', 1, '2026-01-10 21:24:24'),
('e54f9e2e-6848-4223-9127-d8859eb5d3a3', '070e0b33-ff55-4007-ad5c-0a3389800838', 'Gin', 2, '2026-01-10 21:24:24'),
('25f32619-2528-4b0f-99da-2bd1b0492d80', '070e0b33-ff55-4007-ad5c-0a3389800838', 'Whisky', 3, '2026-01-10 21:24:24'),
('2f33db99-b027-4b73-88ca-aeb049dcf07b', '070e0b33-ff55-4007-ad5c-0a3389800838', 'Rum', 4, '2026-01-10 21:24:24'),
('cc96bddf-3ca3-4a18-87a3-723bd0d3f7da', '070e0b33-ff55-4007-ad5c-0a3389800838', 'Tequila', 5, '2026-01-10 21:24:24'),
('f9e7e060-906e-44bc-9d3e-30d91bc11057', '070e0b33-ff55-4007-ad5c-0a3389800838', 'Cognac', 6, '2026-01-10 21:24:24'),
('b3762a98-8d70-48d2-aecf-1e28e48a4f0b', 'e76182c5-9b43-4dfa-8656-19269415f88d', 'Refrigerante', 1, '2026-01-10 21:24:24'),
('d83f87be-30a8-4c48-bacd-0fd54c3767f6', 'e76182c5-9b43-4dfa-8656-19269415f88d', 'Energético', 2, '2026-01-10 21:24:24'),
('c21a6b6f-34f4-48aa-bb13-83d716615f7f', 'e76182c5-9b43-4dfa-8656-19269415f88d', 'Cerveja Zero', 3, '2026-01-10 21:24:24'),
('35e32753-d19a-46ea-bbc8-1e65181a6608', 'e76182c5-9b43-4dfa-8656-19269415f88d', 'Água com Gás', 4, '2026-01-10 21:24:24'),
('f691c9fe-8379-4172-8e96-7d5eb6e5f2a5', 'e76182c5-9b43-4dfa-8656-19269415f88d', 'Água sem Gás', 5, '2026-01-10 21:24:24'),
('10036c05-6051-4b99-8730-092fe96dfd8d', 'a6295525-6991-45bd-b7b8-4b16618327a0', 'Cerveja', 1, '2026-01-10 21:24:24'),
('31448a77-369d-4062-8702-b242d7c619ad', 'a6295525-6991-45bd-b7b8-4b16618327a0', 'Vinho', 2, '2026-01-10 21:24:24'),
('58099248-c6ff-445b-9bac-007dd53743a7', 'a6295525-6991-45bd-b7b8-4b16618327a0', 'Licor', 3, '2026-01-10 21:24:24'),
('98d91d5f-4d98-46f9-bbe7-c66140e5bd38', 'da33b3f4-28d6-4ca2-bc97-cc65c979eb71', 'Sementes', 0, '2026-01-11 00:32:22'),
('d5003023-155f-4ddd-9cfd-c23ef29ccd44', '0a63a3a3-09d3-4a01-94cc-35c269c5ff78', 'PEIXES', 0, '2026-01-11 05:28:09'),
('0b71f838-aa79-411f-9bef-a206f594f673', 'de7348b1-0d11-45b1-98d5-6fb857e99b7c', 'Pimentas', 0, '2026-01-11 05:46:51'),
('907aa7ef-5005-4a2a-8f2f-d17090e4b865', '827a1cc5-01d7-4995-aa4e-0f9897498772', 'Legumes', 0, '2026-01-11 06:13:30'),
('7cf1fa21-5282-4a78-b5d7-a8953a73f0e9', '827a1cc5-01d7-4995-aa4e-0f9897498772', 'Verduras', 0, '2026-01-11 06:13:33'),
('8a3cff12-0d56-4fdf-92af-ca0c6c7161e1', '408c3481-e416-47c1-831a-d92b3dfda6d6', 'BOVINA', 0, '2026-01-11 06:24:02'),
('5479cdb0-da5a-4a8d-89dc-87fc5a776d10', '408c3481-e416-47c1-831a-d92b3dfda6d6', 'SUINA', 0, '2026-01-11 06:24:08'),
('a1f97b93-3ed3-4bf7-b6dd-4504842e7f04', '408c3481-e416-47c1-831a-d92b3dfda6d6', 'FRANGO', 0, '2026-01-11 06:24:12'),
('88208c84-17ac-4ec2-a050-e0dddb44772e', '408c3481-e416-47c1-831a-d92b3dfda6d6', 'LINGUIÇA', 0, '2026-01-11 06:34:33'),
('9f76771c-b76a-4d09-a956-75d6d78e0d3f', 'da33b3f4-28d6-4ca2-bc97-cc65c979eb71', 'GORDURA', 0, '2026-01-11 06:37:15'),
('be2edcd1-79ed-49e0-9c96-2e77035ce299', '61bb6288-d3cf-4a08-8189-bccf74ebea3d', 'CITRUS', 0, '2026-01-11 06:41:23'),
('46547202-c54d-4533-b55e-c08c32875c9c', '61bb6288-d3cf-4a08-8189-bccf74ebea3d', 'POMES', 0, '2026-01-11 06:41:28'),
('2d15d182-9182-4692-9d9d-ee93d064fd78', '61bb6288-d3cf-4a08-8189-bccf74ebea3d', 'FRUTAS DE CAROÇO', 0, '2026-01-11 06:41:40'),
('268c7230-bb8f-4c13-aea8-3e41a1661ad1', '61bb6288-d3cf-4a08-8189-bccf74ebea3d', 'FRUTOS PEQUENOS', 0, '2026-01-11 06:41:50');

-- =====================================================
-- DADOS: INVENTORY_ITEMS (ITENS DO INVENTÁRIO)
-- =====================================================

INSERT INTO inventory_items (id, name, description, quantity, min_quantity, unit, sector, category, price, created_at, updated_at) VALUES
('50f8a84e-d549-44a5-b923-59f0271f8312', 'COSTELINHA DE PORCO', NULL, 0, 3, 'kg', 'cozinha', 'SUINA', 20, '2026-01-11 06:29:03', '2026-01-16 03:09:34'),
('fd0ef0c9-e563-4409-889d-39dd76b9e0ae', 'Licor 43 Diego Zamorra - 700ml', NULL, 0, 10, 'unidade', 'bar', 'Licor', 160, '2026-01-08 08:16:22', '2026-01-16 03:09:34'),
('557cc2b8-011a-4488-8f58-028e4e9bf5b5', 'heineken zero 330ml', NULL, 0, 10, 'unidade', 'bar', 'Cerveja Zero', 7.5, '2026-01-08 08:06:26', '2026-01-16 03:09:34'),
('26eee726-b83b-45cf-b3b0-03a51db4d23c', 'Água Com Gás 500ml', NULL, 0, 10, 'unidade', 'bar', 'Água com Gás', 3, '2026-01-08 08:09:01', '2026-01-16 03:09:34'),
('9b6337fa-7f45-43bb-8d0d-9d33dde5473b', 'PEITO DE FRANGO', NULL, 0, 3, 'kg', 'cozinha', 'FRANGO', 40, '2026-01-11 06:31:09', '2026-01-16 03:09:34'),
('40b48f8c-7266-45f3-83b8-87f5b4947aaa', 'Rum Bacardi Carta Blanca Garrafa 980mL', NULL, 0, 10, 'unidade', 'bar', 'Rum', 70, '2026-01-11 06:01:16', '2026-01-16 03:09:34'),
('9d7f9129-1761-4a77-9f01-99a90b440402', 'Cognac Hennessy VS Very Special 700 ml', NULL, 0, 10, 'unidade', 'bar', 'Cognac', 300, '2026-01-11 06:03:01', '2026-01-16 03:09:34'),
('1bd87327-0f9e-430b-b9d3-98459db86a89', 'Vinho Fino Tinto Merlot 720ml', NULL, 0, 10, 'unidade', 'bar', 'Vinho', 60, '2026-01-08 08:13:26', '2026-01-16 03:09:34'),
('6f1d50d2-8f02-483a-bdb8-bc2017971344', 'CERVEJA CORONA 330ML', NULL, 0, 10, 'unidade', 'bar', 'Cerveja', 7, '2026-01-11 05:52:49', '2026-01-16 03:09:34'),
('a4ba3d21-d8c3-47cc-8128-dc2ed03d4786', 'REDBULL 250ml', NULL, 0, 25, 'unidade', 'bar', 'Energético', 8, '2026-01-08 08:17:22', '2026-01-16 03:09:34'),
('fb89fd38-be6e-46b3-9d80-ef22e34b84aa', 'Coca Cola Lata', NULL, 0, 25, 'unidade', 'bar', 'Refrigerante', 7, '2026-01-08 08:05:27', '2026-01-16 03:09:34'),
('11fd1c7a-9676-443f-9e51-ad69e5a4a0aa', 'Tequila Jose Cuervo Gold 750 ml', NULL, 0, 10, 'unidade', 'bar', 'Tequila', 110, '2026-01-11 05:59:44', '2026-01-16 03:09:34'),
('96c67fd7-a8bb-460d-81d0-50dc9e7a44c6', 'ASINHAS DE FRANGO', NULL, 0, 3, 'kg', 'cozinha', 'FRANGO', 25, '2026-01-11 06:33:32', '2026-01-16 03:09:34'),
('93e63c8a-e5a3-4bb6-b272-9dc534a7df6e', 'FILÉ MIGNON', NULL, 0, 3, 'kg', 'cozinha', 'BOVINA', 80, '2026-01-11 06:30:15', '2026-01-16 03:09:34'),
('e904386a-5be4-42c0-af48-67cd48fccbe6', 'ALHO', NULL, 5, 5, 'kg', 'cozinha', 'Tempeiros', 50, '2026-01-10 13:48:14', '2026-01-17 03:20:11'),
('fab86973-556b-49b9-ac84-0c2bcfc81cb4', 'GIN TANQUERAY 375ML', NULL, 5, 10, 'unidade', 'bar', 'Gin', 60, '2026-01-08 07:55:41', '2026-01-17 03:58:49'),
('dbf96cee-cb30-4d32-8591-b3b273b0fcf9', 'Vodka Absolut 1L.', NULL, 0, 10, 'unidade', 'bar', 'Vodka', 90, '2026-01-08 07:53:49', '2026-01-20 20:20:36'),
('68682e30-7808-4662-a27e-86cf8e1a0047', 'LINGUIÇA DE PORCO', NULL, 0, 3, 'kg', 'cozinha', 'LINGUIÇA', 30, '2026-01-11 06:35:57', '2026-01-16 03:09:34'),
('65dd9228-5986-4018-a34e-182614c20d35', 'LINGUIÇA DE FRANGO', NULL, 0, 3, 'kg', 'cozinha', 'LINGUIÇA', 33, '2026-01-11 06:36:35', '2026-01-16 03:09:34'),
('3f655cc1-5c94-43fc-ab2c-6e938cc5e1c3', 'Água Sem Gás 500ml', NULL, 0, 10, 'unidade', 'bar', 'Água sem Gás', 2.5, '2026-01-08 08:09:52', '2026-01-16 03:09:34'),
('dc5f6ffa-9164-4157-a2a0-e851ce04e8f3', 'Cerveja Heineken 330ml', NULL, 0, 10, 'unidade', 'bar', 'Cerveja', 7.5, '2026-01-08 08:03:10', '2026-01-16 03:09:34'),
('9b1ced1b-1c12-4eac-a263-48e9f37edf75', 'Whisky Royal Salute 21 anos The Signature Blend Escocês - 700 ml', NULL, 0, 10, 'unidade', 'bar', 'Whisky', 900, '2026-01-08 08:00:55', '2026-01-16 03:09:34'),
('a2d6f1e1-513c-41ba-9a80-785de45fa42a', 'Whisky Johnnie Walker Black Label 12 Anos 1L', NULL, 5, 10, 'unidade', 'bar', 'Whisky', 300, '2026-01-08 07:59:27', '2026-01-17 03:59:17');

-- =====================================================
-- DADOS: STOCK_MOVEMENTS (MOVIMENTAÇÕES)
-- =====================================================

INSERT INTO stock_movements (id, item_id, user_id, movement_type, quantity, notes, item_name_snapshot, item_sector, item_unit, item_price, created_at) VALUES
('b00e2e45-f8c3-4684-82d6-7f03c9ee6eac', 'dbf96cee-cb30-4d32-8591-b3b273b0fcf9', 'f0133204-e70f-40aa-b8dc-3381afc40666', 'entrada', 12, NULL, 'Vodka Absolut 1L.', 'bar', 'unidade', 90, '2026-01-16 23:28:56'),
('39fe1e43-3a82-4b93-9c49-5923c0b796a0', 'e904386a-5be4-42c0-af48-67cd48fccbe6', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'entrada', 5, NULL, 'ALHO', 'cozinha', 'kg', 50, '2026-01-17 03:20:11'),
('93e93a06-a7d7-4b69-ae30-dec5ede7cd40', 'dbf96cee-cb30-4d32-8591-b3b273b0fcf9', 'f0133204-e70f-40aa-b8dc-3381afc40666', 'saida', 5, NULL, 'Vodka Absolut 1L.', 'bar', 'unidade', 90, '2026-01-17 03:56:59'),
('4b3adce0-9b48-4d53-982f-4bce57740b05', 'fab86973-556b-49b9-ac84-0c2bcfc81cb4', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'entrada', 5, NULL, 'GIN TANQUERAY 375ML', 'bar', 'unidade', 60, '2026-01-17 03:58:49'),
('54a5350f-dc98-44a1-95a7-cc3d5da9435c', 'a2d6f1e1-513c-41ba-9a80-785de45fa42a', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'entrada', 5, NULL, 'Whisky Johnnie Walker Black Label 12 Anos 1L', 'bar', 'unidade', 300, '2026-01-17 03:59:17'),
('290833af-7f35-441c-893e-f05d967331a3', 'dbf96cee-cb30-4d32-8591-b3b273b0fcf9', 'f0133204-e70f-40aa-b8dc-3381afc40666', 'saida', 7, NULL, 'Vodka Absolut 1L.', 'bar', 'unidade', 90, '2026-01-20 20:20:36');

-- =====================================================
-- DADOS: ADMIN_ACTIONS (AÇÕES ADMINISTRATIVAS)
-- =====================================================

INSERT INTO admin_actions (id, user_id, target_user_id, target_user_name, action_type, details, created_at) VALUES
('3d916573-7451-4a35-992c-4e7673e09071', 'f0133204-e70f-40aa-b8dc-3381afc40666', '9c965e9f-46ee-46b4-85fb-2226d726952f', 'TESTE COZINHA', 'create_employee', '{"phone":"62993909093","sector":"cozinha"}', '2026-01-13 07:08:01'),
('abd90c74-2bcc-4437-9540-cbc51a6ed8b3', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', '112b5173-3e30-4f9d-bf8d-a617144cd1ed', 'fulano', 'create_employee', '{"phone":"62993930404","sector":"bar"}', '2026-01-13 07:09:36'),
('70de5e97-f4d2-45d4-babd-31b652dbe436', 'f0133204-e70f-40aa-b8dc-3381afc40666', '112b5173-3e30-4f9d-bf8d-a617144cd1ed', 'fulano', 'delete_employee', NULL, '2026-01-13 07:10:04'),
('d82ab7f3-7d8b-45b1-bc8a-9253a3691ff1', 'f0133204-e70f-40aa-b8dc-3381afc40666', '9c965e9f-46ee-46b4-85fb-2226d726952f', 'TESTE COZINHA', 'delete_employee', NULL, '2026-01-13 07:11:29'),
('4eab62d7-569f-48d2-ac55-ce422c9478d4', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', '548ea9cd-fe5a-4ee0-aa46-fc4d59a9005d', 'IKARO MORAIS', 'update_sector', '{"new_sector":"cozinha","old_sector":"bar"}', '2026-01-14 20:31:44'),
('b1565d71-00e4-44cc-a999-7e840a139c44', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', '548ea9cd-fe5a-4ee0-aa46-fc4d59a9005d', 'IKARO MORAIS', 'update_sector', '{"new_sector":"bar","old_sector":"cozinha"}', '2026-01-14 20:32:05'),
('53d06796-6684-4b16-9357-5c42fdcf45b9', 'f0133204-e70f-40aa-b8dc-3381afc40666', 'aec0fc98-9144-4c29-a90b-6d812539e670', 'FUNCIONARIO TESTE', 'update_sector', '{"new_sector":"bar","old_sector":"cozinha"}', '2026-01-14 21:44:13'),
('5031fa68-58ac-43d1-b9dc-8602e6c744c3', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', '548ea9cd-fe5a-4ee0-aa46-fc4d59a9005d', 'IKARO MORAIS', 'update_sector', '{"new_sector":"cozinha","old_sector":"bar"}', '2026-01-16 03:18:55'),
('5f11fb11-3149-4f85-96f6-5ec8d778781e', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', '548ea9cd-fe5a-4ee0-aa46-fc4d59a9005d', 'IKARO MORAIS', 'update_sector', '{"new_sector":"bar","old_sector":"cozinha"}', '2026-01-16 03:18:58'),
('46b1d9a7-68cd-4b81-848f-506d26cde9ff', 'f0133204-e70f-40aa-b8dc-3381afc40666', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'GESTOR PRINCIPAL', 'update_employee', '{"changes":{"password":"updated","sector":{"from":null,"to":""}}}', '2026-01-16 14:23:10'),
('b9332cf7-e570-4e88-9ea6-7571a99e70f9', 'f0133204-e70f-40aa-b8dc-3381afc40666', 'aec0fc98-9144-4c29-a90b-6d812539e670', 'FUNCIONARIO TESTE', 'update_employee', '{"changes":{"fullName":{"from":"FUNCIONARIO TESTE","to":"FULANO"},"password":"updated","sector":{"from":"bar","to":"cozinha"}}}', '2026-01-16 14:29:03'),
('c5675572-5ca0-4e99-915d-b892c782ea09', 'f0133204-e70f-40aa-b8dc-3381afc40666', '548ea9cd-fe5a-4ee0-aa46-fc4d59a9005d', 'IKARO MORAIS', 'update_employee', '{"changes":{"password":"updated"}}', '2026-01-16 14:29:24');

-- =====================================================
-- DADOS: PRODUCT_EDIT_HISTORY (HISTÓRICO DE EDIÇÕES)
-- =====================================================

INSERT INTO product_edit_history (id, item_id, user_id, item_name_snapshot, field_changed, old_value, new_value, created_at) VALUES
('9b71ae03-0681-4e2e-b8ab-1ab9b9966a09', 'dbf96cee-cb30-4d32-8591-b3b273b0fcf9', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Vodka Absolut 1L', 'Quantidade', '6', '9', '2026-01-11 02:49:10'),
('2f03f7f3-869f-4224-8ffc-54459000a657', 'dc5f6ffa-9164-4157-a2a0-e851ce04e8f3', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Cerveja Heineken 330ml', 'Qtd. Mínima', '0', '10', '2026-01-11 05:53:00'),
('a014497a-42f7-45c4-8813-da89cca1aa3d', 'dc5f6ffa-9164-4157-a2a0-e851ce04e8f3', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Cerveja Heineken 330ml', 'Preço', '0', '7.50', '2026-01-11 05:53:11'),
('f823287d-2564-4e57-a463-c1f41de6d446', '1bd87327-0f9e-430b-b9d3-98459db86a89', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Vinho Fino Tinto Merlot 720ml', 'Preço', '0', '60', '2026-01-11 05:53:39'),
('07066d34-66e8-42f8-820d-1152f6d45fa4', 'fd0ef0c9-e563-4409-889d-39dd76b9e0ae', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Licor 43 Diego Zamorra - 700ml', 'Preço', '0', '160', '2026-01-11 05:54:12'),
('e3f42f71-6824-4e37-8d23-0c5f2f820aab', '1bd87327-0f9e-430b-b9d3-98459db86a89', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Vinho Fino Tinto Merlot 720ml', 'Qtd. Mínima', '0', '10', '2026-01-11 05:54:45'),
('e97b7f9f-f82a-4c95-9697-3bc909c79100', '1bd87327-0f9e-430b-b9d3-98459db86a89', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Vinho Fino Tinto Merlot 720ml', 'Categoria', 'Vinho', 'Licor', '2026-01-11 05:54:45'),
('bdad7569-1964-4b07-a9ca-a5de2d7765e5', 'fd0ef0c9-e563-4409-889d-39dd76b9e0ae', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Licor 43 Diego Zamorra - 700ml', 'Qtd. Mínima', '0', '10', '2026-01-11 05:55:01'),
('03929b24-1546-4e82-8d58-fa46b9fb58ce', '557cc2b8-011a-4488-8f58-028e4e9bf5b5', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'heineken zero 330ml', 'Qtd. Mínima', '0', '10', '2026-01-11 05:55:29'),
('24e6935d-f7f5-4df1-a5e4-71fb4bf3eeea', '26eee726-b83b-45cf-b3b0-03a51db4d23c', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Água Com Gás 500ml', 'Qtd. Mínima', '0', '10', '2026-01-11 05:55:37'),
('1d8fb505-a914-4bf9-8e1d-c64e068ab06b', '3f655cc1-5c94-43fc-ab2c-6e938cc5e1c3', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Água Sem Gás 500ml', 'Qtd. Mínima', '0', '10', '2026-01-11 05:55:44'),
('06396cb4-c1d8-43ba-8998-44d94b3c0431', '9b1ced1b-1c12-4eac-a263-48e9f37edf75', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Whisky Royal Salute 21 anos The Signature Blend Escocês - 700 ml', 'Qtd. Mínima', '9', '10', '2026-01-11 05:56:37'),
('1f8d2d22-cd8c-4072-985b-a1add64be7a9', '9b1ced1b-1c12-4eac-a263-48e9f37edf75', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Whisky Royal Salute 21 anos The Signature Blend Escocês - 700 ml', 'Preço', '0', '900', '2026-01-11 05:56:37'),
('38c9e418-481a-43b5-bad1-f22f17dd65ae', 'fab86973-556b-49b9-ac84-0c2bcfc81cb4', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'GIN TANQUERAY 375ML', 'Qtd. Mínima', '0', '10', '2026-01-11 05:57:13'),
('391cdbc0-0009-42e5-8360-e07e1f093408', 'fab86973-556b-49b9-ac84-0c2bcfc81cb4', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'GIN TANQUERAY 375ML', 'Preço', '0', '60', '2026-01-11 05:57:13'),
('41280be3-e851-4e41-b722-3f862ba48e8b', 'dbf96cee-cb30-4d32-8591-b3b273b0fcf9', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Vodka Absolut 1L', 'Qtd. Mínima', '0', '10', '2026-01-11 05:57:46'),
('f4147521-32cd-45f2-9592-c835bd16df4a', 'dbf96cee-cb30-4d32-8591-b3b273b0fcf9', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Vodka Absolut 1L', 'Preço', '0', '90', '2026-01-11 05:57:46'),
('fb143200-1c01-470e-81c1-ae9241434de5', 'a2d6f1e1-513c-41ba-9a80-785de45fa42a', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Whisky Johnnie Walker Black Label 12 Anos 1L', 'Qtd. Mínima', '9', '10', '2026-01-11 05:58:49'),
('40b4ff87-9f11-41dc-9b37-e24f97a4a9ea', 'a2d6f1e1-513c-41ba-9a80-785de45fa42a', '404ae1ce-6bf0-41d4-a479-2c97f7d97841', 'Whisky Johnnie Walker Black Label 12 Anos 1L', 'Preço', '0', '300', '2026-01-11 05:58:49');

-- Reabilitar verificações de chave estrangeira
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIM DO EXPORT
-- =====================================================
