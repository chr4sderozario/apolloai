/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Apollo AI Express Server
 * Serves the React application and provides server-side proxies for the Gemini API.
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { aiProvider } from "./src/server/aiProvider.js";

// Handle __dirname in ES Modules context safely
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  /**
   * Endpoint 1: Verify Access Code
   * Premium security gatekeeping. Validates the beta testers' invite code.
   */
  app.post("/api/verify-beta-code", (req, res) => {
    const { code } = req.body;
    
    // Normalize code (uppercase, trim spaces)
    const normalizedCode = (code || "").trim().toUpperCase();
    
    // Valid Demo Codes
    const VALID_CODES = ["APOLLO-BETA", "APOLLO2026", "APOLLO-ALPHA-2026", "INTELLIGENCE", "NOTHING-APOLLO"];

    if (VALID_CODES.includes(normalizedCode)) {
      res.json({
        success: true,
        message: "Access granted. Welcome to Apollo AI Alpha Sandbox.",
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid or expired access key. Please retrieve a demo key.",
      });
    }
  });

  /**
   * Endpoint 2: Conversation proxy
   * Relays query history to the modular AI provider safely keeping the process.env secrets.
   */
  app.post("/api/chat", async (req, res) => {
    try {
      const { history, systemInstruction } = req.body;
      
      if (!history || !Array.isArray(history)) {
        res.status(400).json({ error: "Missing or invalid 'history' element in request body." });
        return;
      }

      const responseText = await aiProvider.chat(history, systemInstruction);
      res.json({ response: responseText });
    } catch (err: any) {
      console.error("Express /api/chat error:", err.message || err);
      res.status(500).json({ error: err.message || "Failed to contact intelligent provider core." });
    }
  });

  /**
   * Endpoint 3: Text to Speech (Premium Voice synthesis proxy)
   * Converts textual outputs to spoken vocal waves via the Gemini TTS architecture.
   */
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceName } = req.body;
      
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Missing or invalid 'text' payload to vocalize." });
        return;
      }

      // Voice returns a base64 string
      const base64Audio = await aiProvider.textToSpeech(text, voiceName);
      res.json({ audio: base64Audio });
    } catch (err: any) {
      console.error("Express /api/tts error:", err.message || err);
      res.status(500).json({ error: err.message || "Synthesizer engine failed." });
    }
  });

  // Serve static assets & routing mapping using dev vs. prod middleware
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Mount Vite as a middleware.
    // Handles HMR, stylesheet/TypeScript transpilations instantly.
    console.log("Starting server in DEVELOPMENT MODE. Integrating Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve static bundle output during build phase.
    console.log("Starting server in PRODUCTION MODE. Serving compiled client files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to PORT 3000 and HOST 0.0.0.0 as required by sandboxed container routing
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Apollo AI server booted and route handlers initialized.`);
    console.log(`Access the platform at http://localhost:${PORT}`);
  });
}

startServer();
