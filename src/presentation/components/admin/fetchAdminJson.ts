export class AdminFetchError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminFetchError";
    this.status = status;
  }
}

export const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (error instanceof Error && error.name === "AbortError");

export const fetchAdminJson = async <T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackMessage: string
): Promise<T> => {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : fallbackMessage;
    throw new AdminFetchError(message, response.status);
  }

  return body as T;
};
