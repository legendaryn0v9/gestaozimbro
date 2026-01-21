@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          BUILD SISTEMA ZIMBRO PARA HOSTINGER                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0.."
echo Diretorio: %CD%
echo.

echo [1/5] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║  ERRO: Node.js nao encontrado!                                ║
    echo ║                                                               ║
    echo ║  1. Acesse https://nodejs.org                                 ║
    echo ║  2. Baixe e instale a versao LTS                              ║
    echo ║  3. Reinicie o computador                                     ║
    echo ║  4. Execute este script novamente                             ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)
echo Node.js encontrado!
echo.

echo [2/5] Instalando dependencias (aguarde, pode demorar)...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERRO ao instalar dependencias!
    pause
    exit /b 1
)
echo Dependencias instaladas!
echo.

echo [3/5] Substituindo arquivos para versao Hostinger...
copy /Y "hostinger\frontend\src\lib\api.ts" "src\lib\api.ts" >nul 2>&1 && echo - api.ts copiado
copy /Y "hostinger\frontend\src\lib\auth.tsx" "src\lib\auth.tsx" >nul 2>&1 && echo - auth.tsx copiado
copy /Y "hostinger\frontend\src\hooks\useInventory.ts" "src\hooks\useInventory.ts" >nul 2>&1 && echo - useInventory.ts copiado
copy /Y "hostinger\frontend\src\hooks\useCategories.ts" "src\hooks\useCategories.ts" >nul 2>&1 && echo - useCategories.ts copiado
copy /Y "hostinger\frontend\src\hooks\useUserProfile.ts" "src\hooks\useUserProfile.ts" >nul 2>&1 && echo - useUserProfile.ts copiado
copy /Y "hostinger\frontend\src\hooks\useUserRoles.ts" "src\hooks\useUserRoles.ts" >nul 2>&1 && echo - useUserRoles.ts copiado
copy /Y "hostinger\frontend\src\hooks\useUserSector.ts" "src\hooks\useUserSector.ts" >nul 2>&1 && echo - useUserSector.ts copiado
copy /Y "hostinger\frontend\src\pages\Auth.tsx" "src\pages\Auth.tsx" >nul 2>&1 && echo - Auth.tsx copiado
copy /Y "hostinger\frontend\src\pages\Index.tsx" "src\pages\Index.tsx" >nul 2>&1 && echo - Index.tsx copiado
echo Arquivos substituidos!
echo.

echo [4/5] Gerando build de producao (aguarde)...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERRO ao gerar build!
    pause
    exit /b 1
)
echo Build gerado!
echo.

echo [5/5] Copiando arquivos para pasta hostinger/dist...
if not exist "hostinger\dist" mkdir "hostinger\dist"
xcopy /E /Y /I "dist\*" "hostinger\dist\" >nul
if exist "hostinger\frontend\.htaccess" (
    copy /Y "hostinger\frontend\.htaccess" "hostinger\dist\.htaccess" >nul
)
echo Arquivos copiados para hostinger/dist!
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    BUILD CONCLUIDO!                          ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  Agora faca upload para a Hostinger:                        ║
echo ║                                                              ║
echo ║  1. Conteudo de 'hostinger/dist/'    → public_html/         ║
echo ║  2. Conteudo de 'hostinger/backend/' → public_html/api/     ║
echo ║                                                              ║
echo ║  Configure o banco em:                                       ║
echo ║  public_html/api/config/database.php                        ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
