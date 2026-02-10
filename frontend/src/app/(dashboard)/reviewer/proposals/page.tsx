'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function ReviewerProposalsPage() {
  const { data, isLoading } = useQuery<ReviewerDashboard>({
    queryKey: ['reviewer-dashboard'],
    queryFn: () => api.get('/dashboard/reviewer'),
  });

  const getStatus = (a: Assignment) => {
    if (a.penilaianAdministrasi?.isComplete && a.penilaianSubstansi?.isComplete) return 'completed';
    if (a.penilaianAdministrasi?.isComplete || a.penilaianSubstansi?.isComplete) return 'in_progress';
    return 'pending';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Daftar Proposal</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{data.stats.totalAssigned}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{data.stats.completed}</p>
            <p className="text-xs text-muted-foreground">Selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{data.stats.pending}</p>
            <p className="text-xs text-muted-foreground">Belum Selesai</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Semua Proposal ({data.assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Tim</TableHead>
                  <TableHead>Judul Proposal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Administratif</TableHead>
                  <TableHead className="text-center">Substantif</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Belum ada proposal yang ditugaskan
                    </TableCell>
                  </TableRow>
                )}
                {data.assignments.map((a, idx) => {
                  const status = getStatus(a);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{a.proposal.team.namaTeam}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {a.proposal.team.judulProposal}
                      </TableCell>
                      <TableCell className="capitalize text-sm">{a.proposal.type}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={a.penilaianAdministrasi?.isComplete ? 'default' : 'outline'}>
                          {a.penilaianAdministrasi?.isComplete ? 'Done' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={a.penilaianSubstansi?.isComplete ? 'default' : 'outline'}>
                          {a.penilaianSubstansi?.isComplete ? 'Done' : 'Pending'}
                        </Badge>
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
                              {status === 'in_progress' ? 'Lanjutkan' : 'Mulai Review'}
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
    </div>
  );
}
