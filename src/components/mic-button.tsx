"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useHasMounted } from "@/hooks/use-has-mounted";

interface MicButtonProps {
  onTranscription: (text: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  lastResponse?: string;
}

export function MicButton({
  onTranscription,
  isLoading,
  onSubmit,
  lastResponse,
}: MicButtonProps) {
  const hasMounted = useHasMounted();
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const synth = useRef<SpeechSynthesis | null>(null);
  const stream = useRef<MediaStream | null>(null);

  // Initialize speech synthesis after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synth.current = window.speechSynthesis;
      // Load voices
      const loadVoices = () => {
        const voices = synth.current?.getVoices() || [];
        if (voices.length > 0) {
          window.removeEventListener('voiceschanged', loadVoices);
        }
      };
      window.addEventListener('voiceschanged', loadVoices);
      loadVoices();

      return () => {
        window.removeEventListener('voiceschanged', loadVoices);
        if (synth.current) {
          synth.current.cancel();
        }
        if (stream.current) {
          stream.current.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, []);

  // Handle new responses
  useEffect(() => {
    if (lastResponse && !isSpeaking && hasMounted && synth.current) {
      speakResponse(lastResponse);
    }
  }, [lastResponse, isSpeaking, hasMounted]);

  const startRecording = async () => {
    try {
      if (isSpeaking && synth.current) {
        synth.current.cancel();
        setIsSpeaking(false);
      }

      // Request microphone access
      stream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });

      // Announce start of recording
      await speakResponse("I'm listening. Please speak your question.");

      mediaRecorder.current = new MediaRecorder(stream.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        try {
          const audioBlob = new Blob(chunks.current, { 
            type: 'audio/webm;codecs=opus'
          });

          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          // Get transcription
          const response = await fetch("/api/deepgram", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
          }

          if (data.success && data.result) {
            setTranscribedText(data.result);
            onTranscription(data.result);
            // Announce processing
            await speakResponse("Processing your question...");
            setTimeout(() => onSubmit(), 1000);
          } else {
            throw new Error(data.error || "Transcription failed");
          }
        } catch (error) {
          console.error("Transcription error:", error);
          speakResponse("Sorry, I couldn't understand that. Please try again.");
        } finally {
          chunks.current = [];
          if (stream.current) {
            stream.current.getTracks().forEach(track => track.stop());
          }
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      speakResponse("I couldn't access the microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (!synth.current || !text || isSpeaking) return;

    return new Promise<void>((resolve) => {
      synth.current!.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select best available voice
      const voices = synth.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Natural') ||
        voice.lang.includes('en-US')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      synth.current.speak(utterance);
    });
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isRecording) {
      startRecording();
    }
  };

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant={isRecording ? "destructive" : "secondary"}
        className={`h-8 w-8 rounded-lg ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleClick}
        disabled={isLoading}
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      {transcribedText && (
        <span className="text-xs text-zinc-400">
          {transcribedText.slice(0, 30)}...
        </span>
      )}
      {isSpeaking && (
        <Volume2 className="h-4 w-4 text-emerald-500 animate-pulse" />
      )}
    </div>
  );
}
