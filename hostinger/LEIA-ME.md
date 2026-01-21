# 🚀 GUIA ULTRA SIMPLES - Hostinger

## O que você precisa fazer:

### 1️⃣ Baixar o Projeto
- Clique em **"Code"** (canto superior direito no Lovable)
- Clique em **"Download as ZIP"**
- Extraia o ZIP no seu computador

### 2️⃣ Gerar o Build (Windows)
1. Abra a pasta do projeto extraído
2. Clique duas vezes no arquivo `hostinger/build-windows.bat`
3. Aguarde terminar (pode demorar alguns minutos na primeira vez)
4. Os arquivos prontos estarão em `hostinger/dist/`

### 2️⃣ Gerar o Build (Mac/Linux)
1. Abra o Terminal
2. Navegue até a pasta do projeto: `cd /caminho/para/pasta`
3. Execute: `chmod +x hostinger/build-mac-linux.sh && ./hostinger/build-mac-linux.sh`
4. Os arquivos prontos estarão em `hostinger/dist/`

### 3️⃣ Configurar Banco de Dados na Hostinger
1. Acesse o **hPanel** da Hostinger
2. Vá em **Banco de Dados** → **MySQL**
3. Crie um novo banco (anote: nome, usuário, senha)
4. Clique em **phpMyAdmin**
5. Selecione seu banco à esquerda
6. Clique em **Importar**
7. Escolha o arquivo `hostinger/database_completo.sql`
8. Clique em **Executar**

### 4️⃣ Configurar Conexão do Backend
1. Abra o arquivo `hostinger/backend/config/database.php`
2. Altere estas linhas:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'NOME_DO_SEU_BANCO');
define('DB_USER', 'USUARIO_DO_BANCO');
define('DB_PASS', 'SENHA_DO_BANCO');
```

### 5️⃣ Fazer Upload na Hostinger
No Gerenciador de Arquivos do hPanel:

1. **Frontend** (site):
   - Faça upload de TUDO que está em `hostinger/dist/` para `public_html/`

2. **Backend** (API):
   - Crie a pasta `api` dentro de `public_html`
   - Faça upload de TUDO que está em `hostinger/backend/` para `public_html/api/`

### 6️⃣ Criar Primeiro Usuário
No phpMyAdmin, execute este SQL (altere os dados):

```sql
-- 1. Criar o usuário
INSERT INTO profiles (id, email, full_name, phone, password) VALUES (
  UUID(),
  'seu@email.com',
  'Seu Nome',
  '11999999999',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' -- senha: password
);

-- 2. Pegar o ID do usuário criado e definir como admin
INSERT INTO user_roles (id, user_id, role) 
SELECT UUID(), id, 'dono' FROM profiles WHERE email = 'seu@email.com';
```

**Ou crie a senha você mesmo em:** https://bcrypt-generator.com/

### ✅ Pronto!
Acesse seu domínio e faça login com telefone + senha!

---

## 📁 Estrutura Final

```
public_html/
├── index.html          ← Página principal
├── assets/             ← CSS e JS
├── .htaccess           ← Rotas do frontend
└── api/
    ├── config/
    │   └── database.php
    ├── auth/
    ├── inventory/
    ├── movements/
    ├── users/
    ├── categories/
    ├── history/
    ├── admin/
    └── .htaccess
```

## ❓ Problemas?

| Problema | Solução |
|----------|---------|
| Tela branca | Verifique se `.htaccess` foi enviado para `public_html` |
| Erro de login | Verifique se criou usuário corretamente |
| Erro 500 | Verifique credenciais do banco em `api/config/database.php` |
| Erro de CORS | Verifique se `.htaccess` da pasta `api` está correto |
