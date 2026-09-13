# 🤖 Finance Manager - Servidor MCP

Servidor basado en el estándar **Model Context Protocol (MCP)** para permitir que asistentes de Inteligencia Artificial (Antigravity, Claude Desktop, Cursor, etc.) interactúen con la plataforma **Finance Manager Suite**.

---

## 📋 Requisitos Previos

- Node.js 18+ (recomendado v22+)
- Backend de Finance Manager (`finance-manager-api`) en ejecución.
- Un Personal Access Token (`API_TOKEN`) generado desde la interfaz web o mediante la API.

---

## ⚙️ Configuración

1. Crea el archivo `.env` en la raíz de este proyecto (o copia `.env.example`):
```env
API_BASE_URL=http://localhost:3000/api/v1
# Personal Access Token generado en el perfil de usuario (fm_live_...)
API_TOKEN=fm_live_tu_clave_aqui
```

2. Instala dependencias y compila el proyecto:
```bash
npm install
npm run build
```

---

## 🧰 Herramientas (Tools) Disponibles

### 1. `get_account_balances`
- **Descripción:** Consulta la lista de cuentas financieras activas, sus saldos actuales y el total consolidado.
- **Argumentos:** Ninguno.
- **Respuesta:** Objeto JSON con `totalBalance`, `totalAccounts` y el detalle de cada cuenta (`id`, `name`, `type`, `currency`, `currentBalance`, `isActive`).

---

## 🔌 Cómo conectarlo con Clientes MCP

### Antigravity, Cursor o Claude Desktop
En el archivo de configuración `claude_desktop_config.json` o configuración de MCP:

```json
{
  "mcpServers": {
    "finance-manager": {
      "command": "node",
      "args": [
        "/ruta/absoluta/a/wallet server mcp/dist/index.js"
      ],
      "env": {
        "API_BASE_URL": "http://localhost:3000/api/v1",
        "API_TOKEN": "fm_live_tu_clave_aqui"
      }
    }
  }
}
```

---

## 🧪 Pruebas Locales

- **Con MCP Inspector:**
```bash
npm run inspector
```
- **Smoke test programático:**
```bash
npm test
```