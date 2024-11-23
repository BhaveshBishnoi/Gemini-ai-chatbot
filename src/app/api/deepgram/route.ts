import { createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY is not defined");
}

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const audio = data.get("audio");

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    try {
      // Convert audio blob to buffer
      const audioBuffer = Buffer.from(await audio.arrayBuffer());

      // Create a Source object
      const source = {
        buffer: audioBuffer,
        mimetype: 'audio/webm',
      };

      // Transcribe the audio
      const transcription = await deepgram.transcription.preRecorded(source, {
        smart_format: true,
        model: "nova",
        language: "en-US",
        punctuate: true,
      });

      // Check if we have a valid transcript
      if (!transcription?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        throw new Error("No transcription result");
      }

      // Get the transcript text
      const transcript = transcription.results.channels[0].alternatives[0].transcript;

      // Return the result
      return NextResponse.json({ 
        result: transcript,
        success: true 
      });

    } catch (transcriptionError) {
      console.error("Deepgram Transcription Error:", transcriptionError);
      return NextResponse.json(
        { 
          error: "Transcription failed", 
          details: transcriptionError instanceof Error ? transcriptionError.message : "Unknown error",
          success: false
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      { status: 500 }
    );
  }
}
