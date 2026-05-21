'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, BrainCircuit, CheckCircle2, XCircle, Mic, MicOff, RadioReceiver, PhoneOff } from 'lucide-react';
import { useLiveAPI } from '@/hooks/use-live-api';

export default function CommOSDashboard() {
  const [activeTab, setActiveTab] = useState('preflight');
  const [logs, setLogs] = useState<any[]>([]);

  // Pre-Flight State
  const [randomScenario, setRandomScenario] = useState('');
  
  // Live Session State
  const { connect, disconnect, isConnected, isConnecting, transcript, errorMsg } = useLiveAPI();

  const fetchLogs = async () => {
    const res = await fetch('/api/logs');
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const generatePreFlightScenario = () => {
    const scenarios = [
      "Explaining the RAG pipeline to a non-technical stakeholder",
      "MBA case study mock debate on market entry",
      "Updating an executive on a delayed project deliverable",
      "Pitching a complex architectural change to the product team",
      "Justifying a budget increase for cloud infrastructure"
    ];
    setRandomScenario(scenarios[Math.floor(Math.random() * scenarios.length)]);
  };

  const handleSaveSession = async () => {
    // In a real app we'd save the full transcript and scores to the /api/logs endpoint here
    alert("Session saved to Neon DB!");
    setActiveTab('analytics');
    fetchLogs();
  };

  return (
    <div className="min-h-screen bg-[#020817] text-foreground p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        <div className="space-y-3 text-center md:text-left">
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-200">
            Comm-OS
          </h1>
          <p className="text-muted-foreground text-lg font-light tracking-wide">
            Strategic Communication Transition Tracker
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md h-12">
            <TabsTrigger value="preflight" className="rounded-lg data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-100 transition-all font-medium">Pre-Flight</TabsTrigger>
            <TabsTrigger value="live" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-100 transition-all font-medium">Live Coach</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-100 transition-all font-medium">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preflight" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-blue-400" />
                  Morning Pre-Flight
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">Warm up your executive communication muscle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-xl shadow-inner">
                  <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                    🎯 Focus of the Week
                  </h3>
                  <p className="text-blue-100/80 leading-relaxed text-sm md:text-base">
                    Days 1-10: Awareness & The Pause. Don't worry about perfect structure yet. Your only metric of success is forcing a 3-second pause before speaking.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <Button onClick={generatePreFlightScenario} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all rounded-lg font-medium">
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Generate Random Scenario
                  </Button>
                  
                  {randomScenario && (
                    <div className="p-8 bg-white/5 rounded-2xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500"></div>
                      <p className="text-xl md:text-2xl font-medium text-white mb-6 leading-tight">
                        "{randomScenario}"
                      </p>
                      <div className="flex items-center space-x-3 text-sm text-blue-200/70 bg-blue-950/30 w-max px-4 py-2 rounded-full border border-blue-900/50">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                        <span className="font-medium tracking-wide uppercase text-xs">Practice out loud. Pause for 3 seconds. Deliver the BLUF.</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="live" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <RadioReceiver className="w-6 h-6 text-purple-400" />
                  Live Acoustic Coaching
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">Speak naturally. The coach will analyze your tone, hesitations, and structure in real-time.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                <div className="flex justify-center py-6">
                  {!isConnected ? (
                    <div className="flex flex-col items-center gap-4">
                      <Button 
                        onClick={connect} 
                        disabled={isConnecting}
                        className="h-16 px-8 text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/40 rounded-full transition-all hover:scale-105"
                      >
                        {isConnecting ? (
                          <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" /> Connecting to Gemini Live WSS...</span>
                        ) : (
                          <span className="flex items-center gap-2"><Mic className="w-6 h-6" /> Start Live Audio Session</span>
                        )}
                      </Button>
                      {errorMsg && (
                        <div className="text-red-400 text-sm font-medium bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                          {errorMsg}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button 
                      onClick={disconnect}
                      variant="destructive"
                      className="h-16 px-8 text-lg font-bold bg-red-600/80 hover:bg-red-500 shadow-lg shadow-red-900/40 rounded-full transition-all hover:scale-105 animate-pulse"
                    >
                      <PhoneOff className="w-6 h-6 mr-2" /> End Session
                    </Button>
                  )}
                </div>

                <div className="bg-black/30 border border-white/10 p-6 rounded-2xl min-h-[300px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all pointer-events-none"></div>
                  <h4 className="text-purple-400 font-semibold tracking-wide uppercase text-xs mb-4 flex items-center gap-2">
                    <RadioReceiver className="w-4 h-4"/> Live Transcript & Acoustic Critique
                  </h4>
                  <div className="text-white/80 whitespace-pre-wrap leading-relaxed text-lg max-h-[300px] overflow-y-auto pr-4 custom-scrollbar font-mono">
                    {transcript ? transcript : (
                      <span className="text-slate-600 italic font-sans flex items-center gap-3">
                        {isConnected ? (
                          <>
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                            </span>
                            Listening via PCM Web Socket... Start speaking.
                          </>
                        ) : "Connect to start the session."}
                      </span>
                    )}
                  </div>
                </div>

              </CardContent>
              <CardFooter className="pt-2">
                <Button onClick={handleSaveSession} className="w-full h-14 bg-white/10 text-white hover:bg-white/20 font-semibold text-lg shadow-xl border border-white/10 transition-all" disabled={!isConnected && !transcript}>Save Session to Neon DB</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight text-white">Communication Logs</CardTitle>
                <CardDescription className="text-slate-400 text-base">Review your past iterations and measure growth.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="text-center py-16 bg-black/20 rounded-xl border border-white/5 border-dashed">
                      <p className="text-slate-500 text-lg">No logs yet.</p>
                      <p className="text-slate-600 text-sm mt-1">Complete a debrief to start tracking.</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="p-5 border border-white/10 rounded-xl bg-black/20 flex flex-col space-y-4 hover:bg-black/40 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-semibold text-white text-lg leading-tight">{log.scenario}</h4>
                          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full font-medium shrink-0 shadow-inner">
                            Pressure: {log.pressureLevel}/5
                          </span>
                        </div>
                        <div className="flex space-x-6 text-sm">
                          <span className={`flex items-center gap-1.5 font-medium ${log.blufScore ? 'text-emerald-400' : 'text-red-400'}`}>
                            {log.blufScore ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>} BLUF
                          </span>
                          <span className={`flex items-center gap-1.5 font-medium ${log.ruleOf3Score ? 'text-emerald-400' : 'text-red-400'}`}>
                            {log.ruleOf3Score ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>} Rule of 3
                          </span>
                        </div>
                        {log.idealRewrite && (
                          <div className="mt-4 text-sm bg-blue-950/20 p-4 rounded-lg text-slate-300 border border-blue-900/30">
                            <strong className="text-blue-300/80 uppercase text-xs tracking-wider block mb-2">Ideal Executive Version</strong>
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
