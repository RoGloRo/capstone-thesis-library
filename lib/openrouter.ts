import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

type OpenRouterMessage = {
  role: string;
  content: string;
};

type OpenRouterResult =
  | {
      ok: true;
      content: string;
      model: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      details?: unknown;
      retryable?: boolean;
    };

export async function callOpenRouterChat({
  messages,
  temperature = 0.7,
  maxTokens = 1000,
  signal,
}: {
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<OpenRouterResult> {
  if (typeof window !== "undefined") {
    return {
      ok: false,
      error: "Groq requests must be executed on the server.",
    };
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  const modelName = process.env.GROQ_MODEL?.trim();

  if (!apiKey) {
    return {
      ok: false,
      error: "Groq API key is not configured.",
      status: 500,
    };
  }

  if (!modelName) {
    return {
      ok: false,
      error: "Groq model is not configured.",
      status: 500,
    };
  }

  try {
    const model = groq(modelName) as any;

    const { text } = await generateText({
      model,
      messages: messages as any,
      temperature,
      abortSignal: signal,
    });

    return {
      ok: true,
      content: text,
      model: modelName,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        error: "The AI request timed out. Please try again.",
        status: 504,
        details: error,
        retryable: true,
      };
    }

    // Handle AI SDK errors
    const isRateLimit =
      (error instanceof Error && error.message.toLowerCase().includes("rate limit")) ||
      (typeof error === "object" && error !== null && "status" in error && (error as any).status === 429);

    const retryable =
      isRateLimit ||
      (typeof error === "object" && error !== null && "status" in error && (error as any).status >= 500);

    return {
      ok: false,
      error: isRateLimit
        ? "The AI service is currently rate-limited. Please try again shortly."
        : error instanceof Error
        ? error.message
        : "Unexpected AI request error.",
      status:
        typeof error === "object" && error !== null && "status" in error
          ? (error as any).status
          : 500,
      details: error,
      retryable,
    };
  }
}
