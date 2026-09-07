import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy GoogleGenAI initialization
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.error('[iTantra Server] Failed to initialize GoogleGenAI client:', err);
      geminiClient = null;
    }
  }
  return geminiClient;
}

// In-memory peer registry for local mesh nodes
interface MeshNode {
  deviceId: string;
  deviceName: string;
  transportType: string;
  supportedLanguages: string[];
  ipAddress: string;
  port: number;
  lastSeen: number;
}

const activeMeshNodes = new Map<string, MeshNode>();
const signalingMailbox = new Map<string, Array<{ fromPeerId: string; signal: unknown; timestamp: number }>>();

// Clean up stale nodes older than 45 seconds
setInterval(() => {
  const cutoff = Date.now() - 45000;
  for (const [id, node] of activeMeshNodes.entries()) {
    if (node.lastSeen < cutoff) {
      activeMeshNodes.delete(id);
    }
  }

  const signalCutoff = Date.now() - 30000;
  for (const [id, messages] of signalingMailbox.entries()) {
    const valid = messages.filter((m) => m.timestamp > signalCutoff);
    if (valid.length > 0) {
      signalingMailbox.set(id, valid);
    } else {
      signalingMailbox.delete(id);
    }
  }
}, 15000);

// ==================== API ROUTES ====================

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'iTantra Disaster Mesh Gateway',
    version: '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: Date.now(),
    meshPeersCount: activeMeshNodes.size,
    aiAvailable: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. AI Translation Proxy (when cloud is reachable)
app.post('/api/translate', async (req: Request, res: Response) => {
  const { text, sourceLang, targetLang } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text parameter is required.' });
    return;
  }

  const ai = getGemini();
  if (!ai) {
    // Graceful indicator for client to use local Indic dictionary
    res.json({
      translatedText: null,
      fallbackToClient: true,
      message: 'Server Gemini API key not configured. Fallback to client on-device dictionary.',
    });
    return;
  }

  try {
    const prompt = `You are a disaster emergency tactical translation engine for Indian languages.
Translate the following emergency phrase from language code "${sourceLang}" to language code "${targetLang}".
Return ONLY the direct, concise translated text without any explanation, markdown, notes, or quotes.

Source text: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 120,
      },
    });

    const translatedText = response.text?.trim() || '';
    res.json({
      translatedText: translatedText || null,
      fallbackToClient: !translatedText,
      modelUsed: 'gemini-3.8-flash',
    });
  } catch (err: unknown) {
    console.error('[iTantra Server] Gemini translation failed:', err);
    res.json({
      translatedText: null,
      fallbackToClient: true,
      error: err instanceof Error ? err.message : 'Translation request failed',
    });
  }
});

// 3. Local Mesh Node Discovery & Heartbeat
app.post('/api/mesh/announce', (req: Request, res: Response) => {
  const { deviceId, deviceName, transportType, supportedLanguages, ipAddress, port } = req.body;

  if (!deviceId || !deviceName) {
    res.status(400).json({ error: 'deviceId and deviceName are required' });
    return;
  }

  const node: MeshNode = {
    deviceId,
    deviceName,
    transportType: transportType || 'WIFI_DIRECT',
    supportedLanguages: Array.isArray(supportedLanguages) ? supportedLanguages : ['hi', 'en'],
    ipAddress: ipAddress || req.ip || '127.0.0.1',
    port: Number(port) || 8888,
    lastSeen: Date.now(),
  };

  activeMeshNodes.set(deviceId, node);
  res.json({ success: true, registeredPeers: activeMeshNodes.size });
});

app.get('/api/mesh/nodes', (req: Request, res: Response) => {
  const currentDeviceId = req.query.exclude as string | undefined;
  const nodes = Array.from(activeMeshNodes.values()).filter(
    (n) => !currentDeviceId || n.deviceId !== currentDeviceId
  );
  res.json({ nodes });
});

// 4. WebRTC Signaling Relay for Local Subnet
app.post('/api/mesh/signal', (req: Request, res: Response) => {
  const { fromPeerId, toPeerId, signalData } = req.body;

  if (!fromPeerId || !toPeerId || !signalData) {
    res.status(400).json({ error: 'fromPeerId, toPeerId, and signalData are required' });
    return;
  }

  const queue = signalingMailbox.get(toPeerId) || [];
  queue.push({
    fromPeerId,
    signal: signalData,
    timestamp: Date.now(),
  });
  signalingMailbox.set(toPeerId, queue);

  res.json({ success: true });
});

app.get('/api/mesh/signal/:peerId', (req: Request, res: Response) => {
  const peerId = req.params.peerId;
  const messages = signalingMailbox.get(peerId) || [];
  signalingMailbox.delete(peerId);
  res.json({ messages });
});

// ==================== VITE & STATIC SERVING ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[iTantra Server] Running on http://0.0.0.0:${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[iTantra Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[iTantra Server] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[iTantra Server] Fatal startup error:', err);
  process.exit(1);
});
