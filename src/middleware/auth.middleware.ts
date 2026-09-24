import type { NextFunction, Request, Response } from "express";
import { ENV_CONFIG } from "../config/env.config.js";

export interface AuthenticatedRequest extends Request {
  apiToken?: string;
}

/**
 * Extrae el token de autenticación desde cabeceras HTTP o parámetros de consulta URL.
 */
function extractToken(req: Request): string | null {
  const headerKey = req.headers["x-api-key"];
  if (typeof headerKey === "string" && headerKey.trim()) {
    return headerKey.trim();
  }

  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string") {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      return trimmed.slice(7).trim();
    }
  }

  const queryToken = req.query["token"] ?? req.query["apiKey"];
  if (typeof queryToken === "string" && queryToken.trim()) {
    return queryToken.trim();
  }

  return null;
}

/**
 * Middleware de autenticación dual (Headers y Query Param) para el servidor MCP.
 * Aplica Early Return ante credenciales ausentes o no coincidentes.
 */
export function authenticateMcpRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      message:
        "Acceso denegado: API Key no proporcionada. Envíela mediante header 'X-API-KEY', 'Authorization: Bearer <token>' o query '?token=<token>'.",
    });
    return;
  }

  if (ENV_CONFIG.apiToken && token !== ENV_CONFIG.apiToken) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Acceso denegado: API Key inválida o no autorizada.",
    });
    return;
  }

  req.apiToken = token;
  next();
}
