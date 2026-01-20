# Projeto Frontend - Sistema de Estoque Zimbro

Este é o frontend adaptado para funcionar com o backend PHP na Hostinger.

## Como gerar o build

1. **Instale o Node.js** (se ainda não tiver):
   - Acesse https://nodejs.org
   - Baixe e instale a versão LTS

2. **Clone ou copie os arquivos do projeto original do Lovable**

3. **Substitua os arquivos**:
   - Copie os arquivos desta pasta `src/` para o `src/` do projeto
   - Estes arquivos adaptam o frontend para usar a API PHP

4. **Instale as dependências**:
   ```bash
   npm install
   ```

5. **Gere o build de produção**:
   ```bash
   npm run build
   ```

6. **Os arquivos prontos estarão na pasta `dist/`**
   - Faça upload de todo o conteúdo de `dist/` para `public_html` na Hostinger

## Arquivos importantes alterados:

- `src/lib/api.ts` - Cliente de API para comunicação com PHP
- `src/lib/auth.tsx` - Contexto de autenticação adaptado
- `src/hooks/useInventory.ts` - Hooks de inventário adaptados
- `src/hooks/useUserRoles.ts` - Hooks de roles adaptados
- `src/hooks/useUserSector.ts` - Hook de setor adaptado
- `src/hooks/useUserProfile.ts` - Hook de perfil adaptado
- `src/hooks/useCategories.ts` - Hook de categorias adaptado

## Estrutura de pastas após upload:

```
public_html/
├── api/                 # Backend PHP
│   ├── config/
│   ├── auth/
│   ├── inventory/
│   ├── movements/
│   ├── users/
│   ├── categories/
│   ├── history/
│   └── admin/
├── assets/              # CSS e JS do frontend
├── index.html           # Página principal
└── .htaccess            # Configuração de rotas
```
