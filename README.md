# 🤖 Finance Manager - Servidor MCP

Servidor basado en el estándar **Model Context Protocol (MCP)** para permitir que asistentes de Inteligencia Artificial (Antigravity, Claude Desktop, Cursor, etc.) interactúen con la plataforma **Finance Manager Suite**.

Soporta dos modalidades de transporte:
1. **SSE / HTTP (Recomendado):** Servidor web Express con streaming Server-Sent Events y autenticación dual (Headers o Query Param).
2. **stdio (Entrada / Salida estándar):** Para ejecución local directa como subproceso.

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
PORT=3001
```

2. Instala dependencias y compila el proyecto:
```bash
npm install
npm run build
```

---

## 🚀 Modos de Ejecución

### 1. Servidor SSE / HTTP
Inicia el servidor Express en el puerto configurado (por defecto `3001`):
```bash
# Modo desarrollo (con recarga automática)
npm run dev

# Modo producción compilado
npm run start
```

Endpoints disponibles:
- `GET /health`: Estado y número de sesiones activas.
- `GET /sse?token=fm_live_...`: Handshake y canal de streaming de eventos.
- `POST /messages?sessionId=...`: Recepción de comandos JSON-RPC 2.0.

### 2. Modo stdio
```bash
npm run start:stdio
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

### 4. `create_income`
- **Descripción:** Registra un nuevo ingreso financiero abonando el saldo a la cuenta especificada. Admite resolución inteligente por UUID o por nombre tanto para cuentas como para categorías.
- **Argumentos obligatorios:**
  - `account` (string): Nombre o UUID de la cuenta financiera donde se abona el ingreso (ej. `"Efectivo"`, `"Tarjeta Débito"`, `"Nómina"` o UUID).
  - `amount` (number): Monto numérico del ingreso (mayor a 0).
- **Argumentos opcionales:**
  - `category` (string): Nombre o UUID de la categoría del ingreso (ej. `"Sueldo"`, `"Ventas"`, `"Inversiones"` o UUID).
  - `description` (string): Concepto, nota o detalle descriptivo del ingreso.
  - `date` (string, ISO o YYYY-MM-DD): Fecha de la transacción (por defecto fecha actual).

### 5. `transfer_funds`
- **Descripción:** Ejecuta una transferencia financiera atómica entre dos cuentas del usuario. Deduce los fondos de la cuenta origen y los acredita en la cuenta destino.
- **Argumentos obligatorios:**
  - `fromAccount` (string): Nombre o UUID de la cuenta financiera origen.
  - `toAccount` (string): Nombre o UUID de la cuenta financiera destino.
  - `amount` (number): Monto a transferir (mayor a 0).
- **Argumentos opcionales:**
  - `description` (string): Concepto descriptivo.
  - `date` (string, ISO o YYYY-MM-DD): Fecha de la transferencia.

---

## 🧪 Pruebas y Validación

### Validación con MCP Inspector (Navegador)
```bash
npm run inspector:sse
```
En el inspector, selecciona el transporte **SSE** e ingresa la URL:
`http://localhost:3001/sse?token=fm_live_tu_clave_aqui`

### Pruebas Automatizadas
- **Prueba SSE automatizada:**
```bash
npm run test:sse
```
- **Prueba stdio:**
```bash
npm run test:stdio
```