const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000"
).replace(/\/$/, "");

export type ApiErrorDetail = {
  field: string;
  message: string;
};

export type ApiResponse<T> = {
  message?: string;
  data?: T;
  errors?: ApiErrorDetail[];
};

export class ApiError extends Error {
  status: number;
  details: ApiErrorDetail[];

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight ?? Promise.resolve(false);
}

async function sendRequest(path: string, options: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  let response = await sendRequest(path, options);

  if (
    response.status === 401 &&
    path !== "/api/v1/auth/refresh" &&
    path !== "/api/v1/auth/signin" &&
    path !== "/api/v1/auth/signup" &&
    path !== "/api/v1/auth/logout"
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await sendRequest(path, options);
    }
  }

  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("The server returned an invalid response.", response.status);
  }

  if (!response.ok) {
    const validationMessage = result.errors
      ?.map((item) => item.message)
      .join(" ");

    throw new ApiError(
      validationMessage || result.message || "Request failed. Please try again.",
      response.status,
      result.errors ?? []
    );
  }

  return result;
}
