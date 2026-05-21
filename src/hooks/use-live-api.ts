'use client';

import { useState, useRef, useCallback } from 'react';

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  
  const nextPlayTimeRef = useRef<number>(0);

  // Robust base64 encoding to avoid Maximum Call Stack Size Exceeded
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/live-setup');
      const { apiKey, systemInstruction, error } = await res.json();
      
      if (error || !apiKey) {
        throw new Error(error || "No API key returned from setup.");
      }

      const model = 'models/gemini-2.0-flash-exp';
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          // 1. Send Setup Message
          ws.send(JSON.stringify({
            setup: {
              model,
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              }
            }
          }));

          // 2. Start Audio Capture
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          audioContextRef.current = audioCtx;
          
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          
          source.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }
            const base64 = arrayBufferToBase64(pcm16.buffer);
            ws.send(JSON.stringify({
              clientContent: {
                turns: [
                  {
                    role: "user",
                    parts: [{ inlineData: { mimeType: "audio/pcm;rate=16000", data: base64 } }]
                  }
                ],
                turnComplete: true
              }
            }));
          };
          
          // Wait, Gemini Live API requires `realtimeInput` for streaming audio, NOT clientContent.
          // Let's rewrite the onaudioprocess to send realtimeInput.
          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }
            const base64 = arrayBufferToBase64(pcm16.buffer);
            ws.send(JSON.stringify({
              realtimeInput: {
                mediaChunks: [{
                  mimeType: "audio/pcm;rate=16000",
                  data: base64
                }]
              }
            }));
          };

          const pbCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          playbackContextRef.current = pbCtx;
          nextPlayTimeRef.current = 0;

          setIsConnected(true);
          setIsConnecting(false);
        } catch (mediaErr: any) {
          setErrorMsg("Mic Error: " + mediaErr.message);
          setIsConnecting(false);
          ws.close();
        }
      };

      ws.onmessage = (e) => {
        if (e.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => handleMessage(reader.result as string);
          reader.readAsText(e.data);
        } else {
          handleMessage(e.data);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket Error:", e);
        setErrorMsg("WebSocket connection error. Check API key and model name.");
      };

      ws.onclose = (e) => {
        console.log("WebSocket Closed:", e.code, e.reason);
        if (e.code !== 1000) {
          setErrorMsg(`Disconnected: ${e.reason || e.code}`);
        }
        disconnect();
      };
      
    } catch (err: any) {
      console.error('Failed to connect:', err);
      setErrorMsg(err.message || 'Failed to connect');
      setIsConnecting(false);
    }
  }, []);

  const handleMessage = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      
      // Handle Audio playback
      if (data.serverContent?.modelTurn?.parts) {
        for (const part of data.serverContent.modelTurn.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
            playAudioData(part.inlineData.data);
          }
          if (part.text) {
            setTranscript(prev => prev + part.text);
          }
        }
      }
    } catch (e) {
      console.error("Error parsing message", e);
    }
  };

  const playAudioData = (base64Str: string) => {
    const pbCtx = playbackContextRef.current;
    if (!pbCtx) return;

    const binaryString = atob(base64Str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert 16-bit PCM bytes to Float32
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 0x7FFF;
    }

    const audioBuffer = pbCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = pbCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(pbCtx.destination);

    // Schedule playback seamlessly
    const currentTime = pbCtx.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  };

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);
    
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Reset refs
    wsRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    processorRef.current = null;
    playbackContextRef.current = null;
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    transcript,
    errorMsg
  };
}
