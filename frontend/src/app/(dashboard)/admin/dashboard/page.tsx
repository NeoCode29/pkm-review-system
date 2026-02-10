'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  FileText,
  Settings,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

interface AdminDashboard {
  currentPhase: string;
  toggleStates: Record<string, boolean>;
  stats: {
    totalMahasiswa: number;
    totalReviewers: number;
    totalTeams: number;
    totalProposals: number;
  };
  proposalsByStatus: Record<string, { count: number; percentage: number }>;
}

const PHASE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', desc: 'Semua fitur upload dan review sedang ditutup' },
  SUBMISSION: { label: 'Submission Period', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', desc: 'Mahasiswa dapat mengupload proposal' },
  REVIEW: { label: 'Review Period', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', desc: 'Reviewer dapat menilai proposal yang disubmit' },
  REVISION: { label: 'Revision Period', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', desc: 'Mahasiswa dapat mengupload revisi proposal' },
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-200 dark:bg-gray-700',
  submitted: 'bg-blue-200 dark:bg-blue-800',
  under_review: 'bg-yellow-200 dark:bg-yellow-800',
  reviewed: 'bg-green-200 dark:bg-green-800',
  not_reviewed: 'bg-red-200 dark:bg-red-800',
  needs_revision: 'bg-orange-200 dark:bg-orange-800',
  revised: 'bg-teal-200 dark:bg-teal-800',
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<AdminDashboard>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/dashboard/admin'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const phase = PHASE_LABELS[data.currentPhase] || PHASE_LABELS.CLOSED;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Current Phase */}
      <Card className={phase.color}>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-medium opacity-70">Current System Phase</p>
            <p className="text-xl font-bold">{phase.label}</p>
            <p className="text-sm opacity-80 mt-0.5">{phase.desc}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/settings">
              <Settings className="mr-1 h-4 w-4" /> Manage
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Mahasiswa" value={data.stats.totalMahasiswa} icon={<Users className="h-5 w-5 text-blue-500" />} />
        <StatCard label="Total Teams" value={data.stats.totalTeams} icon={<Users className="h-5 w-5 text-green-500" />} />
        <StatCard label="Reviewers" value={data.stats.totalReviewers} icon={<UserCheck className="h-5 w-5 text-yellow-500" />} />
        <StatCard label="Proposals" value={data.stats.totalProposals} icon={<FileText className="h-5 w-5 text-purple-500" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Review Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Review Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.proposalsByStatus).map(([status, info]) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-28 text-sm capitalize">{status.replace(/_/g, ' ')}</div>
                <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${STATUS_COLORS[status] || 'bg-gray-300'}`}
                    style={{ width: `${Math.max(info.percentage, 2)}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm font-medium">
                  {info.count} <span className="text-muted-foreground text-xs">({info.percentage}%)</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction href="/admin/reviewers" icon={<ClipboardList className="h-4 w-4" />} label="Assign Reviewers" />
            <QuickAction href="/admin/teams" icon={<Users className="h-4 w-4" />} label="Manage Teams" />
            <QuickAction href="/admin/users" icon={<Users className="h-4 w-4" />} label="Manage Users" />
            <QuickAction href="/admin/settings" icon={<Settings className="h-4 w-4" />} label="System Settings" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Button variant="outline" className="w-full justify-between" asChild>
      <Link href={href}>
        <span className="flex items-center gap-2">{icon} {label}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
