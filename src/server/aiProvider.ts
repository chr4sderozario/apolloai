/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Shared interface for AI providers.
 * If you ever want to replace Gemini with another LLM provider (e.g., Claude, OpenAI, Local LLM),
 * you only need to create a class that implements this interface and swap it in server.ts.
 */
export interface AIProvider {
  /**
   * Generates a conversational text response.
   * Handles chat history in standard format: { role: 'user' | 'model', parts: [{ text: string }] }
   */
  chat(history: Array<{ role: 'user' | 'model', text: string }>, systemInstruction?: string): Promise<string>;

  /**
   * Performs Text-To-Speech using the AI's natural voice synthesis.
   * Returns a base64-encoded audio string (PCM or WAV payload).
   */
  textToSpeech(text: string, voiceName: string): Promise<string>;
}

/**
 * Gemini-specific provider implementation utilizing the official @google/genai SDK.
 */
class GeminiProvider implements AIProvider {
  private aiClient: GoogleGenAI | null = null;

  /**
   * Lazily initializes the GoogleGenAI SDK to prevent startup crashes if the key is not defined.
   */
  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured. Please supply an API key in the Secrets Panel.");
      }
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return this.aiClient;
  }

  /**
   * Sends chat message and history to Gemini (gemini-3.5-flash).
   */
  async chat(history: Array<{ role: 'user' | 'model', text: string }>, systemInstruction?: string): Promise<string> {
    const client = this.getClient();

    // Map conversation history to the format required by the GoogleGenAI generateContent API
    const contents = history.map(item => ({
      role: item.role,
      parts: [{ text: item.text }]
    }));

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemInstruction || "You are Apollo AI, a ultra-advanced intelligent assistant. Keep responses helpful, precise, conversational, and aligned with a premium, sleek Nothing/Apple aesthetic.",
          temperature: 0.7,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty or undefined response content from Apollo Gemini core.");
      }
      return responseText.trim();
    } catch (err: any) {
      console.error("GeminiProvider.chat Error:", err.message || err);
      throw new Error(`Apollo Core Core Error: ${err.message || 'Unknown provider crash.'}`);
    }
  }

  /**
   * Performs high-fidelity text-to-speech using gemini-3.1-flash-tts-preview
   */
  async textToSpeech(text: string, voiceName: string = 'Kore'): Promise<string> {
    const client = this.getClient();

    // Valid voice names for prebuiltVoiceConfig are: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    // Defaulting safely if unsupported Voice is passed.
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const finalVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say naturally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: finalVoice as any },
            },
          },
        },
      });

      // Extract the audio from the parts inlineData
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("Response did not yield a valid Audio binary.");
      }

      return base64Audio;
    } catch (err: any) {
      console.error("GeminiProvider.textToSpeech Error:", err.message || err);
      throw new Error(`Voice Engine failure: ${err.message || "Synthesis failed."}`);
    }
  }
}

// Instantiate and export our Modular AI service
export const aiProvider: AIProvider = new GeminiProvider();
