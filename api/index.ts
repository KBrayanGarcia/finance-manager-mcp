import type { Express } from "express";
import { buildMcpExpressApp } from "../src/server.js";

/**
 * Instancia de la aplicación Express configurada para el entorno serverless de Vercel.
 */
const app: Express = buildMcpExpressApp();

/**
 * Handler serverless por defecto para Vercel.
 */
export default app;
