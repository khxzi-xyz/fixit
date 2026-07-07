/**
 * VoiceNote.tsx
 *
 * WhatsApp-style voice note recorder using @capgo/capacitor-audio-recorder.
 * - Hold/tap "Record" to start
 * - Tap "Stop" to finish
 * - Animated waveform while recording
 * - Playback bar with duration
 * - Returns the audio base64 data via onRecorded callback
 *
 * Falls back to browser MediaRecorder on web platforms.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Mic, Square, Play, Pause, Trash2, Send } from "lucide-react";

interface VoiceNoteProps {
  /** Called with base64 audio data + mimeType when recording is complete */
  onRecorded?: (data: string, mimeType: string, durationMs: number) => void;
  /** Called when the user confirms and sends the note */
  onSend?: (data: string, mimeType: string, durationMs: number) => void;
  className?: string;
}

type RecordState = "idle" | "recording" | "recorded" | "playing";

export function VoiceNote({ onRecorded, onSend, className = "" }: VoiceNoteProps) {
  const [state, setState] = useState<RecordState>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("audio/aac");
  const [waveform, setWaveform] = useState<number[]>([]);

  // Timers / refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web MediaRecorder fallback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (waveTimerRef.current) { clearInterval(waveTimerRef.current); waveTimerRef.current = null; }
  };

  const animateWaveform = () => {
    waveTimerRef.current = setInterval(() => {
      setWaveform(Array.from({ length: 24 }, () => 4 + Math.random() * 28));
    }, 120);
  };

  // ── Native recording ─────────────────────────────────────────────────────────
  const startNative = useCallback(async () => {
    try {
      const { CapacitorAudioRecorder } = await import("@capgo/capacitor-audio-recorder");
      await CapacitorAudioRecorder.requestPermission();
      await CapacitorAudioRecorder.startRecording();
      setState("recording");
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setDurationMs(Date.now() - startTimeRef.current), 100);
      animateWaveform();
    } catch (err) {
      console.error("[VoiceNote] startNative error:", err);
    }
  }, []);

  const stopNative = useCallback(async () => {
    stopTimers();
    try {
      const { CapacitorAudioRecorder } = await import("@capgo/capacitor-audio-recorder");
      const result = await CapacitorAudioRecorder.stopRecording();
      const elapsed = Date.now() - startTimeRef.current;
      setDurationMs(elapsed);
      const data = result?.value || result?.recordDataBase64 || "";
      setAudioData(data);
      setMimeType("audio/aac");
      setState("recorded");
      onRecorded?.(data, "audio/aac", elapsed);
    } catch (err) {
      console.error("[VoiceNote] stopNative error:", err);
      setState("idle");
    }
  }, [onRecorded]);

  // ── Web recording ─────────────────────────────────────────────────────────────
  const startWeb = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = String(reader.result).split(",")[1] || "";
          const elapsed = Date.now() - startTimeRef.current;
          setAudioData(b64);
          setMimeType(mime);
          setDurationMs(elapsed);
          setState("recorded");
          onRecorded?.(b64, mime, elapsed);
        };
        reader.readAsDataURL(blob);
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setState("recording");
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setDurationMs(Date.now() - startTimeRef.current), 100);
      animateWaveform();
    } catch (err) {
      console.error("[VoiceNote] startWeb error:", err);
    }
  }, [onRecorded]);

  const stopWeb = useCallback(() => {
    stopTimers();
    mediaRecorderRef.current?.stop();
  }, []);

  // ── Public controls ───────────────────────────────────────────────────────────
  const handleRecord = () => {
    if (Capacitor.isNativePlatform()) startNative();
    else startWeb();
  };

  const handleStop = () => {
    if (Capacitor.isNativePlatform()) stopNative();
    else stopWeb();
  };

  const handlePlay = () => {
    if (!audioData) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setState("recorded");
      return;
    }
    const src = `data:${mimeType};base64,${audioData}`;
    const a = new Audio(src);
    audioRef.current = a;
    setState("playing");
    a.play();
    a.onended = () => { audioRef.current = null; setState("recorded"); };
  };

  const handleDiscard = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setAudioData(null);
    setDurationMs(0);
    setWaveform([]);
    setState("idle");
  };

  const handleSend = () => {
    if (audioData) onSend?.(audioData, mimeType, durationMs);
  };

  // Format mm:ss
  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  useEffect(() => () => stopTimers(), []);

  return (
    <div className={`flex items-center gap-2 p-2 bg-card border border-border rounded-full shadow-sm ${className}`}>
      {/* Record/Stop button */}
      {state === "idle" && (
        <button
          onMouseDown={handleRecord}
          onClick={handleRecord}
          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md active:scale-95 transition-all hover:bg-red-600"
          title="Start recording"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}

      {state === "recording" && (
        <button
          onClick={handleStop}
          className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md animate-pulse active:scale-95"
          title="Stop recording"
        >
          <Square className="w-4 h-4 fill-white" />
        </button>
      )}

      {(state === "recorded" || state === "playing") && (
        <>
          <button
            onClick={handlePlay}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
          >
            {state === "playing" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </>
      )}

      {/* Waveform / duration display */}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {state === "recording" ? (
          <div className="flex items-end gap-[2px] h-8">
            {waveform.map((h, i) => (
              <div
                key={i}
                className="w-[3px] bg-red-500 rounded-full transition-all duration-100"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            {(state === "recorded" || state === "playing") && (
              <div className="flex items-end gap-[2px] h-6 flex-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-[3px] rounded-full ${state === "playing" ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`}
                    style={{ height: `${6 + ((i * 7) % 18)}px` }}
                  />
                ))}
              </div>
            )}
            <span className="text-xs font-mono font-bold text-muted-foreground shrink-0">
              {fmt(durationMs)}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons (discard / send) */}
      {(state === "recorded" || state === "playing") && (
        <div className="flex gap-1.5">
          <button
            onClick={handleDiscard}
            className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center text-destructive active:scale-95 transition-all"
            title="Discard"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onSend && (
            <button
              onClick={handleSend}
              className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
