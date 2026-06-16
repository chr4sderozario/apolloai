/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Mic, 
  Sparkles, 
  Cpu, 
  Smartphone, 
  Monitor, 
  ArrowRight, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle,
  HelpCircle,
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react';
import Logo from './Logo.tsx';

interface LandingPageProps {
  onUnlock: (code: string) => void;
  isUnlocked: boolean;
}

export default function LandingPage({ onUnlock, isUnlocked }: LandingPageProps) {
  const [accessCode, setAccessCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Suggested Demo Keys displayed to the tester elegantly
  const DEMO_KEY = "APOLLO-BETA";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setIsValidating(true);
    setVerificationMessage(null);

    try {
      const response = await fetch("/api/verify-beta-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsError(false);
        setVerificationMessage(data.message);
        
        // Trigger parent state transition after 1 second of success animation
        setTimeout(() => {
          onUnlock(accessCode);
        }, 1000);
      } else {
        setIsError(true);
        setVerificationMessage(data.error || data.message || "Access key verification failed.");
      }
    } catch (err) {
      setIsError(true);
      setVerificationMessage("Network failure. Could not connect to verification gateway.");
    } finally {
      setIsValidating(false);
    }
  };

  const autofillCode = () => {
    setAccessCode(DEMO_KEY);
    setVerificationMessage(null);
  };

  // Modern feature details aligned to bento boxes
  const features = [
    {
      id: "feat-chat",
      title: "AI Chat",
      description: "Direct conversational interface backed by high-reasoning context intelligence to solve complex software, textual, and reasoning queries.",
      status: "active" as const,
      icon: MessageSquare,
      accent: "text-amber-400"
    },
    {
      id: "feat-voice",
      title: "Voice Conversations",
      description: "Seamless real-time speech dialogue. Apollo records your raw voice, converts it to context tokens, and answers back instantly with synthetic speech.",
      status: "active" as const,
      icon: Mic,
      accent: "text-amber-400"
    },
    {
      id: "feat-smart",
      title: "Smart Assistance",
      description: "Extract telemetry, translate transcripts, synthesize formulas, and map intricate logical processes through advanced instructions.",
      status: "active" as const,
      icon: Sparkles,
      accent: "text-amber-400"
    },
    {
      id: "feat-automation",
      title: "Task Automation",
      description: "Autonomous batch script processing, self-referential coding pipelines, and third-party API routing structures. Coming to our next Alpha stage.",
      status: "soon" as const,
      icon: Cpu,
      accent: "text-white/40"
    },
    {
      id: "feat-device",
      title: "Device Control",
      description: "Connecting ambient language intelligence with local peripheral operations on Windows and Linux clients. Coming to future builds.",
      status: "future" as const,
      icon: Monitor,
      accent: "text-white/20"
    },
    {
      id: "feat-cross",
      title: "Cross-Platform Access",
      description: "Maintain fluid context between devices with individual standalone clients optimized for Windows and Android operating systems.",
      status: "active" as const,
      icon: Smartphone,
      accent: "text-amber-400"
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen relative font-sans flex flex-col justify-between overflow-x-hidden selection:bg-amber-400 selection:text-black" id="landing-root">
      
      {/* Background Micro Dots representing Nothing style */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      
      {/* Interactive sleek top line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent w-full opacity-60" />

      {/* Header element */}
      <header className="border-b border-white/10 py-5 px-6 md:px-12 backdrop-blur-md sticky top-0 z-40 bg-black/80" id="landing-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <Logo size={36} animate={true} />
            <span className="font-mono text-xl tracking-widest font-semibold text-white">APOLLO <span className="text-amber-400">AI</span></span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-amber-400/30 bg-amber-400/5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Alpha Beta Sandbox
            </span>
            <a 
              href="#sandbox-gate" 
              className="font-mono text-xs text-black bg-amber-400 hover:bg-amber-300 font-semibold px-4.5 py-1.8 rounded transition-all duration-300 flex items-center gap-2 "
              id="header-cta"
            >
              Access Engine
              <ArrowRight size={14} />
            </a>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow pt-16 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center relative z-10" id="landing-hero-container">
        
        {/* Animated main branding shield */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center text-center max-w-3xl mb-16"
        >
          {/* Hero Big Logo */}
          <div className="mb-8 p-1 rounded-full border border-white/10 bg-white/5 relative z-10">
            <Logo size={110} animate={true} />
          </div>

          <span className="font-mono text-xs tracking-widest text-amber-400 uppercase font-semibold border border-amber-400/30 px-3.5 py-1 rounded-full bg-amber-400/5 mb-5 select-none-all">
            INTELLIGENCE OF THE NEXT ERA
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight md:leading-tight text-white mb-6" id="landing-headline">
            Intelligence That <br/>
            <span className="text-amber-400 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Gets Things Done</span>
          </h1>

          <p className="text-base md:text-xl text-neutral-400 leading-relaxed mb-10 max-w-2xl">
            Apollo AI fuses deep generative reasoning, seamless text-to-speech synchronization, and robust physical platform accessibility into a timeless minimalist client. High precision, zero visual noise, extreme response rates.
          </p>

          {/* Button grid (Windows / Android) */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            
            {/* Windows Download */}
            <button 
              className="group relative inline-flex items-center justify-center gap-3 bg-[#0a0a0a] border border-white/20 hover:border-amber-400/50 rounded-xl px-7 py-4 text-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,212,0,0.15)] overflow-hidden cursor-not-allowed"
              onClick={() => alert("Windows standalone beta app binary compilation completed. Downloads will be enabled in release stage.")}
              id="download-windows"
            >
              <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-amber-400/[0.02] transition-all" />
              <Monitor size={18} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">Download for</div>
                <div className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">Windows Beta</div>
              </div>
            </button>

            {/* Android Download */}
            <button 
              className="group relative inline-flex items-center justify-center gap-3 bg-[#0a0a0a] border border-white/20 hover:border-amber-400/50 rounded-xl px-7 py-4 text-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,212,0,0.15)] overflow-hidden cursor-not-allowed"
              onClick={() => alert("Android build package package generation completed. APK installer links will be made active soon.")}
              id="download-android"
            >
              <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-amber-400/[0.02] transition-all" />
              <Smartphone size={18} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">Download for</div>
                <div className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">Android client</div>
              </div>
            </button>

          </div>
        </motion.div>

        {/* Beta Gatekeeper segment */}
        <section className="w-full max-w-xl border border-white/10 rounded-2xl p-6 md:p-8 bg-[#0a0a0a] relative mb-24 hover:border-amber-400/30 transition-all duration-500 shadow-xl" id="sandbox-gate">
          
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 bg-amber-400 text-black text-xs font-mono px-2.5 py-0.5 rounded uppercase font-bold tracking-widest pointer-events-none select-none">
            Demo Portal
          </div>

          <div className="flex items-center gap-3.5 mb-5 border-b border-white/5 pb-4">
            <div className="p-2 border border-amber-400/20 rounded bg-amber-400/5 text-amber-400">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-mono tracking-wide font-bold">ALPHA SANDBOX ENTRY</h2>
              <p className="text-xs text-neutral-400">Authenticating authorized development beta engineers</p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4" id="beta-validation-form">
            <div className="relative">
              <input 
                type="text" 
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setVerificationMessage(null);
                }}
                placeholder="ENTER ACCESS KEY (E.G. APOLLO-BETA)" 
                className="w-full bg-black/80 border border-white/10 hover:border-white/20 focus:border-amber-400 rounded-xl px-4 py-3.5 text-center font-mono tracking-widest text-amber-400 uppercase text-sm font-semibold placeholder:text-neutral-600 focus:outline-none transition-all"
                disabled={isValidating || isUnlocked}
                id="access-code-input"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={autofillCode}
                className="flex-shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 font-mono text-xs rounded-xl px-4 py-3 transition-colors flex items-center gap-1.5"
                disabled={isValidating || isUnlocked}
                id="autofill-btn"
                title="Populate authorized key value"
              >
                Autofill Key Key
              </button>

              <button
                type="submit"
                className={`flex-grow bg-amber-400 hover:bg-amber-300 text-black font-semibold font-mono rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2 ${
                  (isValidating || isUnlocked) ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isValidating || !accessCode.trim() || isUnlocked}
                id="submit-beta-code"
              >
                {isValidating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Validating...
                  </>
                ) : isUnlocked ? (
                  <>
                    <Unlock size={16} />
                    Granted
                  </>
                ) : (
                  <>
                    Unlock Console
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feedback response */}
          {verificationMessage && (
            <div 
              className={`mt-4 p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 transition-all animate-fadeIn ${
                isError 
                  ? "bg-red-950/30 border-red-500/30 text-red-400" 
                  : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
              }`}
              id="verification-feedback"
            >
              {isError ? <XCircle size={16} className="mt-0.5 flex-shrink-0" /> : <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />}
              <div>
                <p className="font-semibold uppercase">{isError ? "Verification Failed" : "Verification Succeeded"}</p>
                <p className="mt-0.5 text-neutral-300">{verificationMessage}</p>
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1">
              <Shield size={12} className="text-amber-400" />
              Secure Socket TLS
            </span>
            <span>Key Provider: Local DB</span>
          </div>

        </section>

        {/* Feature Grid Section (Bento Grid) */}
        <section className="w-full relative py-8" id="landing-features">
          
          <div className="text-center md:text-left mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xs uppercase font-mono tracking-widest text-amber-400 mb-2">Engine Architecture</h2>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Apollo Module Capabilities</h3>
            </div>
            <p className="text-xs text-neutral-500 font-mono border border-white/10 rounded-full px-4 py-1 bg-white/5 w-fit mx-auto md:mx-0">
              Platform Status: Ver 1.4.2 [Stably Bound]
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="features-grid">
            {features.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div 
                  key={feat.id}
                  className={`group relative border rounded-2xl p-6 bg-[#070707] transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                    feat.status === 'active' 
                      ? "border-white/10 hover:border-amber-400/30 hover:shadow-[0_0_20px_rgba(255,212,0,0.05)]" 
                      : feat.status === 'soon'
                        ? "border-amber-400/25 border-dashed"
                        : "border-white/5 opacity-55"
                  }`}
                  id={feat.id}
                >
                  
                  {/* Subtle Background Icon Masking */}
                  <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-white/[0.015] group-hover:text-amber-400/[0.012] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">
                    <IconComp size={160} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-2.5 rounded-xl border ${
                        feat.status === 'active' 
                          ? "border-white/10 bg-white/5 text-white group-hover:bg-amber-400/10 group-hover:border-amber-400/30 group-hover:text-amber-400" 
                          : feat.status === 'soon'
                            ? "border-amber-400/20 bg-amber-400/5 text-amber-400"
                            : "border-white/5 bg-white/[0.01] text-white/20"
                      } transition-colors`}>
                        <IconComp size={20} />
                      </div>
                      
                      {/* Interactive badge indicators */}
                      {feat.status === 'active' && (
                        <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full select-none">
                          Core Ready
                        </span>
                      )}
                      {feat.status === 'soon' && (
                        <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full select-none animate-pulse">
                          COMING SOON
                        </span>
                      )}
                      {feat.status === 'future' && (
                        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full select-none">
                          Future build
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold tracking-tight mb-2 group-hover:text-amber-400 transition-colors">
                      {feat.title}
                    </h4>
                    
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  {/* Micro aesthetic element at bottom of active items */}
                  {feat.status === 'active' && (
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-500 group-hover:text-neutral-400 transition-colors">
                      <span>Status: ONLINE</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  )}
                  {feat.status === 'soon' && (
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-amber-500/60">
                      <span className="flex items-center gap-1"><Clock size={10} /> Q3 2026 Core Release</span>
                    </div>
                  )}
                  {feat.status === 'future' && (
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-none text-[11px] font-mono text-neutral-600">
                      <span>Device integration layer</span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </section>

        {/* Coming Soon public segment */}
        <section className="w-full mt-24 text-center py-12 px-6 border border-white/5 rounded-3xl bg-[linear-gradient(180deg,#040404_0%,#000000_100%)] relative overflow-hidden" id="beta-coming-soon">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-400/5 rounded-full blur-[100px] pointer-events-none" />
          <h3 className="text-xl font-mono tracking-widest text-neutral-400 uppercase mb-3">Community Expansion</h3>
          <h4 className="text-3xl font-extrabold text-white mb-4">Apollo Public Beta Testing</h4>
          <p className="text-neutral-400 max-w-lg mx-auto text-sm leading-relaxed mb-6">
            Public node registrations will start in autumn. Early contributors and beta-code testers maintain permanent alpha console access. Submitting diagnostic telemetry is highly recommended.
          </p>
          <div className="inline-flex items-center gap-4 text-xs font-mono text-amber-400" id="telemetry-log">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> SECURE CONSOLE ENGINE</span>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1" onClick={() => alert("Telemetry diagnostics currently writing safely to local node logs.")}>View Sandbox Logs <ExternalLink size={10} /></span>
          </div>
        </section>

      </main>

      {/* Footer Element */}
      <footer className="border-t border-white/10 py-10 px-6 backdrop-blur-md bg-black/90 relative z-10" id="landing-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-mono text-sm tracking-widest font-semibold">APOLLO <span className="text-amber-400">AI</span></span>
            <span className="text-[10px] font-mono text-neutral-600 border border-white/5 px-2 py-0.5 rounded bg-white/[0.01] ml-2">v1.4</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs text-neutral-500">
            <a 
              href="#landing-root" 
              className="hover:text-amber-400 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                alert("Apollo AI privacy guarantees: All sandbox logs are local, keys remain private, Gemini telemetry uses aistudio-build header.");
              }}
            >
              Privacy Policy
            </a>
            <a 
              href="#landing-root" 
              className="hover:text-amber-400 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                alert("Nothing/Apple aesthetic reference. Absolute clean code guidelines respected.");
              }}
            >
              System Terms
            </a>
            <a href="mailto:johnchristianorozario@gmail.com" className="hover:text-amber-400 transition-colors flex items-center gap-1">Contact Dev</a>
          </div>

          <div className="text-xs font-mono text-neutral-600 tracking-wide text-center md:text-right">
            &copy; {new Date().getFullYear()} Apollo AI Inc. Inspired by Apple & Nothing.
          </div>
        </div>
      </footer>
      
    </div>
  );
}
