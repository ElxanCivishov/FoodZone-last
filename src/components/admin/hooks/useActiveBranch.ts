import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Branch } from '@/types';

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => get<Branch[]>('/branches'),
  });
}

export function useActiveBranch() {
  const user = useAuthStore((s) => s.user);
  const branches = useBranches();
  const list: Branch[] = (branches.data?.data ?? []) as Branch[];

  // super_admin sees all branches; others get only their assigned branch
  const activeBranch = user?.role === 'super_admin'
    ? list[0]
    : list.find((b) => b.id === user?.branchId) ?? list[0];

  return {
    ...branches,
    activeBranch,
    activeBranchId: activeBranch?.id ?? '',
  };
}

export function useActiveBranchId() {
  return useActiveBranch().activeBranchId;
}

export function useIsSuperAdmin() {
  return useAuthStore((s) => s.user?.role === 'super_admin');
}
