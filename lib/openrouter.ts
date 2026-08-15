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
      error: "OpenRouter requests must be executed on the server.",
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();

  if (!apiKey) {
    return {
      ok: false,
      error: "OpenRouter API key is not configured.",
      status: 500,
    };
  }

  if (!model) {
    return {
      ok: false,
      error: "OpenRouter model is not configured.",
      status: 500,
    };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3000",
        "X-Title": "Smart Library",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal,
    });

    const responseText = await response.text();
    let payload: Record<string, unknown> | null = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const details = payload ?? responseText;
      const errorMessage =
        details && typeof details === "object" && "error" in details && details.error && typeof details.error === "object"
          ? String((details.error as { message?: string }).message ?? "Failed to get response from AI service.")
          : "Failed to get response from AI service.";

      const isRateLimit =
        response.status === 429 ||
        (typeof details === "object" && details !== null && "error" in details && details.error && typeof details.error === "object" && (details.error as { code?: number }).code === 429);
      const retryable = isRateLimit || response.status >= 500;

      return {
        ok: false,
        error: isRateLimit
          ? "The AI service is currently rate-limited. Please try again shortly."
          : errorMessage,
        status: response.status,
        details,
        retryable,
      };
    }

    const content =
      (payload?.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]
        ?.message?.content?.trim() ?? "";

    if (!content) {
      return {
        ok: false,
        error: "No response from AI service.",
        status: 502,
      };
    }

    return {
      ok: true,
      content,
      model,
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

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected AI request error.",
      status: 500,
      details: error,
      retryable: true,
    };
  }
}
