'use client';

import { useState, useRef } from 'react';

type ServerMessage = {
  serverContent?: {
    modelTurn?: {
      parts: Array<{
        inlineData?: { mimeType: string; data: string };
        text?: string;
      }>;
    };
  };
};

type SetupResponse = {
  apiKey?: string;
  systemInstruction?: string;
  error?: string;
};

const MODEL = 'models/gemini-3.1-flash-live-preview';
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const playAudioData = (base64Str: string) => {
    const pbCtx = playbackContextRef.current;
    if (!pbCtx) return;

    const binaryString = atob(base64Str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

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

    const currentTime = pbCtx.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  };

  const handleMessage = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr) as ServerMessage;
      if (data.serverContent?.modelTurn?.parts) {
        for (const part of data.serverContent.modelTurn.parts) {
          if (part.inlineData?.mimeType.startsWith('audio/pcm')) {
            playAudioData(part.inlineData.data);
          }
          if (part.text) {
            setTranscript(prev => prev + part.text);
          }
        }
      }
    } catch (e) {
      console.error('Error parsing message', e);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsConnecting(false);

    workletNodeRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    playbackContextRef.current?.close();
    wsRef.current?.close();

    wsRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    workletNodeRef.current = null;
    playbackContextRef.current = null;
  };

  const connect = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/live-setup');
      const { apiKey, systemInstruction, error } = await res.json() as SetupResponse;

      if (error || !apiKey) {
        throw new Error(error ?? 'No API key returned from setup.');
      }

      const ws = new WebSocket(`${WS_BASE}?key=${apiKey}`);
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          // Send config with updated key name, model, and response modalities
          ws.send(JSON.stringify({
            config: {
              model: MODEL,
              responseModalities: ['AUDIO'],
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
            },
          }));

          const AudioCtx = window.AudioContext ??
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

          const audioCtx = new AudioCtx({ sampleRate: 16000 });
          audioContextRef.current = audioCtx;

          // Load AudioWorklet module (replaces deprecated ScriptProcessorNode)
          await audioCtx.audioWorklet.addModule('/pcm-processor.js');

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const source = audioCtx.createMediaStreamSource(stream);
          const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor');
          workletNodeRef.current = workletNode;

          workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const float32 = e.data;
            const pcm16 = new Int16Array(float32.length);
            for (let i = 0; i < float32.length; i++) {
              pcm16[i] = Math.max(-1, Math.min(1, float32[i])) * 0x7FFF;
            }
            ws.send(JSON.stringify({
              realtimeInput: {
                mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: arrayBufferToBase64(pcm16.buffer) }],
              },
            }));
          };

          // Silent gain keeps the audio graph active without mic playback
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;
          source.connect(workletNode);
          workletNode.connect(silentGain);
          silentGain.connect(audioCtx.destination);

          // Guard: server may have rejected the setup and closed the socket
          // while getUserMedia / worklet setup was running
          if (ws.readyState !== WebSocket.OPEN) {
            disconnect();
            return;
          }

          const pbCtx = new AudioCtx({ sampleRate: 24000 });
          playbackContextRef.current = pbCtx;
          nextPlayTimeRef.current = 0;

          setIsConnected(true);
          setIsConnecting(false);
        } catch (mediaErr: unknown) {
          const message = mediaErr instanceof Error ? mediaErr.message : 'Unknown microphone error';
          setErrorMsg('Mic Error: ' + message);
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
          handleMessage(e.data as string);
        }
      };

      ws.onerror = () => {
        setErrorMsg('WebSocket connection error. Check API key and network.');
      };

      ws.onclose = (e) => {
        if (e.code !== 1000) {
          setErrorMsg(`Disconnected: ${e.reason || e.code}`);
        }
        disconnect();
      };

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setErrorMsg(message);
      setIsConnecting(false);
    }
  };

  const clearError = () => setErrorMsg('');

  return { connect, disconnect, isConnected, isConnecting, transcript, errorMsg, clearError };
}
