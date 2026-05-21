'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  RefreshCw, BrainCircuit, CheckCircle2, XCircle,
  Mic, RadioReceiver, PhoneOff, BarChart2, X,
  Save, Loader2,
} from 'lucide-react';
import { useLiveAPI } from '@/hooks/use-live-api';
import type { CommunicationLog } from '@/types';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const SCENARIOS = [
  'Explaining the RAG pipeline to a non-technical stakeholder',
  'MBA case study mock debate on market entry',
  'Updating an executive on a delayed project deliverable',
  'Pitching a complex architectural change to the product team',
  'Justifying a budget increase for cloud infrastructure',
];

export default function CommOSDashboard() {
  const [activeTab, setActiveTab] = useState('preflight');
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [activeScenario, setActiveScenario] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const { connect, disconnect, isConnected, isConnecting, transcript, errorMsg, clearError } = useLiveAPI();

  // Initial log fetch — uses .then() to keep setState out of the effect body
  useEffect(() => {
    fetch('/api/logs')
      .then(res => res.ok ? res.json() as Promise<CommunicationLog[]> : Promise.resolve([]))
      .then(data => {
        setLogs(data);
        setIsLoadingLogs(false);
      })
      .catch(() => setIsLoadingLogs(false));
  }, []);

  const refreshLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) setLogs(await res.json() as CommunicationLog[]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const generatePreFlightScenario = () => {
    const next = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    setActiveScenario(next);
  };

  const handleSaveSession = async () => {
    if (!transcript.trim()) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: activeScenario || 'Live Coaching Session',
          pressureLevel: 3,
          blufScore: false,
          ruleOf3Score: false,
          idealRewrite: transcript,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('success');
      await refreshLogs();
      setTimeout(() => {
        setSaveStatus('idle');
        setActiveTab('analytics');
      }, 1200);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-foreground p-6 md:p-10 font-sans relative overflow-hidden">

      {/* Ambient background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/25 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-purple-900/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-cyan-400 to-emerald-300">
              Comm-OS
            </h1>
            <p className="text-slate-400 text-base font-light tracking-wide">
              Strategic Communication Transition Tracker
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl transition-all shrink-0"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md h-12">
            <TabsTrigger
              value="preflight"
              className="rounded-lg data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-100 text-slate-400 transition-all font-medium text-sm"
            >
              Pre-Flight
            </TabsTrigger>
            <TabsTrigger
              value="live"
              className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-100 text-slate-400 transition-all font-medium text-sm"
            >
              Live Coach
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-100 text-slate-400 transition-all font-medium text-sm"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ── Pre-Flight ─────────────────────────────────────── */}
          <TabsContent value="preflight" className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <Card className="bg-white/4 border-white/10 backdrop-blur-2xl shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <RefreshCw className="w-5 h-5 text-blue-400" />
                  Morning Pre-Flight
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Warm up your executive communication muscle before going live.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-500/8 border border-blue-500/20 p-5 rounded-xl">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Focus of the Week</p>
                  <p className="text-blue-100/80 leading-relaxed text-sm">
                    Days 1–10: Awareness &amp; The Pause. Don&apos;t worry about perfect structure yet.
                    Your only metric of success is forcing a 3-second pause before speaking.
                  </p>
                </div>

                <div className="space-y-5">
                  <Button
                    onClick={generatePreFlightScenario}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition-all rounded-xl font-semibold"
                  >
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Generate Scenario
                  </Button>

                  {activeScenario && (
                    <div className="p-7 bg-white/3 rounded-2xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-0.5 h-full bg-linear-to-b from-blue-400 to-purple-500 rounded-full" />
                      <p className="text-xl font-semibold text-white mb-5 leading-snug pl-1">
                        &ldquo;{activeScenario}&rdquo;
                      </p>
                      <div className="flex items-center gap-2.5 text-blue-200/60 bg-blue-950/40 w-max px-4 py-2 rounded-full border border-blue-900/40">
                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                        <span className="font-medium tracking-wide uppercase text-[11px]">
                          Pause 3 sec · Deliver the BLUF
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Live Coach ─────────────────────────────────────── */}
          <TabsContent value="live" className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <Card className="bg-white/4 border-white/10 backdrop-blur-2xl shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <RadioReceiver className="w-5 h-5 text-purple-400" />
                  Live Acoustic Coaching
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Speak naturally. The coach analyzes your tone, hesitations, and structure in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Error banner */}
                {errorMsg && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl animate-in fade-in duration-200">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1">{errorMsg}</span>
                    <button onClick={clearError} className="shrink-0 hover:text-red-300 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Connect / Disconnect */}
                <div className="flex justify-center py-4">
                  {!isConnected ? (
                    <Button
                      onClick={connect}
                      disabled={isConnecting}
                      className="h-14 px-10 text-base font-bold bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/30 rounded-full transition-all hover:scale-[1.03] disabled:opacity-60 disabled:scale-100"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2.5 animate-spin" />
                          Connecting…
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2.5" />
                          Start Live Session
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={disconnect}
                      variant="destructive"
                      className="h-14 px-10 text-base font-bold bg-red-600/80 hover:bg-red-500 shadow-lg shadow-red-900/30 rounded-full transition-all hover:scale-[1.03]"
                    >
                      <PhoneOff className="w-5 h-5 mr-2.5" />
                      End Session
                    </Button>
                  )}
                </div>

                {/* Transcript pane */}
                <div className="bg-black/25 border border-white/10 p-6 rounded-2xl min-h-70 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-purple-400 font-semibold tracking-widest uppercase text-[11px] flex items-center gap-2">
                      <RadioReceiver className="w-3.5 h-3.5" />
                      Transcript &amp; Critique
                    </span>
                    {transcript && (
                      <span className="text-[11px] text-slate-600">
                        {transcript.split(/\s+/).filter(Boolean).length} words
                      </span>
                    )}
                  </div>
                  <div className="text-white/75 whitespace-pre-wrap leading-relaxed text-[15px] max-h-65 overflow-y-auto pr-2 custom-scrollbar font-mono">
                    {transcript || (
                      <span className="text-slate-600 italic font-sans flex items-center gap-3">
                        {isConnected ? (
                          <>
                            <span className="relative flex h-3 w-3 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
                            </span>
                            Listening… start speaking.
                          </>
                        ) : 'Connect to start the session.'}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-6 px-6">
                <Button
                  onClick={handleSaveSession}
                  disabled={!transcript.trim() || saveStatus === 'saving'}
                  className={`w-full h-12 font-semibold text-sm rounded-xl border transition-all ${
                    saveStatus === 'success'
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 cursor-default'
                      : saveStatus === 'error'
                      ? 'bg-red-500/20 border-red-500/30 text-red-300 cursor-default'
                      : 'bg-white/6 hover:bg-white/10 text-white border-white/10 shadow-inner'
                  }`}
                >
                  {saveStatus === 'saving' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {saveStatus === 'success' && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {saveStatus === 'error' && <XCircle className="w-4 h-4 mr-2" />}
                  {saveStatus === 'idle' && <Save className="w-4 h-4 mr-2" />}
                  {saveStatus === 'saving' ? 'Saving…'
                    : saveStatus === 'success' ? 'Saved — redirecting…'
                    : saveStatus === 'error' ? 'Save failed — try again'
                    : 'Save Session to Analytics'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ── Analytics ──────────────────────────────────────── */}
          <TabsContent value="analytics" className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <Card className="bg-white/4 border-white/10 backdrop-blur-2xl shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-white">
                      Communication Logs
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      Review past iterations and measure growth.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={refreshLogs}
                    disabled={isLoadingLogs}
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoadingLogs ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-5 border border-white/10 rounded-xl bg-white/2 animate-pulse">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div className="h-4 bg-white/10 rounded-md w-3/5" />
                          <div className="h-5 bg-white/10 rounded-full w-20" />
                        </div>
                        <div className="flex gap-4">
                          <div className="h-3.5 bg-white/10 rounded w-14" />
                          <div className="h-3.5 bg-white/10 rounded w-16" />
                        </div>
                      </div>
                    ))
                  ) : logs.length === 0 ? (
                    <div className="text-center py-16 bg-black/15 rounded-2xl border border-white/6 border-dashed">
                      <p className="text-slate-500 font-medium">No sessions logged yet.</p>
                      <p className="text-slate-600 text-sm mt-1.5">
                        Complete a live coaching session and save it to begin tracking.
                      </p>
                    </div>
                  ) : (
                    logs.map(log => (
                      <div
                        key={log.id}
                        className="p-5 border border-white/10 rounded-xl bg-black/15 hover:bg-black/30 transition-colors duration-200 group"
                      >
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <h4 className="font-semibold text-white text-sm leading-snug">{log.scenario}</h4>
                          <span className="text-[11px] bg-white/8 text-slate-400 px-2.5 py-1 rounded-full font-medium shrink-0 border border-white/10">
                            Pressure {log.pressureLevel}/5
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <ScoreBadge label="BLUF" pass={log.blufScore} />
                          <ScoreBadge label="Rule of 3" pass={log.ruleOf3Score} />
                        </div>
                        {log.idealRewrite && (
                          <div className="mt-4 text-sm bg-blue-950/20 p-4 rounded-xl text-slate-300 border border-blue-900/20">
                            <strong className="text-blue-400/70 uppercase text-[11px] tracking-widest block mb-2">
                              Ideal Executive Version
                            </strong>
                            <span className="whitespace-pre-wrap leading-relaxed">{log.idealRewrite}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ScoreBadge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 font-medium ${pass ? 'text-emerald-400' : 'text-red-400'}`}>
      {pass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}
