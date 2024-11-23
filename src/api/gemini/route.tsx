import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    try {
      // Generate content from the last message only
      const result = await model.generateContent(lastMessage.content);
      const response = await result.response;
      const text = response.text();

      // Return plain text response
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    } catch (modelError) {
      console.error("Gemini Model Error:", modelError);
      throw modelError;
    }
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      error instanceof Error ? error.message : "Failed to process request",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }
}
