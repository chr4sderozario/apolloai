/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Lock, 
  ArrowLeft, 
  Settings, 
  ChevronRight, 
  RefreshCw,
  HelpCircle,
  Sparkles,
  Smartphone,
  Cpu,
  Monitor,
  Check,
  X,
  Volume1,
  MessageSquare
} from 'lucide-react';
import { Message, VoiceConfig, VoiceType } from '../types.ts';
import Logo from './Logo.tsx';
import AudioVisualizer from './AudioVisualizer.tsx';

interface ConsoleProps {
  onLock: () => void;
  accessCode: string;
}

export default function Console({ onLock, accessCode }: ConsoleProps) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello, I am Apollo AI. Your sandbox console is authenticated and completely online. I am optimized for context resolution, spoken conversations, and task assistance. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);

  // Voice/Speech toggles
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    enabled: true,
    type: 'browser',
    geminiVoiceName: 'Zephyr'
  });
  
  // Real-time Speech-to-Text (STT) tracking
  const [isListening, setIsListening] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const browserSpeechIntervalRef = useRef<any>(null);

  // Active playing audio state
  const [activeAudioState, setActiveAudioState] = useState<{
    messageId: string | null;
    progress: number;
    duration: number;
    currentTime: number;
  }>({
    messageId: null,
    progress: 0,
    duration: 10,
    currentTime: 0
  });

  // Hands-free Voice Call Mode
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<'idle' | 'listening' | 'speaking'>('idle');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll messages to bottom on list update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      // stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch(e){}
      }
      // stop playing audio
      if (browserSpeechIntervalRef.current) {
        clearInterval(browserSpeechIntervalRef.current);
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      // cancel speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Initialize Speech Recognition (STT) inside browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setVisualizerMode('listening');
        setSttError(null);
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          setSttError("Microphone permissions blocked. Enable mic access in site controls.");
        } else if (event.error === 'no-speech') {
          // Silent end is normal, don't worry
        } else {
          setSttError(`Speech recognition failed: ${event.error}`);
        }
        setIsListening(false);
        setVisualizerMode('idle');
      };

      rec.onend = () => {
        setIsListening(false);
        if (visualizerMode === 'listening') {
          setVisualizerMode('idle');
        }
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText && resultText.trim()) {
          setInputMessage(prev => {
            const added = prev ? `${prev} ${resultText}` : resultText;
            
            // If the user was in fully interactive Voice Session Mode, let's auto-submit the recording
            if (isVoiceSessionActive) {
              setTimeout(() => {
                onSubmitMessage(added);
              }, 500);
              return '';
            }
            return added;
          });
        }
      };

      recognitionRef.current = rec;
    }
  }, [isVoiceSessionActive, visualizerMode]);

  /**
   * Action: Start / Stop Voice Recording
   */
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSttError("Speech Recognition is not supported on this browser. Try Chrome/Edge/Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Stop anything actively speaking
      stopAllSpeaking();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech capturing:", err);
      }
    }
  };

  /**
   * Safe clean-up for synthetic speech outputs
   */
  const stopAllSpeaking = () => {
    setIsPlayingAudio(false);
    setVisualizerMode('idle');
    
    setActiveAudioState({
      messageId: null,
      progress: 0,
      duration: 10,
      currentTime: 0
    });

    if (browserSpeechIntervalRef.current) {
      clearInterval(browserSpeechIntervalRef.current);
      browserSpeechIntervalRef.current = null;
    }

    // Cancel browser synthesize
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Pause custom audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  /**
   * Action: Vocalize response using Selected Speech Config
   */
  const vocalizeText = async (text: string, messageId: string) => {
    if (!voiceConfig.enabled) return;
    
    stopAllSpeaking();
    setIsPlayingAudio(true);
    setVisualizerMode('speaking');

    // Remove code syntax, headers, markdown tags for cleaner recitation
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '[Code snippet omitted]')
      .replace(/[*#`_-]/g, ' ')
      .slice(0, 1000); // Guard rails to prevent infinite vocalizations

    if (voiceConfig.type === 'browser') {
      // ENGINE 1: Standard Speech Synthesis (Immediate, Browser-controlled)
      if (!window.speechSynthesis) {
        console.warn("Browser Speech Synthesis unsupported.");
        setIsPlayingAudio(false);
        setVisualizerMode('idle');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Attempt premium high-fidelity English voices
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Studio')));
      if (premiumVoice) {
        utterance.voice = premiumVoice;
      }
      
      utterance.rate = 1.05; // Slightly swifter for Nothing conversational vibe
      utterance.pitch = 1.0;

      // Animate simulated progress waveform
      const wordsCount = cleanText.split(/\s+/).length;
      const estimatedDuration = Math.max(3, Math.min(45, wordsCount * 0.45)); // seconds
      const startTime = Date.now();
      
      setActiveAudioState({
        messageId,
        progress: 0,
        duration: estimatedDuration,
        currentTime: 0
      });

      browserSpeechIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(100, (elapsed / estimatedDuration) * 100);
        setActiveAudioState(prev => {
          if (prev.messageId !== messageId) return prev;
          return {
            messageId,
            progress: pct,
            duration: estimatedDuration,
            currentTime: Math.min(estimatedDuration, elapsed)
          };
        });
        if (pct >= 100) {
          if (browserSpeechIntervalRef.current) {
            clearInterval(browserSpeechIntervalRef.current);
            browserSpeechIntervalRef.current = null;
          }
        }
      }, 100);

      utterance.onend = () => {
        setIsPlayingAudio(false);
        setVisualizerMode('idle');
        stopAllSpeaking();
        
        // Loop back into listening if hands-free is active!
        if (isVoiceSessionActive) {
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              try {
                recognitionRef.current.start();
              } catch(e){}
            }
          }, 600);
        }
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setVisualizerMode('idle');
        stopAllSpeaking();
      };

      window.speechSynthesis.speak(utterance);

    } else {
      // ENGINE 2: Custom Gemini Model Vocalizer (gemini-3.1-flash-tts-preview)
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanText, voiceName: voiceConfig.geminiVoiceName })
        });

        if (!response.ok) {
          throw new Error("Vocalizer server route returned failure status.");
        }

        const data = await response.json();
        if (data.audio) {
          // Decode raw base64 PCM wav source and create Blob
          const binaryString = window.atob(data.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          // The gemini-3.1-flash-tts-preview returns WAV/PCM wrapped bytes
          const blob = new Blob([bytes], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);

          const audio = new Audio(url);
          currentAudioRef.current = audio;
          
          audio.onloadedmetadata = () => {
            setActiveAudioState({
              messageId,
              progress: 0,
              duration: audio.duration || 10,
              currentTime: 0
            });
          };

          audio.ontimeupdate = () => {
            if (audio.duration) {
              const pct = (audio.currentTime / audio.duration) * 100;
              setActiveAudioState({
                messageId,
                progress: pct,
                duration: audio.duration,
                currentTime: audio.currentTime
              });
            }
          };

          audio.onended = () => {
            setIsPlayingAudio(false);
            setVisualizerMode('idle');
            stopAllSpeaking();
            
            // Loop back into listening if hands-free is active
            if (isVoiceSessionActive) {
              setTimeout(() => {
                if (recognitionRef.current && !isListening) {
                  try {
                    recognitionRef.current.start();
                  } catch(e){}
                }
              }, 600);
            }
          };

          audio.onerror = () => {
            setIsPlayingAudio(false);
            setVisualizerMode('idle');
            stopAllSpeaking();
          };

          await audio.play();
        } else {
          throw new Error("No audio bytes retrieved from synthesized JSON.");
        }
      } catch (err: any) {
        console.error("Gemini TTS Fail, fallback to Browser Voice:", err);
        // Fallback to browser speaking if server is missing API keys
        voiceConfig.type = 'browser';
        vocalizeText(text, messageId);
      }
    }
  };

  /**
   * Action: Core Submit payload to API
   */
  const onSubmitMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isSending) return;

    // Reset draft block
    if (!customText) {
      setInputMessage('');
    }
    
    setSystemError(null);
    stopAllSpeaking();

    // 1. Generate unique IDs
    const userMsgId = `msg-user-${Date.now()}`;
    const assistantMsgId = `msg-apollo-${Date.now()}`;

    // 2. Append User message to React state
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsSending(true);

    // If hands-free is active and we are sending, state visualizer is thinking
    if (isVoiceSessionActive) {
      setVisualizerMode('idle'); // waiting
    }

    try {
      // Transform our model history for Gemini API payload compatibility
      // { role: 'user' | 'model', text: string }
      const historyPayload = updatedMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        text: msg.content
      }));

      // Contact backend express route proxying Gemini API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          history: historyPayload,
          systemInstruction: "You are Apollo AI, a core conversational assistant. Maintain highly polished, articulate, informative dialog. Use Markdown format when helpful. Embrace Nothing/Apple's strict premium tone (minimalist, clean, slightly professional, humble). All physical elements like coding and files are supported. Do NOT mention imagery generation capabilities."
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status code ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response) {
        setMessages(prev => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        // Vocalize response!
        if (voiceConfig.enabled) {
          vocalizeText(data.response, assistantMsgId);
        }
      } else {
        throw new Error("Apollo response body could not be parsed successfully.");
      }

    } catch (err: any) {
      console.error("Chat routing error:", err);
      setSystemError(err.message || "Failed to retrieve cognitive response from system.");
      
      setMessages(prev => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          role: 'assistant',
          content: "System transmission interrupted. Please ensure your GEMINI_API_KEY is configured in the Secrets panel and check server logs.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Action: Start / Cancel hands-free Call Mode
   */
  const toggleVoiceSession = () => {
    if (!recognitionRef.current) {
      alert("Mic speech capturing is unavailable. Try Chrome/Edge or verify microphone permissions.");
      return;
    }

    if (isVoiceSessionActive) {
      setIsVoiceSessionActive(false);
      stopAllSpeaking();
      if (isListening) {
        recognitionRef.current.stop();
      }
    } else {
      setIsVoiceSessionActive(true);
      stopAllSpeaking();
      // Start capturing vocal sound immediately
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch(e){}
      }, 300);
    }
  };

  const handleSuggestClick = (suggestion: string) => {
    setInputMessage(suggestion);
    onSubmitMessage(suggestion);
  };

  const clearChatHistory = () => {
    if (confirm("Reset current Apollo console state? This flushes memory cache.")) {
      stopAllSpeaking();
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: "Apollo cognitive cache purged successfully. I am calibrated and awaiting instructions.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const renderVoiceMessagePlayer = (msg: Message) => {
    const isPlayingThis = activeAudioState.messageId === msg.id;
    // Format duration helper
    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
      <div className="mt-4 p-3 bg-[#0c0c04]/80 dark:bg-[#070702]/90 border border-amber-400/20 rounded-xl flex items-center gap-3.5 shadow-[0_4px_12px_rgba(255,212,0,0.03)]" id={`audio-player-${msg.id}`}>
        
        {/* Play / Pause button */}
        <button
          type="button"
          onClick={() => {
            if (isPlayingThis) {
              stopAllSpeaking();
            } else {
              vocalizeText(msg.content, msg.id);
            }
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer select-none ${
            isPlayingThis 
              ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(255,212,0,0.5)] animate-pulse" 
              : "bg-amber-400/10 text-amber-400 hover:bg-amber-400 hover:text-black hover:scale-105"
          }`}
          id={`play-pause-btn-${msg.id}`}
        >
          {isPlayingThis ? (
            <span className="flex gap-1 items-center justify-center">
              <span className="w-0.5 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-0.5 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-0.5 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Dynamic Waveform Progress bar */}
        <div className="flex-grow space-y-1 min-w-0">
          <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500">
            <span className="text-amber-400 font-semibold uppercase flex items-center gap-1 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Apollo Voice Message
            </span>
            <span className="font-medium">
              {isPlayingThis 
                ? `${formatTime(activeAudioState.currentTime)} / ${formatTime(activeAudioState.duration)}` 
                : "Continuous Voice Note"
              }
            </span>
          </div>

          {/* Dotted Sound Wave Pattern */}
          <div className="relative h-6 flex items-center gap-[3px] select-none">
            {/* Background static gray dots */}
            <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-between pointer-events-none opacity-20">
              {Array.from({ length: 28 }).map((_, i) => {
                // Wave heights using deterministic sin function
                const height = 6 + Math.abs(Math.sin((i + 1) * 0.4)) * 16;
                return (
                  <span 
                    key={i} 
                    className="w-[2.5px] rounded-full bg-amber-400/80" 
                    style={{ height: `${height}px` }} 
                  />
                );
              })}
            </div>

            {/* Foreground amber filled dots indicating dynamic playtime */}
            <div 
              className="absolute inset-y-0 left-0 flex items-center justify-between overflow-hidden transition-all duration-100 ease-linear pointer-events-none text-amber-400"
              style={{ width: isPlayingThis ? `${activeAudioState.progress}%` : '0%' }}
            >
              <div className="w-[1000%] flex items-center justify-between pr-1">
                {Array.from({ length: 28 }).map((_, i) => {
                  const height = 6 + Math.abs(Math.sin((i + 1) * 0.4)) * 16;
                  return (
                    <span 
                      key={i} 
                      className="w-[2.5px] rounded-full bg-amber-400 flex-shrink-0" 
                      style={{ height: `${height}px`, marginRight: '1px' }} 
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const suggestions = [
    "What can you automate?",
    "Explain Nothing Tech design philosophy",
    "Compare Apple M-series chips with Intel architecture",
    "Draft a clean React hook layout"
  ];

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans flex flex-col md:flex-row overflow-hidden selection:bg-amber-400 selection:text-black" id="console-root">
      
      {/* Sidebar Controls */}
      <aside className="w-full md:w-80 bg-black border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between p-6 overflow-y-auto" id="console-sidebar">
        <div>
          
          {/* Header Brand */}
          <div className="flex items-center justify-between border-b border-white/15 pb-5 mb-6">
            <div className="flex items-center gap-2.5">
              <Logo size={28} animate={isSending || isPlayingAudio} />
              <div className="text-left leading-none">
                <div className="font-mono text-sm tracking-widest font-semibold text-white">APOLLO <span className="text-amber-400">AI</span></div>
                <span className="text-[9px] font-mono text-neutral-500 tracking-wider">SANDBOX v1.4</span>
              </div>
            </div>

            <button 
              onClick={onLock} 
              className="p-1.5 rounded hover:bg-white/5 border border-white/5 hover:border-white/10 text-neutral-400 hover:text-white transition-all duration-300"
              title="Lock console and return to landing page."
              id="sidebar-lock-btn"
            >
              <Lock size={15} />
            </button>
          </div>

          {/* Core Cores Telemetry status panel */}
          <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/5 space-y-3.5 mb-6 hover:border-amber-400/20 transition-all duration-300">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>SANDBOX STATE</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                ONLINE
              </span>
            </div>

            <div className="text-xs font-mono text-neutral-500 space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between">
                <span>Passcode Bound:</span>
                <span className="text-neutral-300 select-all font-semibold uppercase">{accessCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Cognitive engine:</span>
                <span className="text-neutral-300 font-semibold text-amber-400">Apollo Alpha 01</span>
              </div>
              <div className="flex justify-between">
                <span>Module pipeline:</span>
                <span className="text-amber-400 font-bold uppercase">Express Proxy</span>
              </div>
            </div>
          </div>

          {/* Voice configuration selection segment */}
          <div className="space-y-4 mb-6">
            <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-widest font-bold">Voice Synthesis Settings</h3>
            
            {/* Enable synthesiser completely */}
            <label className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-[#080808] hover:border-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                {voiceConfig.enabled ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} className="text-neutral-500" />}
                <span className="text-xs font-mono text-neutral-300">Speak Answers Aloud</span>
              </div>
              <input 
                type="checkbox" 
                checked={voiceConfig.enabled}
                onChange={(e) => {
                  setVoiceConfig(prev => ({ ...prev, enabled: e.target.checked }));
                  if (!e.target.checked) stopAllSpeaking();
                }}
                className="accent-amber-400 w-4 h-4 cursor-pointer"
                id="voice-enable-toggle"
              />
            </label>

            {voiceConfig.enabled && (
              <div className="bg-[#080808] border border-white/5 rounded-xl p-3 space-y-3">
                
                {/* Voice engine type select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase">SYNTHESIS ENGINE</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setVoiceConfig(prev => ({ ...prev, type: 'browser' }))}
                      className={`font-mono text-[10px] py-1.5 border rounded cursor-pointer transition-colors ${
                        voiceConfig.type === 'browser'
                          ? "bg-amber-400 border-amber-400 text-black font-semibold"
                          : "border-white/5 bg-black hover:bg-white/5 text-neutral-400"
                      }`}
                      id="engine-browser"
                    >
                      Instant Local
                    </button>
                    <button
                      onClick={() => setVoiceConfig(prev => ({ ...prev, type: 'gemini' }))}
                      className={`font-mono text-[10px] py-1.5 border rounded cursor-pointer transition-colors ${
                        voiceConfig.type === 'gemini'
                          ? "bg-amber-400 border-amber-400 text-black font-semibold"
                          : "border-white/5 bg-black hover:bg-white/5 text-neutral-400"
                      }`}
                      id="engine-gemini"
                    >
                      Studio Core AI
                    </button>
                  </div>
                </div>

                {/* Gemini preset voices dropdown */}
                {voiceConfig.type === 'gemini' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase">STUDIO PRESET VOICE</label>
                    <select
                      value={voiceConfig.geminiVoiceName}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, geminiVoiceName: e.target.value as any }))}
                      className="w-full font-mono text-xs bg-black border border-white/10 rounded-lg p-2 text-white accent-amber-400 focus:outline-none focus:border-amber-400"
                      id="gemini-preset-select"
                    >
                      <option value="Zephyr">Zephyr (Warm & Conversational)</option>
                      <option value="Kore">Kore (Articulate & Neutral)</option>
                      <option value="Puck">Puck (Fast & Enthusiastic)</option>
                      <option value="Charon">Charon (Deep & Professional)</option>
                      <option value="Fenrir">Fenrir (Bold & Sharp)</option>
                    </select>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Call mode activator btn */}
          <div className="mt-4 mb-2">
            <button
              onClick={toggleVoiceSession}
              className={`w-full py-3.5 px-4 font-mono text-xs font-semibold rounded-xl border flex items-center justify-center gap-2.5 transition-all duration-300 ${
                isVoiceSessionActive
                  ? "bg-red-500 border-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-[#0b0c03] border-amber-400/30 hover:border-amber-400 text-amber-400 hover:bg-amber-400/5 shadow-[0_0_15px_rgba(255,212,0,0.02)]"
              }`}
              id="voice-session-trigger"
            >
              {isVoiceSessionActive ? (
                <>
                  <MicOff size={15} />
                  Terminate Voice Session
                </>
              ) : (
                <>
                  <Mic size={15} className="animate-pulse" />
                  Hands-Free Voice Session
                </>
              )}
            </button>
            <p className="text-[10px] font-mono text-neutral-500 text-center mt-2.5 leading-relaxed leading-medium select-none">
              {isVoiceSessionActive 
                ? "Apollo is continuously listening and reciting. Speak clearly."
                : "Initiates real-time continuous speech sequence"
              }
            </p>
          </div>

        </div>

        {/* Footer controls */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <button
            onClick={clearChatHistory}
            className="w-full bg-white/5 hover:bg-red-950/20 hover:text-red-400 hover:border-red-500/20 border border-white/5 text-neutral-400 font-mono text-xs rounded-xl py-2.5 transition-all text-center flex items-center justify-center gap-1.5"
            id="clear-logs-btn"
          >
            Clear Console Log
          </button>

          <div className="text-[11px] font-mono text-neutral-600 text-center select-none">
            APOLLO Sandbox Node 01 | Secure
          </div>
        </div>
      </aside>

      {/* Main Console Workspace */}
      <section className="flex-grow flex flex-col justify-between h-[calc(100vh-200px)] md:h-screen relative" id="console-workspace">
        
        {/* Top telemetry board info */}
        <header className="border-b border-white/10 py-4.5 px-6 flex items-center justify-between bg-black/60 backdrop-blur" id="workspace-header">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <h2 className="font-mono text-xs tracking-wider uppercase text-neutral-300">ACTIVE CONSOLE PIPELINE</h2>
          </div>
          
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-500">
            {isPlayingAudio && (
              <span className="flex items-center gap-1.5 text-amber-400 text-[10px]">
                <Volume2 size={13} className="animate-bounce" /> AUDIO RECITAL ACTIVE
              </span>
            )}
            {isSending && (
              <span className="flex items-center gap-1.5 text-neutral-400 text-[10px]">
                <RefreshCw size={11} className="animate-spin" /> Apollo thinking...
              </span>
            )}
            
            <button 
              onClick={onLock} 
              className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              id="workspace-close-btn"
            >
              <ArrowLeft size={14} /> Lock Dashboard
            </button>
          </div>
        </header>

        {/* Voice active overlay visualizer if in voice mode */}
        {isVoiceSessionActive && (
          <div className="bg-amber-400/5 border-b border-amber-400/10 p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative animate-fadeIn" id="voice-overlay-visualizer">
            <div className="text-left w-full md:w-auto">
              <span className="font-mono text-[10px] tracking-widest text-amber-400 uppercase font-bold border border-amber-400/30 px-2 py-0.5 rounded bg-amber-400/5">
                {visualizerMode === 'listening' ? 'CAPTIONING VOICE...' : visualizerMode === 'speaking' ? 'VOCALIZING RESPONSE...' : 'AMBIENT WAITING...'}
              </span>
              <h3 className="text-sm font-bold mt-2 text-white">Interactive Hands-free active.</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Microphone listens dynamically. Speak, then sleep for answer.</p>
            </div>
            
            <div className="w-full max-w-sm flex-grow">
              <AudioVisualizer isActive={isVoiceSessionActive} mode={visualizerMode} />
            </div>

            <button
              onClick={() => {
                setIsVoiceSessionActive(false);
                stopAllSpeaking();
              }}
              className="absolute top-3 right-3 text-neutral-400 hover:text-white rounded-full p-1 hover:bg-white/5 transition-colors"
              title="Close Voice Overlay"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Messaging Board scroll window */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6" id="chat-messages-board">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  id={msg.id}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4.5 border ${
                    isUser 
                      ? "bg-amber-400 border-amber-500 text-black shadow-[0_4px_15px_rgba(255,212,0,0.1)]" 
                      : "bg-[#0b0b0b] border-white/10 text-neutral-200"
                  }`}>
                    
                    {/* Role header info in monospace text */}
                    <div className={`flex items-center gap-1.5 text-[10px] font-mono mb-2 ${
                      isUser ? "text-neutral-900" : "text-neutral-500"
                    }`}>
                      <span className="font-semibold uppercase">{isUser ? 'Master Client' : 'Apollo AI'}</span>
                      <span>&bull;</span>
                      <span>{msg.timestamp}</span>

                      {/* Recite indicator button */}
                      {!isUser && voiceConfig.enabled && (
                        <button
                          onClick={() => vocalizeText(msg.content, msg.id)}
                          className="ml-auto hover:text-white transition-colors p-0.5 rounded cursor-pointer"
                          title="Replay speech recitation"
                        >
                          <Volume1 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Core body content parsed natively safely */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Custom voice chat visual note format so people can listen */}
                    {!isUser && renderVoiceMessagePlayer(msg)}

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Grid display (only shown if simple history) */}
        {messages.length === 1 && (
          <div className="px-6 md:px-8 mb-4 max-w-4xl mx-auto w-full" id="suggested-queries-wrapper">
            <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-3 select-none">Quick Calibrations suggestions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="suggestion-grid">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestClick(s)}
                  className="bg-black border border-white/5 hover:border-amber-400/40 hover:bg-amber-400/[0.01] rounded-xl p-3 text-left text-xs text-neutral-300 transition-all cursor-pointer flex items-center justify-between group"
                  id={`suggest-btn-${idx}`}
                >
                  <span className="truncate pr-3">{s}</span>
                  <ChevronRight size={12} className="text-neutral-600 group-hover:text-amber-400 hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Speech / Text Form control */}
        <div className="p-6 md:p-8 border-t border-white/10 bg-[#020202]/80 backdrop-blur" id="chat-input-bar">
          
          {sttError && (
            <div className="bg-red-950/20 border border-rose-500/20 text-rose-400 text-xs font-mono p-3 rounded-xl mb-4 flex items-center justify-between" id="stt-error-feedback">
              <span className="truncate">{sttError}</span>
              <button onClick={() => setSttError(null)} className="text-neutral-500 hover:text-white ml-2"><X size={14} /></button>
            </div>
          )}

          {systemError && (
            <div className="bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-mono p-3 rounded-xl mb-4 flex items-center justify-between" id="system-error-feedback">
              <span>{systemError}</span>
              <button onClick={() => setSystemError(null)} className="text-neutral-500 hover:text-white"><X size={14} /></button>
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitMessage();
            }} 
            className="flex items-center gap-3 max-w-4xl mx-auto relative bg-[#090909] border border-white/10 focus-within:border-amber-400/40 rounded-2xl p-1.5 transition-all"
            id="chat-submit-form"
          >
            
            {/* STT Microphone Recorder button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                isListening 
                  ? "bg-amber-400 text-black hover:bg-amber-300 hover:scale-105 animate-pulse" 
                  : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
              }`}
              title={isListening ? "Listening... click to capture speech output" : "Click to trigger speech-to-text"}
              id="chat-mic-btn"
            >
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {/* Core message text box */}
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? "Listening... speak now..." : "MESSAGE APOLLO AI EMULATOR CORES..."}
              className="flex-grow bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none px-2 py-3.5 text-sm font-sans tracking-wide text-white placeholder:text-neutral-600 uppercase"
              disabled={isSending}
              id="message-text-input"
            />

            {/* Submit execution button */}
            <button
              type="submit"
              className={`p-4.5 rounded-xl text-black bg-amber-400 hover:bg-amber-300 font-semibold cursor-pointer transition-colors ${
                (!inputMessage.trim() || isSending) ? "opacity-40 cursor-not-allowed bg-neutral-800 text-neutral-500 border border-white/5" : ""
              }`}
              disabled={!inputMessage.trim() || isSending}
              title="Transcribe and deliver core instruction"
              id="chat-send-btn"
            >
              {isSending ? (
                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Send size={18} />
              )}
            </button>

          </form>

          {/* Guidelines info text centered below input */}
          <div className="text-[10px] font-mono text-neutral-600 text-center mt-3 select-none">
            Microphone speech to text powered by Local WebKit APIs. Synthesiser calibrated for English models.
          </div>

        </div>

      </section>

    </div>
  );
}
