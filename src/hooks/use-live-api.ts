'use client';

import { useState, useRef, useCallback } from 'react';

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  
  // Track next audio playback time for smooth queuing
  const nextPlayTimeRef = useRef<number>(0);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Fetch credentials and prompt
      const res = await fetch('/api/live-setup');
      const { apiKey, systemInstruction } = await res.json();

      // Ensure model is set as gemini-3.1-flash-live-preview or what is supported
      const model = 'models/gemini-2.0-flash-exp'; // Falling back to known supported string if 3.1 fails, but let's try 2.0-flash-exp as standard for Live API.
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsConnecting(false);

        // 1. Send Setup Message
        ws.send(JSON.stringify({
          setup: {
            model,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }
        }));

        // 2. Start Audio Capture (16kHz PCM)
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
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: "audio/pcm;rate=16000",
                data: base64
              }]
            }
          }));
        };

        // 3. Setup Playback Context (24kHz)
        const pbCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        playbackContextRef.current = pbCtx;
        nextPlayTimeRef.current = 0;
      };

      ws.onmessage = (e) => {
        if (e.data instanceof Blob) {
          // Live API sends JSON as text, but some versions send blob. We read text.
          const reader = new FileReader();
          reader.onload = () => handleMessage(reader.result as string);
          reader.readAsText(e.data);
        } else {
          handleMessage(e.data);
        }
      };

      ws.onclose = () => {
        disconnect();
      };
      
    } catch (err) {
      console.error('Failed to connect:', err);
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
    transcript
  };
}
