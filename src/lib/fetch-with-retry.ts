export class UpstreamError extends Error {
  status: number;
  code: "NOT_FOUND" | "RATE_LIMITED" | "TIMEOUT" | "UPSTREAM_ERROR" | "VALIDATION_ERROR" | "UNKNOWN";

  constructor(
    message: string,
    status: number,
    code: "NOT_FOUND" | "RATE_LIMITED" | "TIMEOUT" | "UPSTREAM_ERROR" | "VALIDATION_ERROR" | "UNKNOWN" = "UPSTREAM_ERROR",
  ) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
    this.code = code;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function backoffWithJitter(attempt: number): number {
  const exponential = 400 * 2 ** attempt;
  const jitter = Math.random() * 250;
  return Math.min(exponential + jitter, 4000);
}

type RetryOptions = {
  attempts?: number;
  timeoutMs?: number;
};

type FetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
  };
};

export async function fetchWithRetry(
  url: string,
  init: FetchInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  const attempts = options.attempts ?? 3;
  const timeoutMs = options.timeoutMs ?? 8000;
  let lastError: Error = new UpstreamError("Request failed", 502);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.ok) {
        return response;
      }

      const retryable = response.status === 429 || response.status >= 500;
      const code =
        response.status === 404 ? "NOT_FOUND" : response.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR";
      const message =
        response.status === 404
          ? "The requested market data was not found."
          : response.status === 429
            ? "Upstream rate limit reached. Retrying shortly."
            : `Upstream responded with ${response.status}.`;
      lastError = new UpstreamError(message, response.status, code);

      if (!retryable || attempt === attempts - 1) {
        throw lastError;
      }
    } catch (error) {
      if (error instanceof UpstreamError) {
        lastError = error;
        if (error.code !== "RATE_LIMITED" && error.status < 500) {
          throw error;
        }
      } else if (error instanceof DOMException && error.name === "AbortError") {
        lastError = new UpstreamError("The upstream request timed out.", 504, "TIMEOUT");
      } else {
        lastError = new UpstreamError("Unable to reach the upstream API.", 502, "UNKNOWN");
      }

      if (attempt === attempts - 1) {
        throw lastError;
      }
    } finally {
      clearTimeout(timer);
    }

    await sleep(backoffWithJitter(attempt));
  }

  throw lastError;
}

export async function readUpstreamJson(response: Response): Promise<unknown> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<") || trimmed.toLowerCase().includes("<html")) {
    throw new UpstreamError("Upstream returned HTML instead of JSON.", response.status || 502, "UPSTREAM_ERROR");
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new UpstreamError("Upstream payload was not valid JSON.", 502, "VALIDATION_ERROR");
  }
}
