import cors from "cors";
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
  res: import("express").Response
): Promise<void> {
  const messageEndpoint = req.apiToken
    ? `/messages?token=${encodeURIComponent(req.apiToken)}`
    : "/messages";
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
  res: import("express").Response
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
export function buildMcpExpressApp(): import("express").Express {
  const app = createMcpExpressApp({ host: "127.0.0.1" });

  app.use(cors());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      name: "finance-manager-mcp",
      version: "1.0.0",
      transport: "sse",
      activeSessions: activeSessions.size,
    });
  });

  app.get("/sse", authenticateMcpRequest, (req, res) => {
    handleSseConnection(req as AuthenticatedRequest, res).catch((error) => {
      console.error("[MCP Server] Error en conexión SSE:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Fallo al inicializar SSE" });
      }
    });
  });

  app.post("/messages", authenticateMcpRequest, (req, res) => {
    handlePostMessage(req as AuthenticatedRequest, res).catch((error) => {
      console.error("[MCP Server] Error procesando mensaje POST:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Fallo al procesar mensaje" });
      }
    });
  });

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

// Iniciar automáticamente cuando se ejecute directamente
if (process.env.NODE_ENV !== "test") {
  startSseServer();
}
