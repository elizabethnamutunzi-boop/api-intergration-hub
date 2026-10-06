import type { ApiErrorCode } from "@/types/markets";

export class MarketsRequestError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(message: string, code: ApiErrorCode, status: number) {
    super(message);
    this.name = "MarketsRequestError";
    this.code = code;
    this.status = status;
  }
}

export type ErrorCopy = {
  kicker: string;
  title: string;
  message: string;
  tone: "error" | "warning";
};

export function getErrorCopy(error: unknown): ErrorCopy {
  const requestError = error instanceof MarketsRequestError ? error : null;
  const code = requestError?.code;
  const status = requestError?.status;
  const fallbackMessage = requestError?.message ?? "Market data is temporarily unavailable.";

  if (code === "RATE_LIMITED" || status === 429) {
    return {
      kicker: "HTTP 429",
      title: "Rate limit reached",
      message: fallbackMessage || "Too many requests were sent. Wait a moment, then retry.",
      tone: "warning",
    };
  }

  if (code === "NOT_FOUND" || status === 404) {
    return {
      kicker: "HTTP 404",
      title: "Market data not found",
      message: fallbackMessage || "The requested market snapshot does not exist.",
      tone: "error",
    };
  }

  if (code === "TIMEOUT" || status === 504) {
    return {
      kicker: "Timeout",
      title: "The request timed out",
      message: fallbackMessage || "The upstream API took too long to respond.",
      tone: "warning",
    };
  }

  return {
    kicker: status ? `HTTP ${status}` : "Connection error",
    title: "Unable to load live markets",
    message: fallbackMessage,
    tone: "error",
  };
}

export function codeFromStatus(status: number, fallback: ApiErrorCode = "UNKNOWN"): ApiErrorCode {
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 429) {
    return "RATE_LIMITED";
  }
  if (status === 504) {
    return "TIMEOUT";
  }
  return fallback;
}
