"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { accountKeys } from "./useAccounts";

export type TransactionType = "INCOME" | "EXPENSE";

export type Transaction = {
  id: string;
  title: string;
  amount: string | number;
  type: TransactionType;
  occurredAt: string;
  note: string | null;
  accountId: string;
  categoryId: string | null;
  account: { id: string; name: string; currency: string };
  category: { id: string; name: string; type: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  occurredAt: string;
  note?: string | null;
  accountId: string;
  categoryId?: string | null;
};

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: { search?: string; type?: TransactionType }) =>
    [...transactionKeys.all, filters] as const,
};

export function useTransactions(filters: {
  search?: string;
  type?: TransactionType;
} = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search?.trim()) params.set("search", filters.search.trim());
      if (filters.type) params.set("type", filters.type);
      params.set("limit", "100");

      const response = await apiRequest<Transaction[]>(
        `/api/v1/transactions?${params.toString()}`
      );
      return response.data ?? [];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const response = await apiRequest<Transaction>(
        "/api/v1/transactions",
        { method: "POST", body: JSON.stringify(input) }
      );
      if (!response.data) throw new Error("Transaction data was missing.");
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      ]);
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: TransactionInput & { id: string }) => {
      const response = await apiRequest<Transaction>(
        `/api/v1/transactions/${id}`,
        { method: "PATCH", body: JSON.stringify(input) }
      );
      if (!response.data) throw new Error("Transaction data was missing.");
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      ]);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ id: string }>(
        `/api/v1/transactions/${id}`,
        { method: "DELETE" }
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      ]);
    },
  });
}
