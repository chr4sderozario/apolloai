# Apollo AI Platform ☀️

Welcome to the **Apollo AI** alpha sandbox codebase. Apollo AI is a complete, full-stack, highly responsive, and premium AI portal. 

Its brand identity is inspired by the bold minimalist typography of **Apple** and the dot-matrix retro-modern industrial styling of **Nothing Tech**, utilising a high-contrast visual design focused on **Bright Yellow (`#FFD400`)**, **Deep Charcoal Black**, and **Soft White**.

This application is built in **React 19**, **Vite**, **Express**, and **TypeScript**, showcasing a modular Full-stack Architecture featuring official SDK integration of the modern `@google/genai` models.

---

## 📂 Project Structure Explained

Here is a full breakdown of the codebase's folder organization:

```text
├── .env.example              # Blueprint documenting required environment credentials.
├── .gitignore                # Declares temporary build outputs to stay out of resource commits.
├── index.html                # Main mount page template referenced by Vite.
├── metadata.json             # AI Studio configuration (includes permissions registration for microphones!).
├── package.json              # Full project details, dependencies, and execution scripts.
├── server.ts                 # Full-stack backend Express server handling API proxies, TTS, and static clients.
├── tsconfig.json             # Compiler rules for modular, type-safe TypeScript resolution.
├── vite.config.ts            # Vite asset compiler, bundler, and stylesheet injector mappings.
└── src/
    ├── App.tsx               # Master React coordinator handling conditional landing page vs console routes.
    ├── index.css             # Entry stylesheet importing Tailwind CSS utility configurations.
    ├── main.tsx              # Bootstrap script rendering the React application to the HTML node.
    ├── types.ts              # Declarations for chats, voices, state structures, and configs.
    ├── components/           # Extracted visual interface panels:
    │   ├── Logo.tsx          # Stylized Nothing-inspired custom vectorized concentric Apollo emblem.
    │   ├── LandingPage.tsx   # Premium marketing landing page, featuring beta code gateways and feature grids.
    │   ├── Console.tsx       # Secure dark chat console, speech recognition module, and vocal synthesisers.
    │   └── AudioVisualizer.tsx # Canvas-based interactive wave animator responding to voice capture/speakers.
    └── server/
        └── aiProvider.ts     # Abstraction-first AI provider. Lazily initializes Gemini so missing keys don't crash servers.
```

---

## 🛠️ Dynamic Engine Core Modules

### 1. The Modular AI Abstraction
To ensure **modular design**, all server-side endpoints contact a unified interface called `AIProvider` in `/src/server/aiProvider.ts`. 
```typescript
export interface AIProvider {
  chat(history: Array<{ role: 'user' | 'model', text: string }>): Promise<string>;
  textToSpeech(text: string, voiceName: string): Promise<string>;
}
```
If you ever want to replace Gemini with any other LLM provider (e.g., Claude, OpenAI, or a self-hosted Ollama server), **you only need to implement this interface and update the import in `server.ts`**. No adjustments to client-side code are necessary!

### 2. Dual Speech Synthesis System
To ensure premium reliability, Apollo AI features two vocalization modes:
*   **Instant Local (Browser Synthesis)**: Utilizes the built-in browser `SpeechSynthesisUtterance` system. Runs instantly with zero latency and zero network load.
*   **Studio Core AI (Gemini TTS)**: Connects to our backend route proxied to `gemini-3.1-flash-tts-preview` which synthesizes organic voice bytes and streams them as raw WAV buffers to the browser.

### 3. Speech-to-Text capturing
Apollo AI implements standard HTML5 `webkitSpeechRecognition` to capture real-time speech. When Voice Session Mode is activated:
1.  The browser listens for spoken voice input.
2.  Your speech is dynamically transcribed and added to the prompt workspace.
3.  On silence, the prompt is automatically delivered to the Express backend.
4.  Apollo AI generates an answer, reads it aloud, and automatically reactivates the microphone, creating an immersive **hands-free conversation loop**!

---

## 🚀 Setup & Local Execution Guide

To run this fullstack application on your local machine, follow these steps:

### Prerequisites
Make sure you have **Node.js 18+** installed.

### 1. Clone & Populate Dependencies
In your workspace terminal, navigate to the folder and run:
```bash
npm install
```
This downloads all key dependencies defined in `package.json` (such as `express`, `@google/genai`, `motion`, `lucide-react`, and `tailwindcss`).

### 2. Setup Environment Variables
Create a file named `.env` in the root directory (matching the blueprint in `.env.example`):
```env
# Get a free key from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
```

### 3. Start Development Mode
Boot up our high-speed Express + Vite integration server:
```bash
npm run dev
```
The server will bind on port **3000** automatically. Open [http://localhost:3000](http://localhost:3000) in your browser.

*   *Beta Invite Keys*: To enter the sandbox console, use the demo invite passcode: **`APOLLO-BETA`** (or click the handy "Autofill Key" helper).

---

## 📦 Compiling and Deployment Mappings

Apollo AI compiles its full stack into a single, high-performance optimized envelope inside `dist/`.

To build the client assets and bundle our typescript Express backend with esbuild, run:
```bash
npm run build
```
This compiles React elements to static assets and outputs a bundled, standalone CommonJS backend file at `dist/server.cjs` which avoids runtime ES Module resolution errors in Node.js environments.

To run the production bundle locally or in an archive container, execute:
```bash
npm run start
```

---

### Deploying to Render
1.  Sign in to **Render** (https://render.com/).
2.  Choose **New Web Service** and map your GitHub repository.
3.  Set the environment to **Node**.
4.  Configure these build properties in the Render dashboard:
    *   **Build Command**: `npm run build`
    *   **Start Command**: `npm run start`
5.  Under the **Environment Variables** tab, add your credentials:
    *   `GEMINI_API_KEY` = `your_google_key_here`
    *   `NODE_ENV` = `production`
6.  Click **Deploy Web Service**.

### Deploying to Vercel
Since Vercel focuses on serverless routing, you can deploy the standalone client-only SPA instantly on Vercel high-speed edge, or route cloud servers.
*   To deploy a client-only layout, simply push the static `dist/` directory or connect Vercel to look at `npm run build`. Note that our full-stack Express server can be run as a serverless function by mapping an `api/` directory using Vercel's standard configuration file (`vercel.json`).

Enjoy testing and coding with Apollo AI! ☀️
