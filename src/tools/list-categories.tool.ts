import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClientService } from "../services/api-client.service.js";

const listCategoriesInputSchema = {
  type: z
    .enum(["EXPENSE", "INCOME"])
    .optional()
    .describe(
      "Filtra por tipo: 'EXPENSE' (gastos) o 'INCOME' (ingresos). Si se omite, devuelve todas."
    ),
};

/**
 * Registra la herramienta `list_categories` en el servidor MCP.
 */
export function registerListCategoriesTool(
  server: McpServer,
  apiClient: ApiClientService
): void {
  server.registerTool(
    "list_categories",
    {
      description:
        "Consulta las categorías activas disponibles (propias y globales), opcionalmente filtradas por tipo EXPENSE o INCOME. Las categorías globales (isGlobal=true) no pueden editarse ni eliminarse.",
      inputSchema: listCategoriesInputSchema,
    },
    async (args) => {
      try {
        const categories = await apiClient.fetchCategories(args.type);
        const result = {
          totalCategories: categories.length,
          categories: categories.map((category) => ({
            id: category.id,
            name: category.name,
            type: category.type,
            icon: category.icon ?? null,
            color: category.color ?? null,
            isGlobal: !category.userId,
          })),
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
              text: `Error al consultar las categorías: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}
