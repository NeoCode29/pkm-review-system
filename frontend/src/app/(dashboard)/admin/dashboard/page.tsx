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
  Eye,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

interface ReviewerProgress {
  id: string;
  nama: string;
  total: number;
  completed: number;
  pending: number;
}

interface JenisPkmCount {
  id: string;
  nama: string;
  count: number;
}

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
  reviewerProgress: ReviewerProgress[];
  proposalsByJenisPkm: JenisPkmCount[];
}

interface RecentTeam {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkm?: { nama: string };
  teamMembers?: { role: string; mahasiswa: { nama: string } }[];
  proposals?: { status: string }[];
  createdAt: string;
}

interface TeamsResponse {
  data: RecentTeam[];
  meta: { total: number };
}

const PROPOSAL_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  submitted: 'default',
  under_review: 'secondary',
  reviewed: 'default',
  needs_revision: 'destructive',
};

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

  const { data: recentTeams } = useQuery<TeamsResponse>({
    queryKey: ['admin-recent-teams'],
    queryFn: () => api.get('/teams?page=1&limit=5'),
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
        {/* Proposal by Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Proposal by Status</CardTitle>
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

        {/* Proposal by Jenis PKM */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Proposal per Jenis PKM
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.proposalsByJenisPkm.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data jenis PKM</p>
            ) : (
              <div className="space-y-3">
                {data.proposalsByJenisPkm.map((jp) => {
                  const pct = data.stats.totalProposals > 0 ? Math.round((jp.count / data.stats.totalProposals) * 100) : 0;
                  return (
                    <div key={jp.id} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium truncate">{jp.nama}</div>
                      <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-300 dark:bg-purple-700 transition-all"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-medium">{jp.count}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviewer Progress */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> Progress Reviewer
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/reviewers">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.reviewerProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada reviewer</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead className="text-center">Assigned</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.reviewerProgress.map((r) => {
                    const pct = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.nama}</TableCell>
                        <TableCell className="text-center">{r.total}</TableCell>
                        <TableCell className="text-center text-green-600 dark:text-green-400 font-medium">{r.completed}</TableCell>
                        <TableCell className="text-center text-orange-600 dark:text-orange-400 font-medium">{r.pending}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-400 dark:bg-green-600 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction href="/admin/reviewers" icon={<ClipboardList className="h-4 w-4" />} label="Manage Reviewers" />
            <QuickAction href="/admin/teams" icon={<Users className="h-4 w-4" />} label="Manage Teams" />
            <QuickAction href="/admin/master-data/prodi" icon={<Settings className="h-4 w-4" />} label="Master Data" />
            <QuickAction href="/admin/settings" icon={<Settings className="h-4 w-4" />} label="System Settings" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Teams */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Teams</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/teams">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Tim</TableHead>
                  <TableHead>Jenis PKM</TableHead>
                  <TableHead>Ketua</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!recentTeams?.data || recentTeams.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      Belum ada tim
                    </TableCell>
                  </TableRow>
                )}
                {recentTeams?.data.map((team) => {
                  const pStatus = team.proposals?.[0]?.status || 'no_proposal';
                  const ketua = team.teamMembers?.find((m) => m.role === 'ketua')?.mahasiswa.nama;
                  return (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.namaTeam}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{team.jenisPkm?.nama || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{ketua || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={PROPOSAL_BADGE[pStatus] || 'outline'} className="capitalize">
                          {pStatus.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/teams/${team.id}`}>
                            <Eye className="mr-1 h-3 w-3" /> Detail
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
