import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClientService } from "../services/api-client.service.js";
import { resolveEditableCategory } from "../utils/editable-category.util.js";

const deleteCategoryInputSchema = {
  category: z
    .string()
    .min(1)
    .describe("Nombre o UUID de la categoría propia a eliminar."),
};

/**
 * Registra la herramienta `delete_category` en el servidor MCP.
 */
export function registerDeleteCategoryTool(
  server: McpServer,
  apiClient: ApiClientService
): void {
  server.registerTool(
    "delete_category",
    {
      description:
        "Elimina (desactiva) una categoría propia por nombre o UUID. Las categorías globales no pueden eliminarse. Una categoría eliminada no puede reactivarse; habría que crearla de nuevo.",
      inputSchema: deleteCategoryInputSchema,
    },
    async ({ category: identifier }) => {
      try {
        const categories = await apiClient.fetchCategories();
        const target = resolveEditableCategory(categories, identifier);
        await apiClient.deleteCategory(target.id);

        const result = {
          success: true,
          message: `Categoría '${target.name}' eliminada exitosamente.`,
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
              text: `Error al eliminar la categoría: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}
