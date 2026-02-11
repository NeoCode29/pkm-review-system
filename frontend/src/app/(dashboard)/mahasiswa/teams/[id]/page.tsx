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
              <div className="flex flex-wrap gap-2 mt-3">
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
              </div>
            </div>
            {isMyTeam && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/mahasiswa/teams/${id}/edit`}>
                  <Pencil size={14} className="mr-1.5" />
                  Edit Tim
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold">{memberCount}</div>
          <div className="text-xs text-muted-foreground">Anggota Tim</div>
        </div>
        <div className="rounded-lg border p-3 text-center bg-amber-50">
          <div className="text-lg font-bold text-amber-600 uppercase">
            {proposalStatus === 'no_proposal' ? '—' : proposalStatus}
          </div>
          <div className="text-xs text-muted-foreground">Status Proposal</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold">
            {team.dosenPembimbing ? '✓' : '—'}
          </div>
          <div className="text-xs text-muted-foreground">Dosen Pembimbing</div>
        </div>
        <div className="rounded-lg border p-3 text-center bg-amber-50">
          <div className="text-2xl font-bold text-amber-600">
            {pendingRequests.length}
          </div>
          <div className="text-xs text-muted-foreground">Join Requests</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Team Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informasi Tim</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-y-3">
                <span className="text-muted-foreground">Nama Tim</span>
                <span className="font-medium text-right">{team.namaTeam}</span>
                <Separator className="col-span-2" />
                <span className="text-muted-foreground">Judul</span>
                <span className="text-right">{team.judulProposal}</span>
                <Separator className="col-span-2" />
                <span className="text-muted-foreground">Jenis PKM</span>
                <div className="text-right">
                  {team.jenisPkm && (
                    <Badge variant="secondary">{team.jenisPkm.nama}</Badge>
                  )}
                </div>
                <Separator className="col-span-2" />
                <span className="text-muted-foreground">Dibuat pada</span>
                <span className="text-right">
                  {new Date(team.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Dosen Pembimbing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dosen Pembimbing</CardTitle>
            </CardHeader>
            <CardContent>
              {team.dosenPembimbing ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {getInitials(team.dosenPembimbing.nama)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {team.dosenPembimbing.nama}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      NIDN: {team.dosenPembimbing.nidn}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Belum ditentukan. Edit tim untuk menambahkan dosen pembimbing.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Proposal Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              {proposalStatus === 'no_proposal' || proposalStatus === 'draft' ? (
                <div className="space-y-3">
                  <Alert className="border-amber-200 bg-amber-50/50">
                    <AlertDescription className="text-sm">
                      Proposal belum diupload. Upload sebelum deadline submission.
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full" asChild>
                    <Link href={`/mahasiswa/teams/${id}/proposal`}>
                      <Upload size={14} className="mr-2" />
                      Upload Proposal
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Badge className="text-sm px-3 py-1 uppercase">
                    {proposalStatus}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Anggota Tim ({memberCount}/5)
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
        </div>
      </div>

      {/* Danger Zone */}
      {isMyTeam && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Keluar dari Tim</p>
                <p className="text-xs text-muted-foreground">
                  {myRole === 'ketua'
                    ? 'Jika Anda satu-satunya anggota, tim akan dihapus.'
                    : 'Anda akan keluar dari tim ini.'}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowLeaveDialog(true)}
              >
                <LogOut size={14} className="mr-1.5" />
                Keluar dari Tim
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
