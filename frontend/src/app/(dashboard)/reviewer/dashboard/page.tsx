'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

interface Assignment {
  id: string;
  reviewerNumber: number;
  proposal: {
    id: string;
    type: string;
    status: string;
    team: { id: string; namaTeam: string; judulProposal: string };
  };
  penilaianAdministrasi?: { isComplete: boolean };
  penilaianSubstansi?: { isComplete: boolean };
}

interface ReviewerDashboard {
  reviewer: { id: string; nama: string };
  stats: { totalAssigned: number; completed: number; pending: number };
  assignments: Assignment[];
}

type ToggleStates = Record<string, boolean>;

export default function ReviewerDashboardPage() {
  const { data, isLoading } = useQuery<ReviewerDashboard>({
    queryKey: ['reviewer-dashboard'],
    queryFn: () => api.get('/dashboard/reviewer'),
  });

  const { data: toggles } = useQuery<ToggleStates>({
    queryKey: ['system-config'],
    queryFn: () => api.get('/config'),
  });

  const reviewEnabled = toggles?.reviewEnabled ?? false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const progressPct = data.stats.totalAssigned > 0
    ? Math.round((data.stats.completed / data.stats.totalAssigned) * 100)
    : 0;

  const getStatus = (a: Assignment) => {
    if (a.penilaianAdministrasi?.isComplete && a.penilaianSubstansi?.isComplete) return 'completed';
    if (a.penilaianAdministrasi?.isComplete || a.penilaianSubstansi?.isComplete) return 'in_progress';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Reviewer</h1>

      {/* Review Phase Status */}
      <Card className={reviewEnabled ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950'}>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium opacity-70">Status Fase Review</p>
            <p className="text-lg font-bold">
              {reviewEnabled ? 'Periode Review Aktif' : 'Periode Review Ditutup'}
            </p>
            <p className="text-sm opacity-80">
              {reviewEnabled ? 'Anda dapat melakukan penilaian proposal' : 'Review tidak dapat dilakukan saat ini'}
            </p>
          </div>
          <Badge variant={reviewEnabled ? 'default' : 'destructive'} className="w-fit shrink-0">
            Review: {reviewEnabled ? 'DIBUKA' : 'DITUTUP'}
          </Badge>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{data.stats.totalAssigned}</p>
              <p className="text-xs text-muted-foreground">Total Ditugaskan</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-600">{data.stats.completed}</p>
              <p className="text-xs text-muted-foreground">Selesai</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {data.assignments.filter((a) => getStatus(a) === 'in_progress').length}
              </p>
              <p className="text-xs text-muted-foreground">Sedang Direview</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">
                {data.assignments.filter((a) => getStatus(a) === 'pending').length}
              </p>
              <p className="text-xs text-muted-foreground">Belum Dimulai</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Progress Review</CardTitle>
            <span className="text-sm font-semibold text-primary">{progressPct}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressPct} className="h-3" />
          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <span>Selesai: {data.stats.completed} proposal</span>
            <span>Tersisa: {data.stats.pending} proposal</span>
          </div>
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/reviewer/proposals">
              <ClipboardList className="mr-2 h-4 w-4" /> Lihat Semua Proposal
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Assignment Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Proposal yang Ditugaskan</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/reviewer/proposals">Lihat Semua <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Tim</TableHead>
                  <TableHead className="hidden sm:table-cell">Judul Proposal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Belum ada proposal yang ditugaskan
                    </TableCell>
                  </TableRow>
                )}
                {data.assignments.map((a, idx) => {
                  const status = getStatus(a);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="tabular-nums">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{a.proposal.team.namaTeam}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 sm:hidden">
                          {a.proposal.team.judulProposal}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm max-w-[250px] truncate">
                        {a.proposal.team.judulProposal}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status === 'completed' ? 'default' : status === 'in_progress' ? 'secondary' : 'outline'}>
                          {status === 'completed' ? 'Selesai' : status === 'in_progress' ? 'Sedang' : 'Belum'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {status === 'completed' ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/reviewer/proposals/${a.id}`}>Lihat</Link>
                          </Button>
                        ) : (
                          <Button size="sm" asChild>
                            <Link href={`/reviewer/proposals/${a.id}/review`}>
                              {status === 'in_progress' ? 'Lanjutkan' : 'Mulai'}
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Informasi Penting:</strong>
          <ul className="mt-1 ml-4 list-disc text-sm">
            <li>Review bersifat <strong>independen</strong> — Anda tidak bisa melihat review dari reviewer lain</li>
            <li>Hasil review dapat diedit selama fase review masih <strong>DIBUKA</strong></li>
            <li>Setelah fase ditutup admin, review menjadi <strong>FINAL</strong> dan tidak bisa diubah</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
