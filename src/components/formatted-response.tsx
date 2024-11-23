"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface FormattedResponseProps {
  content: string;
}

export function FormattedResponse({ content }: FormattedResponseProps) {
  const [formattedContent, setFormattedContent] = useState("");

  useEffect(() => {
    // Process the content to make it more readable
    const processContent = () => {
      // Handle case where content might be JSON
      let processed = content;
      try {
        const parsed = JSON.parse(content);
        if (parsed.response) {
          processed = parsed.response;
        }
      } catch {
        // Content is not JSON, use as-is
        processed = content;
      }

      // Remove excessive newlines
      processed = processed.replace(/\n{3,}/g, "\n\n");

      // Format section headers
      processed = processed.replace(/\*\*(.*?)\*\*/g, "$1");

      // Format bullet points
      processed = processed.replace(/^\* /gm, "• ");

      setFormattedContent(processed);
    };

    processContent();
  }, [content]);

  return (
    <Card className="bg-transparent border-none shadow-none">
      <div className="prose prose-invert max-w-none">
        {formattedContent.split("\n").map((line, i) => {
          // Handle section headers
          if (line.startsWith("### ")) {
            return (
              <h3
                key={i}
                className="text-emerald-400 font-semibold mb-2 text-base"
              >
                {line.replace("### ", "")}
              </h3>
            );
          }

          // Handle bullet points
          if (line.startsWith("• ")) {
            return (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-emerald-400">•</span>
                <span className="text-zinc-200">{line.substring(2)}</span>
              </div>
            );
          }

          // Regular paragraph
          return line ? (
            <p key={i} className="text-zinc-200 leading-relaxed mb-4">
              {line}
            </p>
          ) : null;
        })}
      </div>
    </Card>
  );
}
