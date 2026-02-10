'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TeamDetail {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkm?: { id: string; nama: string };
  dosenPembimbing?: { id: string; nama: string };
  proposals: {
    id: string;
    type: string;
    status: string;
    _count: { reviewerAssignments: number };
  }[];
}

interface Reviewer {
  id: string;
  nama: string;
  nidn: string | null;
  bidangKeahlian: string | null;
  _count?: { reviewerAssignments: number };
}

export default function AssignReviewerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.id as string;

  const [reviewer1, setReviewer1] = useState('');
  const [reviewer2, setReviewer2] = useState('');

  const { data: team, isLoading: teamLoading } = useQuery<TeamDetail>({
    queryKey: ['admin-team', teamId],
    queryFn: () => api.get(`/teams/${teamId}`),
  });

  const { data: reviewers } = useQuery<Reviewer[]>({
    queryKey: ['admin-reviewers'],
    queryFn: () => api.get('/reviewers'),
  });

  // Find the "original" proposal that is submitted
  const proposal = team?.proposals?.find(
    (p) => p.type === 'original' && ['submitted', 'under_review'].includes(p.status),
  ) || team?.proposals?.find((p) => p.type === 'original');

  const assignMutation = useMutation({
    mutationFn: () =>
      api.post('/admin/assignments', {
        body: {
          proposalId: String(proposal!.id),
          reviewerIds: [reviewer1, reviewer2],
        },
      }),
    onSuccess: () => {
      toast.success('Reviewer berhasil di-assign');
      queryClient.invalidateQueries({ queryKey: ['admin-team', teamId] });
      router.push(`/admin/teams/${teamId}`);
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal assign reviewer'),
  });

  if (teamLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!team || !proposal) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/teams/${teamId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <p className="text-muted-foreground">
          {!team ? 'Tim tidak ditemukan' : 'Tidak ada proposal yang bisa di-assign reviewer'}
        </p>
      </div>
    );
  }

  const alreadyAssigned = (proposal._count?.reviewerAssignments ?? 0) >= 2;

  // Validation
  const r1r2Different = reviewer1 !== reviewer2 || (!reviewer1 && !reviewer2);
  const bothSelected = !!reviewer1 && !!reviewer2;
  const canSubmit = bothSelected && r1r2Different && !alreadyAssigned;

  // Build reviewer options with load info
  const reviewerOptions = (reviewers || []).map((r) => ({
    ...r,
    label: `${r.nama}${r.bidangKeahlian ? ` (${r.bidangKeahlian})` : ''} — ${r._count?.reviewerAssignments ?? 0} assignments`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/teams/${teamId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Assign Reviewers ke Proposal</h1>
      </div>

      {/* Proposal Info */}
      <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Proposal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Team:</span>
            <span className="font-medium">{team.namaTeam}</span>
            <span className="text-muted-foreground">Judul:</span>
            <span>{team.judulProposal}</span>
            <span className="text-muted-foreground">Jenis PKM:</span>
            <Badge variant="outline">{team.jenisPkm?.nama || '-'}</Badge>
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="default" className="capitalize w-fit">{proposal.status.replace(/_/g, ' ')}</Badge>
          </div>
        </CardContent>
      </Card>

      {alreadyAssigned && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Proposal ini sudah memiliki 2 reviewer. Hapus assignment yang ada terlebih dahulu jika ingin mengganti.
          </AlertDescription>
        </Alert>
      )}

      {/* Reviewer Selection */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reviewer 1 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reviewer 1 (R1) <span className="text-destructive">*</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={reviewer1} onValueChange={setReviewer1} disabled={alreadyAssigned}>
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Reviewer 1 --" />
              </SelectTrigger>
              <SelectContent>
                {reviewerOptions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)} disabled={String(r.id) === reviewer2}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reviewer1 && (() => {
              const r = reviewers?.find((x) => String(x.id) === reviewer1);
              if (!r) return null;
              return (
                <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm">
                  <strong>Selected:</strong> {r.nama}<br />
                  <span className="text-muted-foreground">
                    Current load: {r._count?.reviewerAssignments ?? 0} assignments
                  </span>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Reviewer 2 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reviewer 2 (R2) <span className="text-destructive">*</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={reviewer2} onValueChange={setReviewer2} disabled={alreadyAssigned}>
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Reviewer 2 --" />
              </SelectTrigger>
              <SelectContent>
                {reviewerOptions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)} disabled={String(r.id) === reviewer1}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reviewer2 && (() => {
              const r = reviewers?.find((x) => String(x.id) === reviewer2);
              if (!r) return null;
              return (
                <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm">
                  <strong>Selected:</strong> {r.nama}<br />
                  <span className="text-muted-foreground">
                    Current load: {r._count?.reviewerAssignments ?? 0} assignments
                  </span>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Validation Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Validation Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ValidationItem ok={r1r2Different} label="Reviewer 1 dan Reviewer 2 harus berbeda" />
          <ValidationItem ok={bothSelected} label="Kedua reviewer harus dipilih" />
          <ValidationItem ok={!alreadyAssigned} label="Proposal belum memiliki 2 reviewer" />
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <AlertDescription>
          Setelah assign, proposal akan otomatis berubah status menjadi <strong>UNDER_REVIEW</strong> dan reviewer akan dapat melakukan review.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={`/admin/teams/${teamId}`}>Batal</Link>
        </Button>
        <Button
          onClick={() => assignMutation.mutate()}
          disabled={!canSubmit || assignMutation.isPending}
        >
          {assignMutation.isPending ? 'Assigning...' : 'Assign Reviewers'}
        </Button>
      </div>
    </div>
  );
}

function ValidationItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
        {label}
      </span>
    </div>
  );
}
