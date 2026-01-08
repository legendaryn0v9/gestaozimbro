# Backend PHP/MySQL - Sistema de Inventário

## Configuração na Hostinger

### 1. Criar banco de dados MySQL
1. Acesse o painel da Hostinger
2. Vá em "Databases" → "MySQL Databases"
3. Crie um novo banco de dados
4. Anote: nome do banco, usuário e senha

### 2. Importar estrutura do banco
1. Acesse phpMyAdmin na Hostinger
2. Selecione seu banco de dados
3. Vá na aba "Import"
4. Faça upload do arquivo `database.sql`

### 3. Configurar conexão
Edite o arquivo `config/database.php` e atualize:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'seu_banco_de_dados');
define('DB_USER', 'seu_usuario');
define('DB_PASS', 'sua_senha');
define('JWT_SECRET', 'sua-chave-secreta-unica');
```

### 4. Upload dos arquivos
1. Faça upload da pasta `backend` para `public_html/api` na Hostinger
2. A estrutura ficará: `public_html/api/config/`, `public_html/api/auth/`, etc.

### 5. Configurar o Frontend
No arquivo `src/lib/api.ts`, atualize a URL base:
```typescript
const API_BASE_URL = 'https://seudominio.com/api';
```

## Estrutura de Pastas
```
backend/
├── config/
│   └── database.php      # Configuração do banco
├── api/
│   ├── auth/
│   │   ├── login.php     # POST - Login
│   │   ├── register.php  # POST - Registro
│   │   └── me.php        # GET - Dados do usuário
│   ├── inventory/
│   │   ├── list.php      # GET - Listar itens
│   │   ├── create.php    # POST - Criar item
│   │   ├── update.php    # PUT - Atualizar item
│   │   └── delete.php    # DELETE - Deletar item
│   ├── movements/
│   │   ├── list.php      # GET - Listar movimentos
│   │   └── create.php    # POST - Criar movimento
│   └── users/
│       ├── list.php      # GET - Listar usuários
│       └── update-role.php # PUT - Atualizar role
├── database.sql          # Schema do banco
├── .htaccess            # Configurações Apache
└── README.md            # Este arquivo
```

## Endpoints da API

### Autenticação
- `POST /api/auth/login.php` - Login
- `POST /api/auth/register.php` - Registro
- `GET /api/auth/me.php` - Dados do usuário logado

### Inventário
- `GET /api/inventory/list.php?sector=bar` - Listar itens
- `POST /api/inventory/create.php` - Criar item
- `PUT /api/inventory/update.php?id=xxx` - Atualizar item
- `DELETE /api/inventory/delete.php?id=xxx` - Deletar item

### Movimentos
- `GET /api/movements/list.php` - Listar movimentos
- `POST /api/movements/create.php` - Criar movimento

### Usuários
- `GET /api/users/list.php` - Listar usuários
- `PUT /api/users/update-role.php` - Atualizar role

## Usuário Admin Padrão
- Email: admin@example.com
- Senha: admin123

**IMPORTANTE:** Altere a senha do admin após o primeiro login!
