---
name: create-mcp-tool
description: >-
  Guía paso a paso para inspeccionar endpoints en finance-manager-api (NestJS) y
  crear o registrar nuevas herramientas (tools) en finance-manager-mcp con esquemas
  Zod, cliente HTTP y validación de tipos.
---

# Procedimiento: Crear y Registrar Tools MCP desde la API

Esta habilidad describe el flujo oficial para inspeccionar los controladores de la API (`wallet api`) y exponer herramientas estandarizadas en el servidor MCP (`wallet server mcp`).

---

## 1. Inspección de la API (`wallet api`)
Ubica el módulo correspondiente en `wallet api/src/modules/<dominio>/`:
1. `<dominio>.controller.ts`: Identifica el verbo HTTP (`GET`, `POST`, `PATCH`, `DELETE`), la ruta del endpoint y los decoradores de autenticación.
2. `dto/`: Revisa los campos obligatorios y opcionales, tipos y validadores de `class-validator`.
3. `entities/`: Revisa el modelo devuelto para definir los tipos de respuesta esperados.

---

## 2. Flujo de Implementación en MCP (`wallet server mcp`)

### Paso 1: Tipos e Interfaces (`src/types/`)
Define o actualiza el archivo `src/types/<dominio>.interface.ts` con propiedades de solo lectura (`readonly`):
```typescript
export interface CreateItemPayload {
  readonly name: string;
  readonly amount: number;
}
```

### Paso 2: Método en el Cliente HTTP (`src/services/api-client.service.ts`)
Añade el método correspondiente en `ApiClientService`:
```typescript
async createItem(payload: CreateItemPayload): Promise<ItemResponse> {
  const response = await this.client.post<ItemResponse>('/items', payload);
  return response.data;
}
```

### Paso 3: Crear la Tool (`src/tools/<accion-entidad>.tool.ts`)
1. Define el esquema de entrada con **Zod** y agrega descripciones claras en **español**:
   ```typescript
   const createItemSchema = {
     name: z.string().min(1).describe("Nombre del elemento a registrar."),
     amount: z.number().positive().describe("Monto asociado al elemento."),
   };
   ```
2. Si la herramienta recibe identificadores de entidades (como cuentas o categorías), usa las utilidades de resolución flexible en `src/utils/entity-resolver.util.ts` para aceptar tanto nombres como UUIDs.
3. Exporta la función de registro:
   ```typescript
   export function registerCreateItemTool(
     server: McpServer,
     apiClient: ApiClientService
   ): void {
     server.registerTool(
       "create_item",
       { description: "Crea un nuevo elemento en el sistema financiero." },
       createItemSchema,
       async (args) => {
         try {
           const result = await apiClient.createItem(args);
           return {
             content: [
               { type: "text", text: JSON.stringify(result, null, 2) },
             ],
           };
         } catch (error: unknown) {
           const message = error instanceof Error ? error.message : "Error desconocido";
           return {
             isError: true,
             content: [{ type: "text", text: `Error al crear elemento: ${message}` }],
           };
         }
       }
     );
   }
   ```

### Paso 4: Registrar en el Factory (`src/factory/mcp-server.factory.ts`)
Importa y ejecuta la función de registro dentro de `createMcpServer`:
```typescript
registerCreateItemTool(server, apiClient);
```

---

## 3. Verificación
1. Ejecuta la verificación de tipos en la terminal de `wallet server mcp`:
   ```bash
   npm run build
   ```
2. Asegura que no haya errores de compilación antes de dar por terminada la tarea.
