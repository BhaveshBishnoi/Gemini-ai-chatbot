import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper function to format the response
function formatResponse(text: string) {
  // Add section headers if they don't exist
  if (!text.includes("**")) {
    text = `**Response**\n${text}`;
  }

  // Format bullet points if they exist
  const lines = text.split("\n");
  const formattedLines = lines.map((line) => {
    // Convert dash lists to bullet points
    if (line.trim().startsWith("-")) {
      return line.replace(/^[\s-]*/, "* ");
    }
    return line;
  });

  return formattedLines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    // Generate content from the last message only
    const result = await model.generateContent(lastMessage.content);
    const response = await result.response;
    console.log(response);

    // Format the response text to work with FormattedResponse component
    const formattedText = formatResponse(response.text());

    console.log(formattedText);

    // Return plain text response
    return new Response(formattedText, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `**Error**\n${error.message}`
        : "**Error**\nFailed to process request";

    // Return plain text error
    return new Response(errorMessage, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
