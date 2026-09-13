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

### 2. `list_transactions`
- **Descripción:** Consulta el historial de movimientos o transacciones financieras del usuario, permitiendo filtrar por tipo, cuenta y rango de fechas.
- **Argumentos opcionales:**
  - `accountId` (string, UUID): Filtrar movimientos de una cuenta específica.
  - `type` (enum): Tipo de movimiento (`"EXPENSE"`, `"INCOME"`, `"TRANSFER"`).
  - `startDate` (string, ISO o YYYY-MM-DD): Fecha inicial del rango.
  - `endDate` (string, ISO o YYYY-MM-DD): Fecha final del rango.
  - `limit` (number, 1-100): Cantidad máxima de registros (por defecto 20).
  - `offset` (number): Desplazamiento para paginación.
- **Respuesta:** Objeto JSON con `total`, `returnedCount` y el listado de transacciones formateadas (`id`, `type`, `amount`, `currency`, `date`, `account`, `category`, `destinationAccount`, `description`).

### 3. `create_expense`
- **Descripción:** Registra un nuevo gasto financiero deduciendo el saldo de la cuenta especificada. Admite resolución inteligente por UUID o por nombre tanto para cuentas como para categorías.
- **Argumentos obligatorios:**
  - `account` (string): Nombre o UUID de la cuenta financiera donde se debita el gasto (ej. `"Efectivo"`, `"Nómina"` o UUID).
  - `amount` (number): Monto numérico del gasto (mayor a 0).
- **Argumentos opcionales:**
  - `category` (string): Nombre o UUID de la categoría del gasto (ej. `"Comida"`, `"Transporte"` o UUID).
  - `description` (string): Concepto, nota o detalle descriptivo del gasto.
  - `date` (string, ISO o YYYY-MM-DD): Fecha de la transacción (por defecto fecha actual).
- **Respuesta:** Objeto JSON de confirmación con `success: true`, mensaje resumen, y los datos completos del movimiento registrado incluyendo saldos (`previousBalance`, `newBalance`).

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