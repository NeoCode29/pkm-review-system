'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

interface DashboardResponse {
  layout: string;
  team?: { id: string };
}

export default function MyTeamRedirectPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ['mahasiswa-dashboard'],
    queryFn: () => api.get<DashboardResponse>('/dashboard/mahasiswa'),
  });

  useEffect(() => {
    if (!data) return;
    if (data.layout === 'TEAM_DASHBOARD' && data.team) {
      router.replace(`/mahasiswa/teams/${data.team.id}`);
    } else {
      router.replace('/mahasiswa/teams/browse');
    }
  }, [data, router]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return null;
}
