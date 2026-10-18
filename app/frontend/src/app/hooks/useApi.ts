
"use client";

import { useState } from "react";
import {
  apiRequest,
  type ApiResponse,
} from "../lib/api";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  async function request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    setLoading(true);
    setError(null);

    try {
      return await apiRequest<T>(path, options);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected API error.";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    request,
    loading,
    error,
    clearError: () => setError(null),
  };
}
