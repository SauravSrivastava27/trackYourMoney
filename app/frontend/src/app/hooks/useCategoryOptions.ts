"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";

export type CategoryOption = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

export function useCategoryOptions() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiRequest<CategoryOption[]>("/api/v1/categories");
      return response.data ?? [];
    },
  });
}
