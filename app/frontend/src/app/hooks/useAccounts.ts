
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "../lib/api";

export type AccountType =
  | "CASH"
  | "SAVINGS"
  | "CHECKING"
  | "CREDIT_CARD"
  | "INVESTMENT"
  | "OTHER";

export type Account = {
  id: string;
  name: string;
  currency: string;
  type: AccountType;
  balance: string | number;
  createdAt: string;
  updatedAt: string;
};

export type AccountInput = {
  name: string;
  currency: string;
  type: AccountType;
  balance: number;
};

export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.lists(),
    queryFn: async () => {
      const response =
        await apiRequest<Account[]>("/api/v1/accounts");

      return response.data ?? [];
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AccountInput) => {
      const response = await apiRequest<Account>(
        "/api/v1/accounts",
        {
          method: "POST",
          body: JSON.stringify(input),
        }
      );

      if (!response.data) {
        throw new Error(
          "Account data was missing from the response."
        );
      }

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: accountKeys.all,
      });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: AccountInput & { id: string }) => {
      const response = await apiRequest<Account>(
        `/api/v1/accounts/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(input),
        }
      );

      if (!response.data) {
        throw new Error(
          "Account data was missing from the response."
        );
      }

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: accountKeys.all,
      });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest<{ id: string }>(
        `/api/v1/accounts/${id}`,
        { method: "DELETE" }
      );

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: accountKeys.all,
      });
    },
  });
}
