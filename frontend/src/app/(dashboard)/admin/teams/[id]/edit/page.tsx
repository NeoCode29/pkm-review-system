'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [openToJoin, setOpenToJoin] = useState('true');
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
      setJenisPkmId(String(team.jenisPkm?.id || team.jenisPkmId));
      setOpenToJoin(team.openToJoin ? 'true' : 'false');
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
          openToJoin: openToJoin === 'true',
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/teams/${teamId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Team</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/teams/${teamId}`}>Batal</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Basic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Select value={jenisPkmId} onValueChange={setJenisPkmId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis PKM" />
                </SelectTrigger>
                <SelectContent>
                  {jenisPkmList?.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Open to Join</Label>
              <Select value={openToJoin} onValueChange={setOpenToJoin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes - Menerima anggota baru</SelectItem>
                  <SelectItem value="false">No - Tidak menerima anggota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status Proposal (Info)</Label>
              <Badge variant="outline" className="capitalize text-sm">
                {proposalStatus ? proposalStatus.replace(/_/g, ' ') : 'No proposal'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Right: Members */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Manage Members ({team.teamMembers.length}/5)
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
                      <TableHead className="w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.teamMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-sm">{m.mahasiswa.nama}</TableCell>
                        <TableCell className="font-mono text-sm">{m.mahasiswa.nim}</TableCell>
                        <TableCell>
                          <Select
                            value={m.role}
                            onValueChange={(role) =>
                              updateMemberRoleMutation.mutate({ memberId: m.id, role })
                            }
                          >
                            <SelectTrigger className="w-[110px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ketua">Ketua</SelectItem>
                              <SelectItem value="anggota">Anggota</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={m.role === 'ketua'}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {m.mahasiswa.nama} akan dikeluarkan dari tim.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeMemberMutation.mutate(m.id)}>
                                  Hapus
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
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>Rules:</strong>
              <ul className="mt-1 ml-4 list-disc text-sm">
                <li>Team harus memiliki tepat 1 Ketua</li>
                <li>Ketua tidak bisa dihapus dari team</li>
                <li>Max 5 anggota per team</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Save */}
      <Card>
        <CardContent className="flex justify-end gap-3 p-4">
          <Button variant="outline" asChild>
            <Link href={`/admin/teams/${teamId}`}>Batal</Link>
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!namaTeam || !jenisPkmId || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
