import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { Message } from "@/types/chat";

// Initialize the Gemini API with safety check
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { messages } = body;

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid or empty messages array" }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Get the last user message
    const lastMessage = messages[messages.length - 1] as Message;
    
    try {
      // Simple prompt to the model
      const result = await model.generateContent(lastMessage.content);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      return new NextResponse(
        JSON.stringify({ response: text }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (modelError: unknown) {
      const errorMessage = modelError instanceof Error ? modelError.message : 'Unknown model error';
      return new NextResponse(
        JSON.stringify({ error: "Failed to generate response", details: errorMessage }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 