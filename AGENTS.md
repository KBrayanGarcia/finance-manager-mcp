# AGENTS.md

## 1. Resumen del Proyecto
Servidor de Protocolo de Contexto de Modelo (**Model Context Protocol - MCP**) para la suite Finance Manager. Expone herramientas (*tools*) que permiten a agentes de IA interactuar con la API REST de finanzas mediante transportes duales: Stdio (para uso local en IDEs) y SSE / Express (para uso en red o despliegue).

### Arquitectura y Módulos (`src/`):
- `tools/`: Definición de herramientas MCP con validación de esquemas Zod y controladores de ejecución.
- `services/`: Clientes HTTP y llamadas directas hacia `finance-manager-api`.
- `factory/`: Construcción y registro del servidor MCP con sus herramientas disponibles.
- `types/`: Tipos TypeScript y contratos de respuestas MCP.
- `config/`: Variables de entorno y configuración de conexión.
- `index.ts`: Punto de entrada para el transporte Stdio.
- `server.ts`: Punto de entrada para el transporte HTTP/SSE con Express.

---

## 2. Comandos de Compilación y Desarrollo

```bash
# Desarrollo con transporte Stdio (CLI / IDEs)
npm run dev:stdio

# Desarrollo con servidor HTTP / SSE
npm run dev

# Compilar proyecto TypeScript a dist/
npm run build

# Inspeccionar herramientas con MCP Inspector (Stdio)
npm run inspector

# Probar clientes
npm run test:stdio
npm run test:sse
```

---

## 3. Directrices de Estilo de Código

- **Idioma:**
  - Código, nombres de variables y funciones siempre en **inglés**.
  - Descripciones de tools y esquemas de parámetros suficientemente claros y descriptivos en **español** o inglés técnico para que el LLM entienda su propósito.
- **Definición de Tools:**
  - Toda herramienta debe definir su entrada mediante esquemas estrictos de **Zod**.
  - Las respuestas de las tools deben seguir el formato oficial MCP (`{ content: [{ type: 'text', text: ... }] }`).
- **Manejo de Errores:**
  - Capturar errores de red hacia la API y devolverlos con `isError: true` en el resultado del tool en lugar de tumbar el proceso del servidor.

---

## 4. Instrucciones de Prueba y Verificación

- **Compilación estricta:** Ejecutar `npm run build` (`tsc`) para asegurar cero errores de tipos en los esquemas y llamadas.
- **Inspección de Tools:** Usar `npm run inspector` para verificar manualmente que las tools se listen correctamente y respondan a llamadas simuladas.

---

## 5. Consideraciones de Seguridad

- **Validación de Argumentos:** Todo parámetro que reciba una tool debe ser validado y tipado con Zod antes de enviarse a la API.
- **Tokens y Secretos:** Las llaves de API o tokens hacia `finance-manager-api` deben inyectarse mediante variables de entorno (`dotenv`), nunca quemarse en el código fuente.
- **Sanitización de Salidas:** Asegurar que las respuestas de las tools no expongan secretos ni trazas internas sensibles en el texto devuelto al modelo.
