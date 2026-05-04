"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Expense } from "@/types";

export interface ExpensesResponse {
  data: Expense[];
  meta: { total_count: number; pending_count: number; total_amount: number; pending_amount: number };
}

export function useExpenses(params?: { status?: string; submitted_by?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.submitted_by) query.set("submitted_by", params.submitted_by);
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => api.get<ExpensesResponse>(`/expenses?${query}`),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Expense>) => api.post<{ data: Expense }>("/expenses", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      api.patch<{ data: Expense }>(`/expenses/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
