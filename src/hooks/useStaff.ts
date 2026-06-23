import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post } from '@/services/api';
import type { PaginatedResponse, StaffMember } from '@/types';

export function useAllStaff() {
  return useQuery({
    queryKey: ['staff', 'all'],
    queryFn: () => get<StaffMember[]>('/staff/all'),
  });
}

export interface StaffParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export function useStaff(params: StaffParams = {}) {
  const { page = 1, limit = 10, search, role, status } = params;
  return useQuery({
    queryKey: ['staff', { page, limit, search, role, status }],
    queryFn: () =>
      get<PaginatedResponse<StaffMember>>('/staff', {
        page,
        limit,
        ...(search ? { search } : {}),
        ...(role && role !== 'all' ? { role } : {}),
        ...(status && status !== 'all' ? { status } : {}),
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      post<StaffMember>('/staff', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffMember> }) =>
      patch<StaffMember>(`/staff/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/staff/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}
