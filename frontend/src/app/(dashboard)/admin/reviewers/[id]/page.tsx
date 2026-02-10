'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

interface ReviewerDetail {
  id: string;
  nama: string;
  nidn: string | null;
  bidangKeahlian: string | null;
  userId: string;
  user?: { email: string };
  reviewerAssignments: {
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
  }[];
}

export default function AdminReviewerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: reviewer, isLoading } = useQuery<ReviewerDetail>({
    queryKey: ['admin-reviewer', id],
    queryFn: () => api.get(`/reviewers/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!reviewer) {
    return <p className="text-muted-foreground">Reviewer tidak ditemukan</p>;
  }

  const completed = reviewer.reviewerAssignments.filter(
    (a) => a.penilaianAdministrasi?.isComplete && a.penilaianSubstansi?.isComplete,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/reviewers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{reviewer.nama}</h1>
      </div>

      {/* Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informasi Reviewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm max-w-md">
            <span className="text-muted-foreground">Nama:</span>
            <span className="font-medium">{reviewer.nama}</span>
            <span className="text-muted-foreground">Email:</span>
            <span>{reviewer.user?.email || '-'}</span>
            <span className="text-muted-foreground">NIDN:</span>
            <span className="font-mono">{reviewer.nidn || '-'}</span>
            <span className="text-muted-foreground">Bidang Keahlian:</span>
            <span>{reviewer.bidangKeahlian || '-'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{reviewer.reviewerAssignments.length}</p>
            <p className="text-xs text-muted-foreground">Total Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {reviewer.reviewerAssignments.length - completed}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tim</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Administratif</TableHead>
                  <TableHead className="text-center">Substantif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewer.reviewerAssignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      Belum ada assignment
                    </TableCell>
                  </TableRow>
                )}
                {reviewer.reviewerAssignments.map((a) => (
                  <TableRow key={a.id}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
