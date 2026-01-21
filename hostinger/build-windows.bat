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

echo Copiando biblioteca de API...
copy /Y "hostinger\frontend\src\lib\api.ts" "src\lib\api.ts" >nul
if errorlevel 1 (echo ERRO ao copiar api.ts & pause & exit /b 1)
echo   api.ts copiado

copy /Y "hostinger\frontend\src\lib\auth.tsx" "src\lib\auth.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar auth.tsx & pause & exit /b 1)
echo   auth.tsx copiado

echo Copiando hooks adaptados...
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

copy /Y "hostinger\frontend\src\hooks\useRealtimeInventory.ts" "src\hooks\useRealtimeInventory.ts" >nul
if errorlevel 1 (echo ERRO ao copiar useRealtimeInventory.ts & pause & exit /b 1)
echo   useRealtimeInventory.ts copiado

copy /Y "hostinger\frontend\src\hooks\useBranding.ts" "src\hooks\useBranding.ts" >nul
if errorlevel 1 (echo ERRO ao copiar useBranding.ts & pause & exit /b 1)
echo   useBranding.ts copiado

echo Copiando paginas adaptadas...
copy /Y "hostinger\frontend\src\pages\Auth.tsx" "src\pages\Auth.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Auth.tsx & pause & exit /b 1)
echo   Auth.tsx copiado

copy /Y "hostinger\frontend\src\pages\Index.tsx" "src\pages\Index.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Index.tsx & pause & exit /b 1)
echo   Index.tsx copiado

copy /Y "hostinger\frontend\src\pages\Dashboard.tsx" "src\pages\Dashboard.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Dashboard.tsx & pause & exit /b 1)
echo   Dashboard.tsx copiado

copy /Y "hostinger\frontend\src\pages\Bar.tsx" "src\pages\Bar.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Bar.tsx & pause & exit /b 1)
echo   Bar.tsx copiado

copy /Y "hostinger\frontend\src\pages\Cozinha.tsx" "src\pages\Cozinha.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Cozinha.tsx & pause & exit /b 1)
echo   Cozinha.tsx copiado

copy /Y "hostinger\frontend\src\pages\Entrada.tsx" "src\pages\Entrada.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Entrada.tsx & pause & exit /b 1)
echo   Entrada.tsx copiado

copy /Y "hostinger\frontend\src\pages\Saida.tsx" "src\pages\Saida.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Saida.tsx & pause & exit /b 1)
echo   Saida.tsx copiado

copy /Y "hostinger\frontend\src\pages\Relatorios.tsx" "src\pages\Relatorios.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Relatorios.tsx & pause & exit /b 1)
echo   Relatorios.tsx copiado

copy /Y "hostinger\frontend\src\pages\Usuarios.tsx" "src\pages\Usuarios.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Usuarios.tsx & pause & exit /b 1)
echo   Usuarios.tsx copiado

copy /Y "hostinger\frontend\src\pages\Personalizacao.tsx" "src\pages\Personalizacao.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Personalizacao.tsx & pause & exit /b 1)
echo   Personalizacao.tsx copiado

copy /Y "hostinger\frontend\src\pages\AdminFormat.tsx" "src\pages\AdminFormat.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar AdminFormat.tsx & pause & exit /b 1)
echo   AdminFormat.tsx copiado

copy /Y "hostinger\frontend\src\pages\NotFound.tsx" "src\pages\NotFound.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar NotFound.tsx & pause & exit /b 1)
echo   NotFound.tsx copiado

echo Copiando componentes de layout...
copy /Y "hostinger\frontend\src\components\layout\MainLayout.tsx" "src\components\layout\MainLayout.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar MainLayout.tsx & pause & exit /b 1)
echo   MainLayout.tsx copiado

copy /Y "hostinger\frontend\src\components\layout\Sidebar.tsx" "src\components\layout\Sidebar.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar Sidebar.tsx & pause & exit /b 1)
echo   Sidebar.tsx copiado

copy /Y "hostinger\frontend\src\components\layout\MobileHeader.tsx" "src\components\layout\MobileHeader.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar MobileHeader.tsx & pause & exit /b 1)
echo   MobileHeader.tsx copiado

echo Copiando componentes de inventario...
copy /Y "hostinger\frontend\src\components\inventory\ItemCard.tsx" "src\components\inventory\ItemCard.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar ItemCard.tsx & pause & exit /b 1)
echo   ItemCard.tsx copiado

copy /Y "hostinger\frontend\src\components\inventory\AddItemDialog.tsx" "src\components\inventory\AddItemDialog.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar AddItemDialog.tsx & pause & exit /b 1)
echo   AddItemDialog.tsx copiado

copy /Y "hostinger\frontend\src\components\inventory\EditItemDialog.tsx" "src\components\inventory\EditItemDialog.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar EditItemDialog.tsx & pause & exit /b 1)
echo   EditItemDialog.tsx copiado

copy /Y "hostinger\frontend\src\components\inventory\MovementDialog.tsx" "src\components\inventory\MovementDialog.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar MovementDialog.tsx & pause & exit /b 1)
echo   MovementDialog.tsx copiado

copy /Y "hostinger\frontend\src\components\inventory\CategoryManagerDialog.tsx" "src\components\inventory\CategoryManagerDialog.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar CategoryManagerDialog.tsx & pause & exit /b 1)
echo   CategoryManagerDialog.tsx copiado

copy /Y "hostinger\frontend\src\components\inventory\MovementList.tsx" "src\components\inventory\MovementList.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar MovementList.tsx & pause & exit /b 1)
echo   MovementList.tsx copiado

copy /Y "hostinger\frontend\src\components\inventory\ReportMovementList.tsx" "src\components\inventory\ReportMovementList.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar ReportMovementList.tsx & pause & exit /b 1)
echo   ReportMovementList.tsx copiado

copy /Y "hostinger\frontend\src\components\inventory\StatsCard.tsx" "src\components\inventory\StatsCard.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar StatsCard.tsx & pause & exit /b 1)
echo   StatsCard.tsx copiado

copy /Y "hostinger\frontend\src\App.tsx" "src\App.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar App.tsx & pause & exit /b 1)
echo   App.tsx copiado

echo Copiando componentes de usuarios...
if not exist "src\components\users" mkdir "src\components\users" >nul
copy /Y "hostinger\frontend\src\components\users\EditAvatarDialog.tsx" "src\components\users\EditAvatarDialog.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar EditAvatarDialog.tsx & pause & exit /b 1)
echo   EditAvatarDialog.tsx copiado

copy /Y "hostinger\frontend\src\components\users\BrandingManager.tsx" "src\components\users\BrandingManager.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar BrandingManager.tsx & pause & exit /b 1)
echo   BrandingManager.tsx copiado

copy /Y "hostinger\frontend\src\components\users\EditUserDialog.tsx" "src\components\users\EditUserDialog.tsx" >nul
if errorlevel 1 (echo ERRO ao copiar EditUserDialog.tsx & pause & exit /b 1)
echo   EditUserDialog.tsx copiado

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
