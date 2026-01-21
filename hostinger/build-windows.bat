@echo off
echo.
echo ============================================
echo BUILD SISTEMA ZIMBRO - HOSTINGER
echo ============================================
echo.

echo Verificando pasta do projeto...
cd /d "%~dp0.."
if errorlevel 1 (
    echo ERRO: Nao foi possivel acessar a pasta do projeto
    echo Certifique-se de que o arquivo .bat esta dentro da pasta hostinger
    pause
    exit /b 1
)
echo Pasta atual: %CD%
echo.

echo [1/5] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Para instalar:
    echo 1. Acesse: https://nodejs.org
    echo 2. Baixe e instale a versao LTS
    echo 3. Reinicie o computador
    echo 4. Execute este script novamente
    echo.
    pause
    exit /b 1
)
node --version
echo Node.js encontrado!
echo.

echo [2/5] Instalando dependencias...
echo (Isso pode demorar alguns minutos na primeira vez)
echo.
call npm install
if errorlevel 1 (
    echo.
    echo ERRO ao instalar dependencias!
    echo Verifique sua conexao com a internet.
    echo.
    pause
    exit /b 1
)
echo Dependencias instaladas com sucesso!
echo.

echo [3/5] Copiando arquivos adaptados para Hostinger...
echo.

if not exist "hostinger\frontend\src\lib\api.ts" (
    echo ERRO: Arquivos da versao Hostinger nao encontrados!
    echo Certifique-se de que a pasta hostinger\frontend existe.
    pause
    exit /b 1
)

copy /Y "hostinger\frontend\src\lib\api.ts" "src\lib\api.ts" >nul
if errorlevel 1 (echo ERRO ao copiar api.ts & pause & exit /b 1)
echo   api.ts copiado

copy /Y "hostinger\frontend\src\lib\auth.tsx" "src\lib\auth.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar auth.tsx & pause & exit /b 1)
echo   auth.tsx copiado

copy /Y "hostinger\frontend\src\hooks\useInventory.ts" "src\hooks\useInventory.ts" >nul
if errorlevel 1 (echo ERRO ao copiar useInventory.ts & pause & exit /b 1)
echo   useInventory.ts copiado

copy /Y "hostinger\frontend\src\hooks\useCategories.ts" "src\hooks\useCategories.ts" >nul
if errorlevel 1 (echo ERRO ao copiar useCategories.ts & pause & exit /b 1)
echo   useCategories.ts copiado

copy /Y "hostinger\frontend\src\hooks\useUserProfile.ts" "src\hooks\useUserProfile.ts" >nul
if errorlevel 1 (echo ERRO ao copiar useUserProfile.ts & pause & exit /b 1)
echo   useUserProfile.ts copiado

copy /Y "hostinger\frontend\src\hooks\useUserRoles.ts" "src\hooks\useUserRoles.ts" >nul
if errorlevel 1 (echo ERRO ao copiar useUserRoles.ts & pause & exit /b 1)
echo   useUserRoles.ts copiado

copy /Y "hostinger\frontend\src\hooks\useUserSector.ts" "src\hooks\useUserSector.ts" >nul
if errorlevel 1 (echo ERRO ao copiar useUserSector.ts & pause & exit /b 1)
echo   useUserSector.ts copiado

copy /Y "hostinger\frontend\src\hooks\useAdminActions.ts" "src\hooks\useAdminActions.ts" >nul
if errorlevel 1 (echo ERRO ao copiar useAdminActions.ts & pause & exit /b 1)
echo   useAdminActions.ts copiado

copy /Y "hostinger\frontend\src\hooks\use-toast.ts" "src\hooks\use-toast.ts" >nul
if errorlevel 1 (echo ERRO ao copiar use-toast.ts & pause & exit /b 1)
echo   use-toast.ts copiado

copy /Y "hostinger\frontend\src\pages\Auth.tsx" "src\pages\Auth.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Auth.tsx & pause & exit /b 1)
echo   Auth.tsx copiado

copy /Y "hostinger\frontend\src\pages\Index.tsx" "src\pages\Index.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Index.tsx & pause & exit /b 1)
echo   Index.tsx copiado

echo.
echo Todos os arquivos copiados com sucesso!
echo.

echo [4/5] Gerando build de producao...
echo (Isso pode demorar alguns minutos)
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo ERRO ao gerar o build!
    echo Verifique os erros acima.
    echo.
    pause
    exit /b 1
)
echo Build gerado com sucesso na pasta dist\
echo.

echo [5/5] Preparando pacote final para Hostinger...
echo.

if not exist "hostinger\dist" mkdir "hostinger\dist"

echo Copiando arquivos do frontend...
xcopy /E /Y /I "dist\*" "hostinger\dist\" >nul
if errorlevel 1 (
    echo ERRO ao copiar arquivos para hostinger\dist
    pause
    exit /b 1
)

if exist "hostinger\frontend\.htaccess" (
    copy /Y "hostinger\frontend\.htaccess" "hostinger\dist\.htaccess" >nul
    echo .htaccess copiado
)

echo.
echo ============================================
echo BUILD CONCLUIDO COM SUCESSO!
echo ============================================
echo.
echo Agora faca o upload na Hostinger:
echo.
echo 1. Conteudo de hostinger\dist\
echo    para public_html\
echo.
echo 2. Conteudo de hostinger\backend\
echo    para public_html\api\
echo.
echo 3. Configure o banco de dados em:
echo    public_html\api\config\database.php
echo.
echo 4. Importe o arquivo database_completo.sql
echo    no phpMyAdmin da Hostinger
echo.
echo ============================================
echo.
pause
