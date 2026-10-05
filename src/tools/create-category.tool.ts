import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClientService } from "../services/api-client.service.js";

const createCategoryInputSchema = {
  name: z
    .string()
    .trim()
    .min(1, "El nombre no puede estar vacío.")
    .max(100)
    .describe("Nombre de la nueva categoría (ej. 'Mascotas')."),
  type: z
    .enum(["EXPENSE", "INCOME"])
    .describe("Tipo de categoría: 'EXPENSE' (gastos) o 'INCOME' (ingresos)."),
  icon: z
    .string()
    .max(50)
    .optional()
    .describe("Nombre o identificador del ícono (ej. 'paw'). Opcional."),
  color: z
    .string()
    .max(20)
    .optional()
    .describe("Color de la categoría, ej. '#FF5733'. Opcional."),
};

/**
 * Registra la herramienta `create_category` en el servidor MCP.
 */
export function registerCreateCategoryTool(
  server: McpServer,
  apiClient: ApiClientService
): void {
  server.registerTool(
    "create_category",
    {
      description:
        "Crea una nueva categoría personal de gastos o ingresos con nombre, tipo y, opcionalmente, ícono y color.",
      inputSchema: createCategoryInputSchema,
    },
    async (args) => {
      try {
        const category = await apiClient.createCategory(args);
        const result = {
          success: true,
          message: `Categoría '${category.name}' creada exitosamente.`,
          category: {
            id: category.id,
            name: category.name,
            type: category.type,
            icon: category.icon ?? null,
            color: category.color ?? null,
          },
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";

        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error al crear la categoría: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}
