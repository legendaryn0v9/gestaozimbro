-- =====================================================
-- BANCO DE DADOS COMPLETO - SISTEMA DE ESTOQUE ZIMBRO
-- Para importar no phpMyAdmin da Hostinger
-- =====================================================

-- Configurações iniciais
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "-03:00";

-- =====================================================
-- ESTRUTURA DAS TABELAS
-- =====================================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `avatar_url` TEXT DEFAULT NULL,
    `sector` ENUM('bar', 'cozinha') DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`),
    KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Funções/Cargos
CREATE TABLE IF NOT EXISTS `user_roles` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `role` ENUM('dono', 'admin', 'funcionario') DEFAULT 'funcionario',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS `categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `sector` ENUM('bar', 'cozinha') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_sector` (`sector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Subcategorias
CREATE TABLE IF NOT EXISTS `subcategories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `category_id` VARCHAR(36) NOT NULL,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `category_id` (`category_id`),
    CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Itens do Estoque
CREATE TABLE IF NOT EXISTS `inventory_items` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `quantity` DECIMAL(10,2) DEFAULT 0.00,
    `min_quantity` DECIMAL(10,2) DEFAULT 0.00,
    `unit` ENUM('unidade', 'kg', 'litro', 'caixa', 'pacote') DEFAULT 'unidade',
    `sector` ENUM('bar', 'cozinha') NOT NULL,
    `category` VARCHAR(100) DEFAULT NULL,
    `image_url` TEXT DEFAULT NULL,
    `price` DECIMAL(10,2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_sector` (`sector`),
    KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS `stock_movements` (
    `id` VARCHAR(36) NOT NULL,
    `item_id` VARCHAR(36) DEFAULT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `movement_type` ENUM('entrada', 'saida', 'edicao') NOT NULL,
    `quantity` DECIMAL(10,2) NOT NULL,
    `notes` TEXT DEFAULT NULL,
    `item_name_snapshot` VARCHAR(255) DEFAULT NULL,
    `item_sector` ENUM('bar', 'cozinha') DEFAULT NULL,
    `item_unit` ENUM('unidade', 'kg', 'litro', 'caixa', 'pacote') DEFAULT NULL,
    `item_price` DECIMAL(10,2) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `item_id` (`item_id`),
    KEY `user_id` (`user_id`),
    KEY `idx_type` (`movement_type`),
    KEY `idx_date` (`created_at`),
    CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL,
    CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Ações Administrativas
CREATE TABLE IF NOT EXISTS `admin_actions` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `action_type` VARCHAR(50) NOT NULL,
    `target_user_id` VARCHAR(36) DEFAULT NULL,
    `details` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `target_user_id` (`target_user_id`),
    KEY `idx_action_type` (`action_type`),
    CONSTRAINT `admin_actions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `admin_actions_ibfk_2` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Histórico de Edições de Produtos
CREATE TABLE IF NOT EXISTS `product_edit_history` (
    `id` VARCHAR(36) NOT NULL,
    `item_id` VARCHAR(36) DEFAULT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `item_name_snapshot` VARCHAR(255) DEFAULT NULL,
    `field_changed` VARCHAR(100) NOT NULL,
    `old_value` TEXT DEFAULT NULL,
    `new_value` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `item_id` (`item_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `product_edit_history_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_edit_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DADOS (Serão preenchidos pelo export_hostinger.sql)
-- =====================================================

-- COPIE OS DADOS DO ARQUIVO export_hostinger.sql AQUI
-- OU importe primeiro este arquivo e depois o export_hostinger.sql

COMMIT;
