/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioUrl?: string; // Optional URL of synthetic speech returned from Gemini TTS backend
}

export type VoiceType = 'browser' | 'gemini';

export interface VoiceConfig {
  enabled: boolean;
  type: VoiceType;
  browserVoiceName?: string; // Standard Web Speech voice
  geminiVoiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}

export interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  status?: 'active' | 'soon' | 'future';
  iconName: string;
}
