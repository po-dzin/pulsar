import { NextResponse } from "next/server";

type ErrorLike = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

const asErrorLike = (error: unknown): ErrorLike | null =>
  error && typeof error === "object" ? (error as ErrorLike) : null;

const getMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  const value = asErrorLike(error)?.message;
  return typeof value === "string" && value.trim().length > 0 ? value : "Unexpected server error";
};

const getStatus = (message: string): number => {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;

  const lower = message.toLowerCase();
  if (lower.includes("invalid payload") || lower.includes("invalid input")) return 400;
  if (lower.includes("not found")) return 404;
  if (lower.includes("duplicate key")) return 409;
  return 500;
};

export const adminContentErrorResponse = (error: unknown) => {
  const message = getMessage(error);
  const status = getStatus(message);
  const details = asErrorLike(error)?.details;
  const hint = asErrorLike(error)?.hint;

  return NextResponse.json(
    {
      error: message,
      details: typeof details === "string" ? details : undefined,
      hint: typeof hint === "string" ? hint : undefined,
    },
    { status }
  );
};

