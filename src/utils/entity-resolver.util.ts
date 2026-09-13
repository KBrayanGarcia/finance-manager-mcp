import type { Account } from "../types/account.interface.js";
import type { Category } from "../types/category.interface.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Determina si una cadena tiene el formato de un UUID v4 estándar.
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/**
 * Busca una cuenta financiera en una lista por UUID o coincidencia de nombre (insensible a mayúsculas/minúsculas).
 */
export function findAccountByNameOrId(
  accounts: readonly Account[],
  identifier: string
): Account | undefined {
  const normalizedQuery = identifier.trim().toLowerCase();
  if (!normalizedQuery) {
    return undefined;
  }

  if (isUuid(normalizedQuery)) {
    return accounts.find(
      (account) => account.id.toLowerCase() === normalizedQuery
    );
  }

  const exactMatch = accounts.find(
    (account) => account.name.trim().toLowerCase() === normalizedQuery
  );
  if (exactMatch) {
    return exactMatch;
  }

  return accounts.find((account) =>
    account.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Busca una categoría en una lista por UUID o coincidencia de nombre (insensible a mayúsculas/minúsculas).
 */
export function findCategoryByNameOrId(
  categories: readonly Category[],
  identifier: string
): Category | undefined {
  const normalizedQuery = identifier.trim().toLowerCase();
  if (!normalizedQuery) {
    return undefined;
  }

  if (isUuid(normalizedQuery)) {
    return categories.find(
      (category) => category.id.toLowerCase() === normalizedQuery
    );
  }

  const exactMatch = categories.find(
    (category) => category.name.trim().toLowerCase() === normalizedQuery
  );
  if (exactMatch) {
    return exactMatch;
  }

  return categories.find((category) =>
    category.name.toLowerCase().includes(normalizedQuery)
  );
}
