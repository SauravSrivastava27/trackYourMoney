
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

  constructor(
    message: string,
    status: number,
    details: ApiErrorDetail[] = []
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    }
  );

  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status
    );
  }

  if (!response.ok) {
    const validationMessage = result.errors
      ?.map((item) => item.message)
      .join(" ");

    throw new ApiError(
      validationMessage ||
        result.message ||
        "Request failed. Please try again.",
      response.status,
      result.errors ?? []
    );
  }

  return result;
}
