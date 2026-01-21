@echo off
setlocal enableextensions

REM NOTE: keep this file ASCII-only to avoid Windows cmd encoding issues.

echo.
echo ================================================
echo   BUILD SISTEMA ZIMBRO PARA HOSTINGER (Windows)
echo ================================================
echo.

cd /d "%~dp0.." || (
  echo ERRO: nao foi possivel acessar a pasta do projeto.
  pause
  exit /b 1
)
echo Diretorio: %CD%
echo.

echo [1/5] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRO: Node.js nao encontrado.
  echo 1) Acesse https://nodejs.org
  echo 2) Instale a versao LTS
  echo 3) Feche e abra o terminal novamente
  echo 4) Execute este script novamente
  echo.
  pause
  exit /b 1
)
echo OK: Node.js encontrado.
echo.

echo [2/5] Instalando dependencias (pode demorar)...
call npm install
if errorlevel 1 (
  echo ERRO ao instalar dependencias!
  pause
  exit /b 1
)
echo OK: Dependencias instaladas.
echo.

echo [3/5] Substituindo arquivos para versao Hostinger...

if not exist "hostinger\frontend\src\lib\api.ts" (
  echo ERRO: arquivo nao encontrado: hostinger\frontend\src\lib\api.ts
  pause
  exit /b 1
)

copy /Y "hostinger\frontend\src\lib\api.ts" "src\lib\api.ts" >nul || (echo ERRO ao copiar api.ts & pause & exit /b 1)
echo - api.ts copiado
copy /Y "hostinger\frontend\src\lib\auth.tsx" "src\lib\auth.tsx" >nul || (echo ERRO ao copiar auth.tsx & pause & exit /b 1)
echo - auth.tsx copiado
copy /Y "hostinger\frontend\src\hooks\useInventory.ts" "src\hooks\useInventory.ts" >nul || (echo ERRO ao copiar useInventory.ts & pause & exit /b 1)
echo - useInventory.ts copiado
copy /Y "hostinger\frontend\src\hooks\useCategories.ts" "src\hooks\useCategories.ts" >nul || (echo ERRO ao copiar useCategories.ts & pause & exit /b 1)
echo - useCategories.ts copiado
copy /Y "hostinger\frontend\src\hooks\useUserProfile.ts" "src\hooks\useUserProfile.ts" >nul || (echo ERRO ao copiar useUserProfile.ts & pause & exit /b 1)
echo - useUserProfile.ts copiado
copy /Y "hostinger\frontend\src\hooks\useUserRoles.ts" "src\hooks\useUserRoles.ts" >nul || (echo ERRO ao copiar useUserRoles.ts & pause & exit /b 1)
echo - useUserRoles.ts copiado
copy /Y "hostinger\frontend\src\hooks\useUserSector.ts" "src\hooks\useUserSector.ts" >nul || (echo ERRO ao copiar useUserSector.ts & pause & exit /b 1)
echo - useUserSector.ts copiado
copy /Y "hostinger\frontend\src\pages\Auth.tsx" "src\pages\Auth.tsx" >nul || (echo ERRO ao copiar Auth.tsx & pause & exit /b 1)
echo - Auth.tsx copiado
copy /Y "hostinger\frontend\src\pages\Index.tsx" "src\pages\Index.tsx" >nul || (echo ERRO ao copiar Index.tsx & pause & exit /b 1)
echo - Index.tsx copiado

echo OK: Arquivos substituidos.
echo.

echo [4/5] Gerando build de producao...
call npm run build
if errorlevel 1 (
  echo ERRO ao gerar build!
  pause
  exit /b 1
)
echo OK: Build gerado.
echo.

echo [5/5] Copiando build para hostinger\dist...
if not exist "hostinger\dist" mkdir "hostinger\dist" >nul 2>&1
xcopy /E /Y /I "dist\*" "hostinger\dist\" >nul
if errorlevel 1 (
  echo ERRO ao copiar dist para hostinger\dist.
  pause
  exit /b 1
)

if exist "hostinger\frontend\.htaccess" (
  copy /Y "hostinger\frontend\.htaccess" "hostinger\dist\.htaccess" >nul
)

echo.
echo ================================================
echo BUILD CONCLUIDO!
echo - Suba hostinger\dist\      para public_html\
echo - Suba hostinger\backend\   para public_html\api\
echo - Configure o banco em public_html\api\config\database.php
echo ================================================
echo.
pause
