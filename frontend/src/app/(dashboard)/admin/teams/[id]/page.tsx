'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Users, FileText, Pencil, UserPlus, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import { ProposalDownloadButton } from '@/components/proposal-download-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TeamMember {
  id: string;
  role: string;
  mahasiswa: { id: string; nama: string; nim: string; email: string };
}

interface Proposal {
  id: string;
  type: string;
  status: string;
  submittedAt: string | null;
  proposalFiles: { id: string; fileName: string; fileSize: number; uploadedAt: string }[];
  _count: { reviewerAssignments: number };
}

interface Assignment {
  id: string;
  reviewerNumber: number;
  reviewerUser: { id: string; nama: string; nidn: string | null };
  penilaianAdministrasi?: { isComplete: boolean } | null;
  penilaianSubstansi?: { isComplete: boolean } | null;
}

interface TeamDetail {
  id: string;
  namaTeam: string;
  judulProposal: string;
  status: string;
  openToJoin: boolean;
  createdAt: string;
  jenisPkm?: { id: string; nama: string };
  dosenPembimbing?: { id: string; nama: string; nidn: string; email: string; noHp: string };
  teamMembers: TeamMember[];
  proposals: Proposal[];
  _count: { teamMembers: number };
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  submitted: 'default',
  under_review: 'secondary',
  reviewed: 'default',
  needs_revision: 'destructive',
};

const VALID_STATUSES = ['draft', 'submitted', 'under_review', 'reviewed', 'not_reviewed', 'needs_revision', 'revised'];

export default function AdminTeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [overrideStatus, setOverrideStatus] = useState<string>('');

  const { data: team, isLoading } = useQuery<TeamDetail>({
    queryKey: ['admin-team', id],
    queryFn: () => api.get(`/teams/${id}`),
  });

  const originalProposal = team?.proposals?.find((p) => p.type === 'original');
  const revisedProposal = team?.proposals?.find((p) => p.type === 'revised');

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ['admin-assignments', originalProposal?.id],
    queryFn: () => api.get(`/admin/assignments/proposal/${originalProposal!.id}`),
    enabled: !!originalProposal?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/teams/${id}`),
    onSuccess: () => {
      toast.success('Tim berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      router.push('/admin/teams');
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus tim'),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ proposalId, status }: { proposalId: string; status: string }) =>
      api.put(`/proposals/${proposalId}/override-status`, { body: { status } }),
    onSuccess: () => {
      toast.success('Status proposal berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['admin-team', id] });
      setOverrideStatus('');
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal mengubah status'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!team) {
    return <p className="text-muted-foreground">Tim tidak ditemukan</p>;
  }

  const canAssign = originalProposal &&
    ['submitted', 'under_review'].includes(originalProposal.status) &&
    (originalProposal._count.reviewerAssignments ?? 0) < 2;

  const proposalCount = team.proposals.length;
  const reviewCount = assignments?.filter((a) => a.penilaianAdministrasi?.isComplete || a.penilaianSubstansi?.isComplete).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/teams"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">{team.namaTeam}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/teams/${id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Link>
          </Button>
          {canAssign && (
            <Button size="sm" asChild>
              <Link href={`/admin/teams/${id}/assign`}>
                <UserPlus className="mr-1 h-4 w-4" /> Assign Reviewers
              </Link>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1 h-4 w-4" /> Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Hapus Tim?
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>PERINGATAN: Ini akan menghapus:</p>
                    <ul className="list-disc ml-4 space-y-1 text-sm">
                      <li>Team <strong>&quot;{team.namaTeam}&quot;</strong> beserta <strong>{team.teamMembers.length}</strong> anggota</li>
                      <li><strong>{proposalCount}</strong> proposal</li>
                      <li><strong>{reviewCount}</strong> review yang sudah dibuat</li>
                    </ul>
                    <p className="font-semibold text-destructive">Aksi ini TIDAK BISA DIBATALKAN!</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Ya, Hapus Permanen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Team Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informasi Tim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
                <span className="text-muted-foreground">Nama Tim:</span>
                <span className="font-medium">{team.namaTeam}</span>
                <span className="text-muted-foreground">Judul Proposal:</span>
                <span>{team.judulProposal || '-'}</span>
                <span className="text-muted-foreground">Jenis PKM:</span>
                <Badge variant="outline" className="w-fit">{team.jenisPkm?.nama || '-'}</Badge>
                <span className="text-muted-foreground">Dosen Pembimbing:</span>
                <span>{team.dosenPembimbing?.nama || '-'}</span>
                <span className="text-muted-foreground">Open to Join:</span>
                <Badge variant={team.openToJoin ? 'default' : 'outline'} className="w-fit">
                  {team.openToJoin ? 'Ya' : 'Tidak'}
                </Badge>
                <span className="text-muted-foreground">Dibuat:</span>
                <span>{new Date(team.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Anggota ({team.teamMembers.length}/5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIM</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.teamMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.mahasiswa.nama}</TableCell>
                        <TableCell className="font-mono text-sm">{m.mahasiswa.nim}</TableCell>
                        <TableCell>
                          <Badge variant={m.role === 'ketua' ? 'default' : 'outline'} className="capitalize">
                            {m.role}
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* Proposal Original */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Proposal Original
              </CardTitle>
            </CardHeader>
            <CardContent>
              {originalProposal ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center flex-col gap-2 py-4">
                    <Badge
                      variant={STATUS_BADGE[originalProposal.status] || 'outline'}
                      className="capitalize text-base px-4 py-1"
                    >
                      {originalProposal.status.replace(/_/g, ' ')}
                    </Badge>
                    {originalProposal.submittedAt && (
                      <span className="text-xs text-muted-foreground">
                        Submitted: {new Date(originalProposal.submittedAt).toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>
                  {originalProposal.proposalFiles[0] && (
                    <div className="border-t pt-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{originalProposal.proposalFiles[0].fileName}</span>
                        <span className="text-muted-foreground ml-2">
                          ({(originalProposal.proposalFiles[0].fileSize / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <ProposalDownloadButton proposalId={String(originalProposal.id)} />
                    </div>
                  )}
                  {/* Override Status */}
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Override Status</p>
                    <div className="flex gap-2">
                      <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                        <SelectTrigger className="flex-1 h-8 text-xs">
                          <SelectValue placeholder="Pilih status baru..." />
                        </SelectTrigger>
                        <SelectContent>
                          {VALID_STATUSES.filter((s) => s !== originalProposal.status).map((s) => (
                            <SelectItem key={s} value={s} className="capitalize text-xs">
                              {s.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        disabled={!overrideStatus || overrideMutation.isPending}
                        onClick={() => overrideMutation.mutate({ proposalId: String(originalProposal.id), status: overrideStatus })}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        {overrideMutation.isPending ? 'Updating...' : 'Override'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada proposal</p>
              )}
            </CardContent>
          </Card>

          {/* Proposal Revised */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Proposal Revised
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revisedProposal ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center flex-col gap-2 py-3">
                    <Badge
                      variant={STATUS_BADGE[revisedProposal.status] || 'outline'}
                      className="capitalize text-sm px-3 py-0.5"
                    >
                      {revisedProposal.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {revisedProposal.proposalFiles[0] ? (
                    <div className="border-t pt-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{revisedProposal.proposalFiles[0].fileName}</span>
                        <span className="text-muted-foreground ml-2">
                          ({(revisedProposal.proposalFiles[0].fileSize / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <ProposalDownloadButton proposalId={String(revisedProposal.id)} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center border-t pt-3">Belum ada file revisi</p>
                  )}
                  <p className="text-xs text-muted-foreground text-center">Proposal revised untuk dokumentasi (tidak direview)</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada proposal revised</p>
              )}
            </CardContent>
          </Card>

          {/* Assigned Reviewers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assigned Reviewers</CardTitle>
            </CardHeader>
            <CardContent>
              {!assignments || assignments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Belum ada reviewer yang di-assign</p>
                  {canAssign && (
                    <Button size="sm" asChild>
                      <Link href={`/admin/teams/${id}/assign`}>
                        <UserPlus className="mr-1 h-3 w-3" /> Assign Reviewers
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a) => {
                    const adminDone = a.penilaianAdministrasi?.isComplete;
                    const subsDone = a.penilaianSubstansi?.isComplete;
                    const allDone = adminDone && subsDone;
                    const inProgress = adminDone || subsDone;
                    return (
                      <div key={a.id} className="rounded-md border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Reviewer {a.reviewerNumber}:</span>{' '}
                            <span className="text-sm">{a.reviewerUser.nama}</span>
                          </div>
                          <Badge variant={allDone ? 'default' : inProgress ? 'secondary' : 'outline'}>
                            {allDone ? 'COMPLETED' : inProgress ? 'IN PROGRESS' : 'NOT STARTED'}
                          </Badge>
                        </div>
                        {(adminDone || subsDone) && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/teams/${id}/review/${a.id}`}>
                              <Eye className="mr-1 h-3 w-3" /> View Review
                            </Link>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/teams/${id}/edit`}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit Team
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-1 h-4 w-4" /> Delete Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" /> Hapus Tim?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>PERINGATAN: Ini akan menghapus:</p>
                        <ul className="list-disc ml-4 space-y-1 text-sm">
                          <li>Team <strong>&quot;{team.namaTeam}&quot;</strong> beserta <strong>{team.teamMembers.length}</strong> anggota</li>
                          <li><strong>{proposalCount}</strong> proposal</li>
                          <li><strong>{reviewCount}</strong> review yang sudah dibuat</li>
                        </ul>
                        <p className="font-semibold text-destructive">Aksi ini TIDAK BISA DIBATALKAN!</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Ya, Hapus Permanen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
