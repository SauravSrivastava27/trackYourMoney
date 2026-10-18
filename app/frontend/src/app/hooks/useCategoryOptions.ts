"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useCategories() {
  return useCategoryOptions();
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; type: "INCOME" | "EXPENSE" }) => {
      const response = await apiRequest<CategoryOption>("/api/v1/categories", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!response.data) throw new Error("Category data was missing.");
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}


export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const response = await apiRequest<CategoryOption>(
        `/api/v1/categories/${input.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: input.name }),
        }
      );
      if (!response.data) throw new Error("Category data was missing.");
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
