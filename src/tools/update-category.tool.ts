import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClientService } from "../services/api-client.service.js";
import type { UpdateCategoryPayload } from "../types/category.interface.js";
import { resolveEditableCategory } from "../utils/editable-category.util.js";

const updateCategoryInputSchema = {
  category: z
    .string()
    .min(1)
    .describe("Nombre o UUID de la categoría propia a editar (ej. 'Mascotas')."),
  name: z.string().trim().min(1).max(100).optional().describe("Nuevo nombre."),
  type: z
    .enum(["EXPENSE", "INCOME"])
    .optional()
    .describe("Nuevo tipo: 'EXPENSE' o 'INCOME'."),
  icon: z.string().max(50).optional().describe("Nuevo ícono."),
  color: z.string().max(20).optional().describe("Nuevo color, ej. '#FF5733'."),
};

/**
 * Registra la herramienta `update_category` en el servidor MCP.
 */
export function registerUpdateCategoryTool(
  server: McpServer,
  apiClient: ApiClientService
): void {
  server.registerTool(
    "update_category",
    {
      description:
        "Edita el nombre, tipo, ícono o color de una categoría propia (por nombre o UUID). Las categorías globales no pueden modificarse.",
      inputSchema: updateCategoryInputSchema,
    },
    async ({ category: identifier, ...changes }) => {
      try {
        const payload: UpdateCategoryPayload = changes;
        const hasChanges = Object.values(payload).some(
          (value) => value !== undefined
        );
        if (!hasChanges) {
          throw new Error(
            "Debes indicar al menos un campo a modificar (name, type, icon o color)."
          );
        }

        const categories = await apiClient.fetchCategories();
        const target = resolveEditableCategory(categories, identifier);
        const updated = await apiClient.updateCategory(target.id, payload);

        const result = {
          success: true,
          message: `Categoría '${target.name}' actualizada exitosamente.`,
          category: {
            id: updated.id,
            name: updated.name,
            type: updated.type,
            icon: updated.icon ?? null,
            color: updated.color ?? null,
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
              text: `Error al actualizar la categoría: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}
