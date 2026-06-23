import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import type { Branch } from '@/types';

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => get<Branch[]>('/branches'),
  });
}

export function useActiveBranch() {
  const branches = useBranches();
  return {
    ...branches,
    activeBranch: branches.data?.data?.[0],
    activeBranchId: branches.data?.data?.[0]?.id || '',
  };
}

export function useActiveBranchId() {
  return useActiveBranch().activeBranchId;
}
