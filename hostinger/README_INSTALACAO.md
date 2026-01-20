# 🚀 Guia de Instalação na Hostinger

## Passo a Passo FÁCIL para Leigos

---

## 📋 O QUE VOCÊ VAI PRECISAR

1. Acesso ao painel da Hostinger (hPanel)
2. O arquivo `database_completo.sql` desta pasta
3. Os arquivos da pasta `backend/` e `frontend/`

---

## PASSO 1: Criar o Banco de Dados

1. Entre no **hPanel da Hostinger**
2. Vá em **Bancos de Dados** → **MySQL**
3. Clique em **Criar novo banco de dados**
4. Preencha:
   - Nome do banco: `zimbro_estoque` (ou outro nome)
   - Nome de usuário: `zimbro_user` (ou outro nome)
   - Senha: crie uma senha forte
5. Clique em **Criar**
6. **ANOTE** esses dados, você vai precisar:
   - Nome do banco
   - Nome de usuário
   - Senha

---

## PASSO 2: Importar os Dados

1. Ainda em **Bancos de Dados**, clique em **phpMyAdmin**
2. Selecione o banco que você criou na lista à esquerda
3. Clique na aba **Importar** (no topo)
4. Clique em **Escolher arquivo**
5. Selecione o arquivo `database_completo.sql` desta pasta
6. Clique em **Executar** (no final da página)
7. Aguarde a mensagem de sucesso ✅

---

## PASSO 3: Fazer Upload dos Arquivos do Backend

1. No hPanel, vá em **Gerenciador de Arquivos**
2. Navegue até a pasta `public_html`
3. Crie uma pasta chamada `api` (clique com botão direito → Nova Pasta)
4. Entre na pasta `api`
5. Faça upload de TODOS os arquivos da pasta `hostinger/backend/` desta pasta
   - Você pode selecionar todos e arrastar, ou usar o botão **Upload**
6. A estrutura deve ficar assim:
   ```
   public_html/
   └── api/
       ├── config/
       │   └── database.php
       ├── auth/
       │   ├── login.php
       │   └── me.php
       ├── inventory/
       │   ├── list.php
       │   ├── create.php
       │   ├── update.php
       │   └── delete.php
       ├── movements/
       │   ├── list.php
       │   ├── create.php
       │   └── delete.php
       ├── users/
       │   ├── list.php
       │   ├── create.php
       │   ├── update.php
       │   └── update-role.php
       └── .htaccess
   ```

---

## PASSO 4: Configurar a Conexão do Banco

1. No Gerenciador de Arquivos, vá até `public_html/api/config/`
2. Clique no arquivo `database.php` e depois em **Editar**
3. Altere estas linhas com os dados do PASSO 1:

```php
define('DB_HOST', 'localhost');  // Geralmente é localhost na Hostinger
define('DB_NAME', 'SEU_BANCO');  // Nome do banco que você criou
define('DB_USER', 'SEU_USUARIO'); // Nome de usuário que você criou
define('DB_PASS', 'SUA_SENHA');   // Senha que você criou
```

4. **IMPORTANTE:** Altere também a chave JWT para uma senha única:
```php
define('JWT_SECRET', 'CRIE_UMA_SENHA_SUPER_SECRETA_AQUI');
```

5. Clique em **Salvar**

---

## PASSO 5: Fazer Upload do Frontend

1. Volte para `public_html` no Gerenciador de Arquivos
2. Faça upload de TODOS os arquivos da pasta `hostinger/frontend/dist/`
   - Isso inclui `index.html`, a pasta `assets/`, etc.
3. A estrutura final deve ficar:
   ```
   public_html/
   ├── api/            (backend PHP)
   ├── assets/         (CSS e JS do frontend)
   ├── index.html      (página principal)
   └── .htaccess       (configuração de rotas)
   ```

---

## PASSO 6: Apontar seu Domínio

1. Se você tem um domínio próprio:
   - No hPanel, vá em **Domínios** → **Adicionar Domínio**
   - Siga as instruções para apontar seu domínio

2. Ou use o domínio temporário da Hostinger que já vem configurado

---

## PASSO 7: Testar!

1. Acesse seu site pelo navegador: `https://seudominio.com`
2. Faça login com:
   - **Telefone:** O telefone cadastrado no sistema
   - **Senha:** A senha do usuário

---

## 🔐 Credenciais Padrão

Se você importou o `database_completo.sql`, os usuários são os mesmos que estavam no sistema.

Se precisar criar um novo admin, execute este SQL no phpMyAdmin:

```sql
-- Criar usuário admin (senha: admin123)
INSERT INTO users (id, email, password, full_name, phone) VALUES 
(UUID(), 'admin@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', '11999999999');

-- Definir como admin
INSERT INTO user_roles (id, user_id, role) 
SELECT UUID(), id, 'dono' FROM users WHERE email = 'admin@empresa.com';
```

---

## ❓ Problemas Comuns

### Erro 500 (Internal Server Error)
- Verifique se o arquivo `.htaccess` foi enviado corretamente
- Verifique se as configurações do banco estão corretas

### Página em branco
- Verifique se o arquivo `index.html` está na raiz de `public_html`

### Erro de login
- Verifique se o banco foi importado corretamente
- Verifique as configurações em `api/config/database.php`

### Erro de CORS
- O arquivo `.htaccess` já está configurado para permitir CORS
- Verifique se foi enviado corretamente

---

## 📞 Suporte

Se tiver dúvidas:
1. Verifique todos os passos novamente
2. Confira se todos os arquivos foram enviados
3. Verifique as permissões dos arquivos (devem ser 644 para arquivos e 755 para pastas)

---

**Pronto! Seu sistema de estoque está funcionando na Hostinger! 🎉**
