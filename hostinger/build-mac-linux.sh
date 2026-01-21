#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          BUILD SISTEMA ZIMBRO PARA HOSTINGER                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."
echo "Diretório: $(pwd)"
echo ""

echo "[1/5] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║  ERRO: Node.js não encontrado!                                ║"
    echo "║                                                               ║"
    echo "║  1. Acesse https://nodejs.org                                 ║"
    echo "║  2. Baixe e instale a versão LTS                              ║"
    echo "║  3. Execute este script novamente                             ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    exit 1
fi
echo "Node.js encontrado!"
echo ""

echo "[2/5] Instalando dependências (aguarde, pode demorar)..."
npm install
if [ $? -ne 0 ]; then
    echo "ERRO ao instalar dependências!"
    exit 1
fi
echo "Dependências instaladas!"
echo ""

echo "[3/5] Substituindo arquivos para versão Hostinger..."
cp -f "hostinger/frontend/src/lib/api.ts" "src/lib/api.ts" 2>/dev/null && echo "- api.ts copiado"
cp -f "hostinger/frontend/src/lib/auth.tsx" "src/lib/auth.tsx" 2>/dev/null && echo "- auth.tsx copiado"
cp -f "hostinger/frontend/src/hooks/useInventory.ts" "src/hooks/useInventory.ts" 2>/dev/null && echo "- useInventory.ts copiado"
cp -f "hostinger/frontend/src/hooks/useCategories.ts" "src/hooks/useCategories.ts" 2>/dev/null && echo "- useCategories.ts copiado"
cp -f "hostinger/frontend/src/hooks/useUserProfile.ts" "src/hooks/useUserProfile.ts" 2>/dev/null && echo "- useUserProfile.ts copiado"
cp -f "hostinger/frontend/src/hooks/useUserRoles.ts" "src/hooks/useUserRoles.ts" 2>/dev/null && echo "- useUserRoles.ts copiado"
cp -f "hostinger/frontend/src/hooks/useUserSector.ts" "src/hooks/useUserSector.ts" 2>/dev/null && echo "- useUserSector.ts copiado"
cp -f "hostinger/frontend/src/hooks/useAdminActions.ts" "src/hooks/useAdminActions.ts" 2>/dev/null && echo "- useAdminActions.ts copiado"
cp -f "hostinger/frontend/src/hooks/use-toast.ts" "src/hooks/use-toast.ts" 2>/dev/null && echo "- use-toast.ts copiado"
cp -f "hostinger/frontend/src/hooks/useRealtimeInventory.ts" "src/hooks/useRealtimeInventory.ts" 2>/dev/null && echo "- useRealtimeInventory.ts copiado"

echo "Copiando páginas..."
cp -f "hostinger/frontend/src/pages/Auth.tsx" "src/pages/Auth.tsx" 2>/dev/null && echo "- Auth.tsx copiado"
cp -f "hostinger/frontend/src/pages/Index.tsx" "src/pages/Index.tsx" 2>/dev/null && echo "- Index.tsx copiado"
cp -f "hostinger/frontend/src/pages/Dashboard.tsx" "src/pages/Dashboard.tsx" 2>/dev/null && echo "- Dashboard.tsx copiado"
cp -f "hostinger/frontend/src/pages/Bar.tsx" "src/pages/Bar.tsx" 2>/dev/null && echo "- Bar.tsx copiado"
cp -f "hostinger/frontend/src/pages/Cozinha.tsx" "src/pages/Cozinha.tsx" 2>/dev/null && echo "- Cozinha.tsx copiado"
cp -f "hostinger/frontend/src/pages/Entrada.tsx" "src/pages/Entrada.tsx" 2>/dev/null && echo "- Entrada.tsx copiado"
cp -f "hostinger/frontend/src/pages/Saida.tsx" "src/pages/Saida.tsx" 2>/dev/null && echo "- Saida.tsx copiado"
cp -f "hostinger/frontend/src/pages/Relatorios.tsx" "src/pages/Relatorios.tsx" 2>/dev/null && echo "- Relatorios.tsx copiado"
cp -f "hostinger/frontend/src/pages/Usuarios.tsx" "src/pages/Usuarios.tsx" 2>/dev/null && echo "- Usuarios.tsx copiado"
cp -f "hostinger/frontend/src/pages/AdminFormat.tsx" "src/pages/AdminFormat.tsx" 2>/dev/null && echo "- AdminFormat.tsx copiado"
cp -f "hostinger/frontend/src/pages/NotFound.tsx" "src/pages/NotFound.tsx" 2>/dev/null && echo "- NotFound.tsx copiado"

echo "Copiando componentes de layout..."
cp -f "hostinger/frontend/src/components/layout/MainLayout.tsx" "src/components/layout/MainLayout.tsx" 2>/dev/null && echo "- MainLayout.tsx copiado"
cp -f "hostinger/frontend/src/components/layout/Sidebar.tsx" "src/components/layout/Sidebar.tsx" 2>/dev/null && echo "- Sidebar.tsx copiado"
cp -f "hostinger/frontend/src/components/layout/MobileHeader.tsx" "src/components/layout/MobileHeader.tsx" 2>/dev/null && echo "- MobileHeader.tsx copiado"

echo "Copiando componentes de inventário..."
cp -f "hostinger/frontend/src/components/inventory/ItemCard.tsx" "src/components/inventory/ItemCard.tsx" 2>/dev/null && echo "- ItemCard.tsx copiado"
cp -f "hostinger/frontend/src/components/inventory/AddItemDialog.tsx" "src/components/inventory/AddItemDialog.tsx" 2>/dev/null && echo "- AddItemDialog.tsx copiado"
cp -f "hostinger/frontend/src/components/inventory/EditItemDialog.tsx" "src/components/inventory/EditItemDialog.tsx" 2>/dev/null && echo "- EditItemDialog.tsx copiado"
cp -f "hostinger/frontend/src/components/inventory/MovementDialog.tsx" "src/components/inventory/MovementDialog.tsx" 2>/dev/null && echo "- MovementDialog.tsx copiado"
cp -f "hostinger/frontend/src/components/inventory/CategoryManagerDialog.tsx" "src/components/inventory/CategoryManagerDialog.tsx" 2>/dev/null && echo "- CategoryManagerDialog.tsx copiado"
cp -f "hostinger/frontend/src/components/inventory/MovementList.tsx" "src/components/inventory/MovementList.tsx" 2>/dev/null && echo "- MovementList.tsx copiado"
cp -f "hostinger/frontend/src/components/inventory/ReportMovementList.tsx" "src/components/inventory/ReportMovementList.tsx" 2>/dev/null && echo "- ReportMovementList.tsx copiado"
cp -f "hostinger/frontend/src/components/inventory/StatsCard.tsx" "src/components/inventory/StatsCard.tsx" 2>/dev/null && echo "- StatsCard.tsx copiado"

cp -f "hostinger/frontend/src/App.tsx" "src/App.tsx" 2>/dev/null && echo "- App.tsx copiado"

echo "Arquivos substituídos!"
echo ""

echo "[4/5] Gerando build de produção (aguarde)..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERRO ao gerar build!"
    exit 1
fi
echo "Build gerado!"
echo ""

echo "[5/5] Copiando arquivos para pasta hostinger/dist..."
mkdir -p hostinger/dist
cp -r dist/* hostinger/dist/
[ -f "hostinger/frontend/.htaccess" ] && cp -f "hostinger/frontend/.htaccess" "hostinger/dist/.htaccess"
echo "Arquivos copiados para hostinger/dist!"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    BUILD CONCLUÍDO!                          ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  Agora faça upload para a Hostinger:                        ║"
echo "║                                                              ║"
echo "║  1. Conteúdo de 'hostinger/dist/'    → public_html/         ║"
echo "║  2. Conteúdo de 'hostinger/backend/' → public_html/api/     ║"
echo "║                                                              ║"
echo "║  Configure o banco em:                                       ║"
echo "║  public_html/api/config/database.php                        ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
