'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Pencil,
  Upload,
  Check,
  X,
  LogOut,
  Trash2,
  Info,
  Users,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';

interface TeamMember {
  id: string;
  role: string;
  mahasiswa: {
    id: string;
    nama: string;
    nim: string;
    programStudi?: { nama: string };
  };
}

interface JoinRequest {
  id: string;
  status: string;
  message?: string;
  mahasiswa: {
    nama: string;
    nim: string;
    programStudi?: { nama: string };
  };
  createdAt: string;
}

interface TeamDetail {
  id: string;
  namaTeam: string;
  judulProposal: string;
  openToJoin: boolean;
  createdAt: string;
  jenisPkm?: { id: string; nama: string };
  dosenPembimbing?: { id: string; nama: string; nidn: string; email?: string };
  teamMembers: TeamMember[];
  proposals: { id: string; status: string }[];
  _count: { teamMembers: number };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const [kickMember, setKickMember] = useState<TeamMember | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { data: team, isLoading } = useQuery<TeamDetail>({
    queryKey: ['team', id],
    queryFn: () => api.get<TeamDetail>(`/teams/${id}`),
  });

  const { data: joinRequests } = useQuery<JoinRequest[]>({
    queryKey: ['team-join-requests', id],
    queryFn: () => api.get<JoinRequest[]>(`/teams/${id}/join-requests`),
    enabled: !!team,
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) =>
      api.put(`/teams/join-requests/${requestId}/approve`),
    onSuccess: () => {
      toast.success('Request disetujui');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['team-join-requests', id] });
      queryClient.invalidateQueries({ queryKey: ['mahasiswa-dashboard'] });
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || 'Gagal approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      api.put(`/teams/join-requests/${requestId}/reject`),
    onSuccess: () => {
      toast.success('Request ditolak');
      queryClient.invalidateQueries({ queryKey: ['team-join-requests', id] });
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || 'Gagal reject'),
  });

  const kickMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/teams/${id}/members/${memberId}`),
    onSuccess: () => {
      toast.success('Anggota dikeluarkan');
      setKickMember(null);
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['mahasiswa-dashboard'] });
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || 'Gagal mengeluarkan anggota'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => {
      const myMember = team?.teamMembers.find(
        (m) => profile && 'nim' in profile && m.mahasiswa.nim === profile.nim,
      );
      if (!myMember) throw new Error('Member not found');
      return api.delete(`/teams/${id}/members/${myMember.id}`);
    },
    onSuccess: () => {
      toast.success('Anda telah keluar dari tim');
      queryClient.invalidateQueries({ queryKey: ['mahasiswa-dashboard'] });
      router.push('/mahasiswa/dashboard');
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || 'Gagal keluar dari tim'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <Alert variant="destructive">
        <Info size={16} />
        <AlertDescription>Tim tidak ditemukan.</AlertDescription>
      </Alert>
    );
  }

  const memberCount = team._count.teamMembers;
  const proposalStatus = team.proposals[0]?.status || 'no_proposal';
  const hasReviewedProposal = team.proposals.some(
    (p) => ['reviewed', 'need_revision', 'revised'].includes(p.status)
  );
  const pendingRequests =
    joinRequests?.filter((r) => r.status === 'pending') || [];
  const isMyTeam = team.teamMembers.some(
    (m) => profile && 'nim' in profile && m.mahasiswa.nim === profile.nim,
  );
  const myRole = team.teamMembers.find(
    (m) => profile && 'nim' in profile && m.mahasiswa.nim === profile.nim,
  )?.role;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/mahasiswa/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Detail Tim</h1>
      </div>

      {/* Team Header */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary">
                {team.namaTeam}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {team.judulProposal}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {team.jenisPkm && (
                  <Badge variant="secondary">{team.jenisPkm.nama}</Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    team.openToJoin
                      ? 'text-green-600 border-green-300'
                      : 'text-muted-foreground'
                  }
                >
                  {team.openToJoin ? '✓ Terbuka' : 'Tertutup'}
                </Badge>
                <Separator orientation="vertical" className="h-4" />
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 uppercase">
                  {proposalStatus === 'no_proposal' ? 'BELUM ADA PROPOSAL' : proposalStatus.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
            {isMyTeam && (
              <div className="flex flex-col gap-2 min-w-[140px]">
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={`/mahasiswa/teams/${id}/edit`}>
                    <Pencil size={14} className="mr-1.5" />
                    Edit Tim
                  </Link>
                </Button>
                <Button size="sm" variant="default" className="w-full" asChild>
                  <Link href={`/mahasiswa/teams/${id}/proposal`}>
                    <Upload size={14} className="mr-1.5" />
                    Manajemen Proposal
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Results Card (If Reviewed) */}
      {hasReviewedProposal && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-800 mb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <BarChart3 size={18} />
              Hasil Review Proposal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">Proposal Anda telah selesai direview!</p>
                <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1">
                  Lihat hasil penilaian administratif dan substantif untuk mengetahui evaluasi dari reviewer.
                </p>
              </div>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0" asChild>
                <Link href={`/mahasiswa/teams/${id}/review-results`}>
                  <BarChart3 className="mr-2 h-4 w-4" /> Lihat Hasil Review
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Team Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" /> Informasi Tim
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-y-1 md:gap-y-3">
                <span className="text-muted-foreground text-xs md:text-sm">Nama Tim</span>
                <span className="font-medium break-words mb-2 md:mb-0 md:text-right">{team.namaTeam}</span>
                <Separator className="col-span-1 md:col-span-2 hidden md:block" />
                <span className="text-muted-foreground text-xs md:text-sm">Judul</span>
                <span className="break-words mb-2 md:mb-0 md:text-right leading-relaxed">{team.judulProposal}</span>
                <Separator className="col-span-1 md:col-span-2 hidden md:block" />
                <span className="text-muted-foreground text-xs md:text-sm">Jenis PKM</span>
                <div className="mb-2 md:mb-0 md:text-right">
                  {team.jenisPkm ? (
                    <Badge variant="secondary">{team.jenisPkm.nama}</Badge>
                  ) : (
                    '-'
                  )}
                </div>
                <Separator className="col-span-1 md:col-span-2 hidden md:block" />
                <span className="text-muted-foreground text-xs md:text-sm">Dibuat pada</span>
                <span className="mb-2 md:mb-0 md:text-right">
                  {new Date(team.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <Separator className="col-span-1 md:col-span-2 hidden md:block" />
                <span className="text-muted-foreground text-xs md:text-sm">Dosen Pembimbing</span>
                <div className="mb-1 md:mb-0 md:text-right">
                  {team.dosenPembimbing ? (
                    <div>
                      <span className="font-medium block">{team.dosenPembimbing.nama}</span>
                      <span className="text-xs text-muted-foreground">NIDN: {team.dosenPembimbing.nidn}</span>
                    </div>
                  ) : (
                    <span className="text-destructive font-medium italic">Belum ditentukan</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Anggota Tim ({memberCount}/5)
                </CardTitle>
                {memberCount >= 5 && (
                  <Badge variant="secondary">Penuh</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {team.teamMembers.map((member) => {
                const isMe =
                  profile &&
                  'nim' in profile &&
                  member.mahasiswa.nim === profile.nim;
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      isMe ? 'bg-muted/50 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {getInitials(member.mahasiswa.nama)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {member.mahasiswa.nama}
                        </span>
                        {member.role === 'ketua' && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Ketua
                          </Badge>
                        )}
                        {isMe && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 text-green-600 border-green-300"
                          >
                            Anda
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.mahasiswa.nim}
                        {member.mahasiswa.programStudi &&
                          ` • ${member.mahasiswa.programStudi.nama}`}
                      </p>
                    </div>
                    {isMyTeam && !isMe && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => setKickMember(member)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Join Requests */}
          {isMyTeam && pendingRequests.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-amber-700">
                    Permintaan Bergabung
                  </CardTitle>
                  <Badge variant="secondary">{pendingRequests.length} Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="rounded-lg border bg-background p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {getInitials(req.mahasiswa.nama)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {req.mahasiswa.nama}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {req.mahasiswa.nim}
                        </p>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-xs text-muted-foreground italic pl-12">
                        &quot;{req.message}&quot;
                      </p>
                    )}
                    <div className="flex gap-2 pl-12">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveMutation.mutate(req.id)}
                        disabled={approveMutation.isPending}
                      >
                        <Check size={14} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(req.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X size={14} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}

                {memberCount >= 5 && (
                  <Alert className="border-amber-200 bg-amber-50/50">
                    <AlertDescription className="text-xs">
                      Tim sudah penuh. Keluarkan anggota terlebih dahulu untuk approve request baru.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          {isMyTeam && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-3 border-b mb-3">
                <CardTitle className="text-base text-destructive">
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Keluar dari Tim</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-1">
                      {myRole === 'ketua'
                        ? 'Jika Anda satu-satunya anggota, tim akan dihapus.'
                        : 'Anda akan keluar dari tim ini.'}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0"
                    onClick={() => setShowLeaveDialog(true)}
                  >
                    <LogOut size={14} className="mr-1.5" />
                    Keluar dari Tim
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Kick Confirmation Dialog */}
      <Dialog open={!!kickMember} onOpenChange={() => setKickMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Kick Member</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengeluarkan{' '}
              <strong>{kickMember?.mahasiswa.nama}</strong> dari tim?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKickMember(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => kickMember && kickMutation.mutate(kickMember.id)}
              disabled={kickMutation.isPending}
            >
              {kickMutation.isPending ? 'Mengeluarkan...' : 'Ya, Kick Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Team Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Keluar Tim</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin keluar dari{' '}
              <strong>{team.namaTeam}</strong>?
              {myRole === 'ketua' && (
                <span className="block mt-2 text-destructive">
                  Anda adalah ketua tim. Jika keluar, salah satu anggota akan
                  dipilih menjadi ketua baru.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? 'Keluar...' : 'Ya, Keluar dari Tim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
