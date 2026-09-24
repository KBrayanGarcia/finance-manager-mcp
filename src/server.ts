import cors from "cors";
import type { Express, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ENV_CONFIG } from "./config/env.config.js";
import { createMcpServer } from "./factory/mcp-server.factory.js";
import {
  authenticateMcpRequest,
  type AuthenticatedRequest,
} from "./middleware/auth.middleware.js";
import { ApiClientService } from "./services/api-client.service.js";

/**
 * Almacén en memoria para rastrear y enrutar las sesiones de transporte SSE activas.
 */
const activeSessions = new Map<string, SSEServerTransport>();

/**
 * Registra y gestiona el ciclo de vida de una nueva conexión SSE.
 */
async function handleSseConnection(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  // Configurar cabeceras de deshabilitación de buffer para streaming SSE en Vercel y proxies inversos
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Cache-Control", "no-cache, no-transform");

  const isApiPath = req.path.startsWith("/api");
  const baseMessagePath = isApiPath ? "/api/messages" : "/messages";
  const messageEndpoint = req.apiToken
    ? `${baseMessagePath}?token=${encodeURIComponent(req.apiToken)}`
    : baseMessagePath;
  const transport = new SSEServerTransport(messageEndpoint, res);
  const sessionId = transport.sessionId;

  activeSessions.set(sessionId, transport);
  console.log(`[MCP Server] Nueva sesión SSE establecida: ${sessionId}`);

  transport.onclose = () => {
    console.log(`[MCP Server] Sesión SSE cerrada: ${sessionId}`);
    activeSessions.delete(sessionId);
  };

  const apiClient = new ApiClientService(req.apiToken);
  const server = createMcpServer(apiClient);

  await server.connect(transport);
}

/**
 * Enruta los mensajes POST JSON-RPC hacia el transporte SSE correspondiente a la sesión.
 */
async function handlePostMessage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const rawSessionId = req.query["sessionId"];
  const sessionId = typeof rawSessionId === "string" ? rawSessionId : undefined;

  if (!sessionId) {
    res.status(400).json({
      error: "Bad Request",
      message: "El parámetro de consulta 'sessionId' es obligatorio.",
    });
    return;
  }

  const transport = activeSessions.get(sessionId);
  if (!transport) {
    res.status(404).json({
      error: "Not Found",
      message: `No se encontró una sesión activa para el ID: ${sessionId}`,
    });
    return;
  }

  await transport.handlePostMessage(req, res, req.body);
}

/**
 * Configura y retorna la aplicación Express para el servidor MCP.
 */
export function buildMcpExpressApp(): Express {
  // En Vercel / producción se desactiva la restricción de localhost para permitir dominios remotos
  const isServerless =
    Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
  const app = createMcpExpressApp({
    host: isServerless ? "0.0.0.0" : "127.0.0.1",
  });

  app.use(cors());

  app.get(["/", "/api"], (_req, res) => {
    res.json({
      name: "finance-manager-mcp",
      status: "online",
      description: "Finance Manager MCP Server (SSE Transport)",
      endpoints: {
        health: "/health",
        sse: "/sse",
        messages: "/messages",
      },
    });
  });

  app.get(["/health", "/api/health"], (_req, res) => {
    res.json({
      status: "ok",
      name: "finance-manager-mcp",
      version: "1.0.0",
      transport: "sse",
      activeSessions: activeSessions.size,
    });
  });

  app.get(["/sse", "/api/sse"], authenticateMcpRequest, (req, res) => {
    handleSseConnection(req as AuthenticatedRequest, res).catch((error) => {
      console.error("[MCP Server] Error en conexión SSE:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Fallo al inicializar SSE" });
      }
    });
  });

  app.post(
    ["/messages", "/api/messages"],
    authenticateMcpRequest,
    (req, res) => {
      handlePostMessage(req as AuthenticatedRequest, res).catch((error) => {
        console.error("[MCP Server] Error procesando mensaje POST:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Fallo al procesar mensaje" });
        }
      });
    }
  );

  return app;
}

/**
 * Inicializa y levanta el servidor HTTP Express en el puerto configurado.
 */
export function startSseServer(port: number = ENV_CONFIG.port): void {
  const app = buildMcpExpressApp();

  app.listen(port, () => {
    console.log(`🚀 Finance Manager MCP (SSE) escuchando en http://localhost:${port}`);
    console.log(`📡 Endpoint SSE: http://localhost:${port}/sse`);
    console.log(`📨 Endpoint Mensajes: http://localhost:${port}/messages`);
    console.log(`🏥 Healthcheck: http://localhost:${port}/health`);
  });
}

/**
 * Valida si se debe iniciar el servidor de manera autónoma.
 */
function shouldAutoStart(): boolean {
  if (Boolean(process.env.VERCEL)) {
    return false;
  }
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  return true;
}

// Iniciar automáticamente solo cuando no se encuentre en entorno serverless o tests
if (shouldAutoStart()) {
  startSseServer();
}
