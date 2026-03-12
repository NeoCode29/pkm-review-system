'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Shield, Info, RotateCcw, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
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
  mahasiswa: { id: string; nama: string; nim: string };
}

interface TeamDetail {
  id: string;
  namaTeam: string;
  judulProposal: string;
  status: string;
  openToJoin: boolean;
  jenisPkmId: string;
  jenisPkm?: { id: string; nama: string };
  dosenPembimbing?: { id: string; nama: string; nidn: string; email: string; noHp: string };
  teamMembers: TeamMember[];
  proposals: { id: string; type: string; status: string }[];
}

interface JenisPkm { id: string; nama: string }

const PROPOSAL_STATUSES = ['draft', 'submitted', 'under_review', 'reviewed', 'not_reviewed', 'needs_revision', 'revised'];

export default function AdminTeamEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.id as string;

  const [namaTeam, setNamaTeam] = useState('');
  const [judulProposal, setJudulProposal] = useState('');
  const [jenisPkmId, setJenisPkmId] = useState('');
  const [openToJoin, setOpenToJoin] = useState(true);
  const [proposalStatus, setProposalStatus] = useState('');

  const { data: team, isLoading } = useQuery<TeamDetail>({
    queryKey: ['admin-team', teamId],
    queryFn: () => api.get(`/teams/${teamId}`),
  });

  const { data: jenisPkmList } = useQuery<JenisPkm[]>({
    queryKey: ['jenis-pkm'],
    queryFn: () => api.get('/master-data/jenis-pkm'),
  });

  useEffect(() => {
    if (team) {
      setNamaTeam(team.namaTeam);
      setJudulProposal(team.judulProposal || '');
      setJenisPkmId(String(team.jenisPkm?.id || team.jenisPkmId || ''));
      setOpenToJoin(team.openToJoin);
      const originalProposal = team.proposals?.find((p) => p.type === 'original');
      if (originalProposal) setProposalStatus(originalProposal.status);
    }
  }, [team]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/teams/${teamId}`, {
        body: {
          namaTeam,
          judulProposal,
          jenisPkmId,
          openToJoin,
        },
      }),
    onSuccess: () => {
      toast.success('Tim berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['admin-team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal memperbarui tim'),
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.put(`/teams/${teamId}/members/${memberId}/role`, { body: { role } }),
    onSuccess: () => {
      toast.success('Role berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['admin-team', teamId] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal mengubah role'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => api.delete(`/teams/${teamId}/members/${memberId}`),
    onSuccess: () => {
      toast.success('Anggota berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['admin-team', teamId] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus anggota'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!team) return <p className="text-muted-foreground">Tim tidak ditemukan</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/teams/${teamId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Edit Team</h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20"><Shield className="w-3 h-3 mr-1"/> Admin Mode</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{team.namaTeam}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4"/> Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nama Team <span className="text-destructive">*</span></Label>
                <Input value={namaTeam} onChange={(e) => setNamaTeam(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Judul Proposal <span className="text-destructive">*</span></Label>
                <Input value={judulProposal} onChange={(e) => setJudulProposal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Jenis PKM <span className="text-destructive">*</span></Label>
                <Select value={jenisPkmId || ""} onValueChange={setJenisPkmId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Jenis PKM" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisPkmList?.map((j) => (
                      <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Open Recruitment</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aktifkan agar mahasiswa lain bisa _request_ join ke dalam tim ini.
                  </p>
                </div>
                <Switch
                  checked={openToJoin}
                  onCheckedChange={setOpenToJoin}
                  disabled={updateMutation.isPending}
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right: Members & Read Only Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">
                Kelola Anggota ({team.teamMembers.length}/5)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Mahasiswa</TableHead>
                      <TableHead className="w-[120px]">Role</TableHead>
                      <TableHead className="w-12 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.teamMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="py-2.5">
                          <p className="font-medium text-sm leading-tight">{m.mahasiswa.nama}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.mahasiswa.nim}</p>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Select
                            value={m.role}
                            onValueChange={(role) =>
                              updateMemberRoleMutation.mutate({ memberId: m.id, role })
                            }
                          >
                            <SelectTrigger className="w-[100px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ketua" className="text-xs">Ketua</SelectItem>
                              <SelectItem value="anggota" className="text-xs">Anggota</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={m.role === 'ketua'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{m.mahasiswa.nama}</strong> akan dikeluarkan dari tim.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeMemberMutation.mutate(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Ya, Keluarkan
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic text-center">
                Info: Hanya anggota dengan role selain "Ketua" yang dapat dikeluarkan. Ketua tim tidak bisa dihapus. Team harus memiliki tepat 1 Ketua.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/10">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-medium">Informasi Proposal (Read Only)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status Proposal (Original):</span>
                <Badge variant="outline" className="capitalize text-xs font-semibold px-2 py-0.5 border-primary text-primary">
                  {proposalStatus ? proposalStatus.replace(/_/g, ' ') : 'No proposal'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground italic mt-2">Status proposal hanya dapat di-override melalui halaman detail, bukan di halaman edit data tim demi menjaga Workflow State.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex bg-card p-4 rounded-xl border items-center justify-between sticky bottom-6 shadow-md shadow-black/5">
        <Button variant="outline" type="button" onClick={() => router.push(`/admin/teams/${teamId}`)}>
          Batal Edit
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (team) {
                setNamaTeam(team.namaTeam);
                setJudulProposal(team.judulProposal || '');
                setJenisPkmId(String(team.jenisPkm?.id || team.jenisPkmId || ''));
                setOpenToJoin(team.openToJoin);
              }
            }}
            disabled={updateMutation.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button
            type="button"
            onClick={() => updateMutation.mutate()}
            disabled={!namaTeam || !jenisPkmId || updateMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Menyimpan Semua Data...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
