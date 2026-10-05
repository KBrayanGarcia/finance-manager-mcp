import type { Category } from "../types/category.interface.js";
import { findCategoryByNameOrId } from "./entity-resolver.util.js";

/**
 * Resuelve una categoría propia (no global) por nombre o UUID.
 * Lanza un error en español si no existe o si es una categoría global.
 */
export function resolveEditableCategory(
  categories: readonly Category[],
  identifier: string
): Category {
  const category = findCategoryByNameOrId(categories, identifier);
  if (!category) {
    const available = categories
      .filter((item) => item.userId)
      .map((item) => `'${item.name}'`)
      .join(", ");
    throw new Error(
      `No se encontró la categoría '${identifier}'. Categorías propias disponibles: ${available || "Ninguna"}`
    );
  }

  if (!category.userId) {
    throw new Error(
      `La categoría '${category.name}' es global y no puede modificarse ni eliminarse.`
    );
  }

  return category;
}
