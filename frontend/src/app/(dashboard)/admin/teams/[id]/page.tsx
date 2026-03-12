'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Users, FileText, Pencil, UserPlus, Eye, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { ProposalDownloadButton } from '@/components/proposal-download-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  mahasiswa: {
    id: string;
    nama: string;
    nim: string;
    email: string;
    programStudi?: { id: string; nama: string };
  };
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
  not_reviewed: 'destructive',
  revised: 'secondary',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/teams"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{team.namaTeam}</h1>
            <p className="text-muted-foreground text-sm">{team.judulProposal || 'Belum ada judul'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {originalProposal && (
            <Badge
              variant={STATUS_BADGE[originalProposal.status] || 'outline'}
              className="capitalize text-sm mr-4"
            >
              {originalProposal.status.replace(/_/g, ' ')}
            </Badge>
          )}
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
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="space-y-6 lg:flex-1 min-w-0">
          {/* Team Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" /> Detail Tim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                <span className="text-muted-foreground">Nama Tim</span>
                <span className="font-medium">{team.namaTeam}</span>
                <Separator className="col-span-2" />
                <span className="text-muted-foreground">Judul Proposal</span>
                <span>{team.judulProposal || '-'}</span>
                <Separator className="col-span-2" />
                <span className="text-muted-foreground">Jenis PKM</span>
                <Badge variant="outline" className="w-fit">{team.jenisPkm?.nama || '-'}</Badge>
                <Separator className="col-span-2" />
                <span className="text-muted-foreground">Dosen Pembimbing</span>
                <div>
                  {team.dosenPembimbing ? (
                    <div>
                      <span className="font-medium block">{team.dosenPembimbing.nama}</span>
                      <span className="text-xs text-muted-foreground block">NIDN: {team.dosenPembimbing.nidn}</span>
                      <span className="text-xs text-muted-foreground block">Kontak: {team.dosenPembimbing.noHp} / {team.dosenPembimbing.email}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Belum ditentukan</span>
                  )}
                </div>
                <Separator className="col-span-2" />
                <span className="text-muted-foreground">Open to Join</span>
                <Badge variant={team.openToJoin ? 'default' : 'outline'} className="w-fit">
                  {team.openToJoin ? 'Ya' : 'Tidak'}
                </Badge>
                <Separator className="col-span-2" />
                <span className="text-muted-foreground">Dibuat</span>
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
                      <TableHead>Prodi</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.teamMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          {m.mahasiswa.nama}
                          <span className="block text-xs text-muted-foreground">{m.mahasiswa.email}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{m.mahasiswa.nim}</TableCell>
                        <TableCell className="text-sm">{m.mahasiswa.programStudi?.nama || '-'}</TableCell>
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
        <div className="space-y-6 lg:flex-1 min-w-0">
          {/* Proposal Status & Files */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Dokumen Proposal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active / Original Proposal */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Dokumen Utama (Original)</span>
                  {originalProposal && originalProposal.submittedAt && (
                    <span className="text-xs text-muted-foreground">
                      Submisi: {new Date(originalProposal.submittedAt).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>
                {originalProposal && originalProposal.proposalFiles[0] ? (
                  <div className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm bg-muted/20">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{originalProposal.proposalFiles[0].fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(originalProposal.proposalFiles[0].fileSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <ProposalDownloadButton proposalId={String(originalProposal.id)} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-muted/10 p-3 rounded-md border text-center">Belum ada file diupload</p>
                )}

                {/* Override Status block for original (since that dictates workflow) */}
                {originalProposal && (
                  <div className="mt-4 pt-3 border-t">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Override Status Proposal</label>
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
                )}
              </div>

              {/* Revised Proposal (If exists) */}
              {(revisedProposal && revisedProposal.proposalFiles[0]) && (
                <>
                  <Separator />
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">Dokumen Revisi</span>
                      <Badge variant="secondary" className="text-xs">
                        {revisedProposal.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm bg-amber-50/50">
                      <div className="min-w-0">
                        <p className="font-medium truncate text-amber-900">{revisedProposal.proposalFiles[0].fileName}</p>
                        <p className="text-xs text-amber-700/70">
                          {(revisedProposal.proposalFiles[0].fileSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <ProposalDownloadButton proposalId={String(revisedProposal.id)} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">Dokumen revisi disimpan hanya sebagai arsip</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Assigned Reviewers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Assigned Reviewers</span>
                {assignments && assignments.length > 0 && (
                  <Badge variant="secondary">{assignments.length}/2</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!assignments || assignments.length === 0 ? (
                <div className="text-center py-6 bg-muted/10 rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground mb-3">Belum ada reviewer yang di-assign</p>
                  {canAssign && (
                    <Button size="sm" asChild>
                      <Link href={`/admin/teams/${id}/assign`}>
                        <UserPlus className="mr-1 h-3 w-3" /> Assign Reviewer
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
                      <div key={a.id} className="rounded-md border p-3 space-y-2 flex flex-col">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-medium text-sm block">Reviewer {a.reviewerNumber}:</span>
                            <span className="text-sm text-muted-foreground">{a.reviewerUser.nama}</span>
                          </div>
                          <Badge variant={allDone ? 'default' : inProgress ? 'secondary' : 'outline'} className="text-[10px]">
                            {allDone ? 'COMPLETED' : inProgress ? 'IN PROGRESS' : 'NOT STARTED'}
                          </Badge>
                        </div>
                        {(adminDone || subsDone) && (
                          <Button size="sm" variant="outline" className="w-full mt-2" asChild>
                            <Link href={`/admin/teams/${id}/review/${a.id}`}>
                              <Eye className="mr-1 h-3 w-3" /> Lihat Hasil Review
                            </Link>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {canAssign && (
                    <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                      <Link href={`/admin/teams/${id}/assign`}>
                        <UserPlus className="mr-1 h-3 w-3" /> Assign Reviewer Tambahan
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card className="border-destructive/30 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-destructive uppercase tracking-wider font-semibold">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-1 h-4 w-4" /> Hapus Tim
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" /> Konfirmasi Penghapusan
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>PERINGATAN: Tindakan ini akan menghapus:</p>
                        <ul className="list-disc ml-4 space-y-1 text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                          <li>Team <strong>&quot;{team.namaTeam}&quot;</strong></li>
                          <li><strong>{team.teamMembers.length}</strong> daftar anggota keanggotaan</li>
                          <li><strong>{proposalCount}</strong> file proposal utuh</li>
                          <li><strong>{reviewCount}</strong> catatan review terkait</li>
                        </ul>
                        <p className="font-semibold text-destructive mt-4">Ketik atau klik untuk konfirmasi, aksi TIDAK BISA DIBATALKAN!</p>
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
