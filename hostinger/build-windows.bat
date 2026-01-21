@echo off
echo ========================================
echo   Build Sistema Zimbro para Hostinger
echo ========================================
echo.

echo [1/4] Copiando arquivos adaptados para Hostinger...
copy /Y "hostinger\frontend\src\lib\api.ts" "src\lib\api.ts"
copy /Y "hostinger\frontend\src\lib\auth.tsx" "src\lib\auth.tsx"
copy /Y "hostinger\frontend\src\hooks\useInventory.ts" "src\hooks\useInventory.ts"
copy /Y "hostinger\frontend\src\hooks\useCategories.ts" "src\hooks\useCategories.ts"
copy /Y "hostinger\frontend\src\hooks\useUserProfile.ts" "src\hooks\useUserProfile.ts"
copy /Y "hostinger\frontend\src\hooks\useUserRoles.ts" "src\hooks\useUserRoles.ts"
copy /Y "hostinger\frontend\src\hooks\useUserSector.ts" "src\hooks\useUserSector.ts"
echo Arquivos copiados!
echo.

echo [2/4] Instalando dependencias (aguarde)...
call npm install
echo Dependencias instaladas!
echo.

echo [3/4] Gerando build de producao (aguarde)...
call npm run build
echo Build gerado!
echo.

echo [4/4] Copiando .htaccess para pasta dist...
copy /Y "hostinger\frontend\.htaccess" "dist\.htaccess"
echo.

echo ========================================
echo   BUILD CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Agora faca upload para a Hostinger:
echo 1. Conteudo da pasta 'dist/' para 'public_html/'
echo 2. Conteudo de 'hostinger/backend/' para 'public_html/api/'
echo.
echo Nao esqueca de configurar o banco em:
echo public_html/api/config/database.php
echo.
pause
