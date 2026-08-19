import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, PhoneOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CallState = "idle" | "connecting" | "active";

const PUBLIC_KEY = import.meta.env["VITE_VAPI_PUBLIC_KEY"] as string | undefined;
const ASSISTANT_ID = import.meta.env["VITE_VAPI_ASSISTANT_ID"] as string | undefined;

/**
 * Floating web-call button for The Roy Effect inbound concierge.
 * Renders only when the Vapi public key and assistant id are configured.
 */
export function VoiceConcierge() {
  const [state, setState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState("");
  const vapiRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      vapiRef.current?.stop?.();
      vapiRef.current = null;
    };
  }, []);

  const startCall = useCallback(async () => {
    if (!PUBLIC_KEY || !ASSISTANT_ID) return;
    setState("connecting");
    try {
      if (!vapiRef.current) {
        const { default: Vapi } = await import("@vapi-ai/web");
        const vapi = new Vapi(PUBLIC_KEY);
        vapi.on("call-start", () => setState("active"));
        vapi.on("call-end", () => {
          setState("idle");
          setTranscript("");
        });
        vapi.on("error", (error: unknown) => {
          console.error("Vapi call error:", error);
          setState("idle");
        });
        vapi.on("message", (msg: any) => {
          if (msg?.type === "transcript" && msg?.transcriptType === "final") {
            setTranscript(String(msg.transcript ?? "").slice(0, 160));
          }
        });
        vapiRef.current = vapi;
      }
      await vapiRef.current.start(ASSISTANT_ID);
    } catch (error) {
      console.error("Could not start voice call:", error);
      setState("idle");
    }
  }, []);

  const endCall = useCallback(() => {
    vapiRef.current?.stop?.();
    setState("idle");
    setTranscript("");
  }, []);

  if (!PUBLIC_KEY || !ASSISTANT_ID) return null;

  const active = state === "active";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {active && transcript ? (
        <p className="max-w-[16rem] rounded-md border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
          {transcript}
        </p>
      ) : null}
      <button
        type="button"
        onClick={active ? endCall : startCall}
        disabled={state === "connecting"}
        aria-label={active ? "End voice call" : "Talk to the studio concierge"}
        className={cn(
          "group flex items-center gap-2 rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors",
          active
            ? "border-destructive bg-destructive text-destructive-foreground"
            : "border-border bg-background/90 text-foreground backdrop-blur hover:border-primary hover:text-primary",
        )}
      >
        {state === "connecting" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : active ? (
          <PhoneOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Mic className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {state === "connecting" ? "Connecting" : active ? "End call" : "Talk to us"}
        </span>
      </button>
    </div>
  );
}
