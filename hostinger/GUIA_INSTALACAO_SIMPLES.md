# 🚀 Guia Simples de Instalação na Hostinger

## Passo 1: Baixar o Projeto

1. No Lovable, clique em **"<> Code"** no canto superior direito
2. Clique em **"Download as ZIP"** 
3. Extraia o arquivo ZIP no seu computador

## Passo 2: Preparar o Backend PHP

Os arquivos do backend estão na pasta `hostinger/backend/`

### 2.1 Editar a configuração do banco de dados:
Abra o arquivo `hostinger/backend/config/database.php` e altere:

```php
define('DB_HOST', 'localhost');           // Geralmente é localhost
define('DB_NAME', 'seu_banco_de_dados');  // Nome do banco que você criou
define('DB_USER', 'seu_usuario');         // Usuário do banco
define('DB_PASS', 'sua_senha');           // Senha do banco
```

### 2.2 Upload do Backend
- Acesse o **Gerenciador de Arquivos** no hPanel da Hostinger
- Vá para a pasta `public_html`
- Crie uma pasta chamada `api`
- Faça upload de TODO o conteúdo da pasta `hostinger/backend/` para dentro de `public_html/api/`

## Passo 3: Importar o Banco de Dados

1. No hPanel, vá em **Banco de Dados** → **MySQL Databases**
2. Crie um novo banco de dados (anote o nome, usuário e senha)
3. Clique em **phpMyAdmin** para acessar
4. Selecione seu banco de dados à esquerda
5. Clique na aba **Importar**
6. Escolha o arquivo `hostinger/database_completo.sql`
7. Clique em **Executar**

## Passo 4: Gerar o Frontend

### Opção A - Usando o Terminal (Recomendado)

1. Abra o terminal/prompt de comando
2. Navegue até a pasta do projeto extraído:
   ```bash
   cd caminho/para/pasta/do/projeto
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Substitua os arquivos para usar a API PHP:
   - Copie `hostinger/frontend/src/lib/api.ts` para `src/lib/api.ts`
   - Copie `hostinger/frontend/src/lib/auth.tsx` para `src/lib/auth.tsx`
   - Copie `hostinger/frontend/src/hooks/useInventory.ts` para `src/hooks/useInventory.ts`
   - Copie `hostinger/frontend/src/hooks/useCategories.ts` para `src/hooks/useCategories.ts`
   - Copie `hostinger/frontend/src/hooks/useUserProfile.ts` para `src/hooks/useUserProfile.ts`
   - Copie `hostinger/frontend/src/hooks/useUserRoles.ts` para `src/hooks/useUserRoles.ts`
   - Copie `hostinger/frontend/src/hooks/useUserSector.ts` para `src/hooks/useUserSector.ts`

5. Gere o build:
   ```bash
   npm run build
   ```

6. Os arquivos compilados estarão na pasta `dist/`

### Opção B - Usando um Script (Windows)

1. Crie um arquivo `build.bat` na pasta do projeto com este conteúdo:
   ```batch
   @echo off
   echo Copiando arquivos da Hostinger...
   copy /Y hostinger\frontend\src\lib\api.ts src\lib\api.ts
   copy /Y hostinger\frontend\src\lib\auth.tsx src\lib\auth.tsx
   copy /Y hostinger\frontend\src\hooks\useInventory.ts src\hooks\useInventory.ts
   copy /Y hostinger\frontend\src\hooks\useCategories.ts src\hooks\useCategories.ts
   copy /Y hostinger\frontend\src\hooks\useUserProfile.ts src\hooks\useUserProfile.ts
   copy /Y hostinger\frontend\src\hooks\useUserRoles.ts src\hooks\useUserRoles.ts
   copy /Y hostinger\frontend\src\hooks\useUserSector.ts src\hooks\useUserSector.ts
   echo Instalando dependencias...
   call npm install
   echo Gerando build...
   call npm run build
   echo Build concluido! Arquivos na pasta dist/
   pause
   ```

2. Execute o arquivo `build.bat`

## Passo 5: Upload do Frontend

1. No Gerenciador de Arquivos da Hostinger
2. Acesse `public_html`
3. Faça upload de TODO o conteúdo da pasta `dist/` para `public_html/`
4. Faça upload do arquivo `hostinger/frontend/.htaccess` para `public_html/`

## Passo 6: Criar Primeiro Usuário Admin

Como o sistema de autenticação foi migrado, você precisa criar um novo usuário:

1. Acesse o phpMyAdmin
2. Vá na tabela `profiles`
3. Clique em **Inserir** e adicione:
   - `id`: Um UUID (ex: use https://www.uuidgenerator.net/)
   - `email`: seu@email.com
   - `full_name`: Seu Nome
   - `phone`: 11999999999
   - `password`: Use este site para gerar a senha: https://bcrypt-generator.com/
     - Digite sua senha e copie o hash gerado

4. Vá na tabela `user_roles` e adicione:
   - `id`: Outro UUID
   - `user_id`: O mesmo ID usado em profiles
   - `role`: dono

## ✅ Pronto!

Acesse seu domínio e o sistema deve estar funcionando!

## 🔧 Problemas Comuns

### Tela Branca
- Verifique se o arquivo `.htaccess` foi enviado
- Verifique se a pasta `api/` está correta
- Abra o console do navegador (F12) para ver erros

### Erro de Login
- Verifique se criou o usuário corretamente
- Verifique se a senha foi gerada com bcrypt
- Verifique a conexão do banco em `api/config/database.php`

### Erro 500
- Verifique as credenciais do banco
- Verifique se a versão do PHP é 7.4 ou superior
- Verifique os logs de erro no hPanel

## 📁 Estrutura Final na Hostinger

```
public_html/
├── api/
│   ├── config/
│   │   └── database.php
│   ├── auth/
│   │   ├── login.php
│   │   ├── me.php
│   │   └── resolve-phone.php
│   ├── inventory/
│   ├── movements/
│   ├── users/
│   ├── categories/
│   ├── history/
│   ├── admin/
│   └── .htaccess
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
├── index.html
└── .htaccess
```
