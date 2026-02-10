'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  proposalFiles: { id: string; fileName: string; uploadedAt: string }[];
  _count: { reviewerAssignments: number };
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

export default function AdminTeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: team, isLoading } = useQuery<TeamDetail>({
    queryKey: ['admin-team', id],
    queryFn: () => api.get(`/teams/${id}`),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/teams"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">{team.namaTeam}</h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-1 h-4 w-4" /> Hapus Tim
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Tim?</AlertDialogTitle>
              <AlertDialogDescription>
                Tim &quot;{team.namaTeam}&quot; beserta semua proposal dan data terkait akan dihapus permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate()}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informasi Tim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Nama Tim:</span>
              <span className="font-medium">{team.namaTeam}</span>
              <span className="text-muted-foreground">Judul Proposal:</span>
              <span>{team.judulProposal || '-'}</span>
              <span className="text-muted-foreground">Jenis PKM:</span>
              <Badge variant="outline">{team.jenisPkm?.nama || '-'}</Badge>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={team.status === 'active' ? 'default' : 'outline'}>{team.status}</Badge>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Open to Join:</span>
              <Badge variant={team.openToJoin ? 'default' : 'outline'}>
                {team.openToJoin ? 'Ya' : 'Tidak'}
              </Badge>
              <span className="text-muted-foreground">Anggota:</span>
              <span>{team._count.teamMembers}/5</span>
              <span className="text-muted-foreground">Dosen Pembimbing:</span>
              <span>{team.dosenPembimbing?.nama || '-'}</span>
              <span className="text-muted-foreground">Dibuat:</span>
              <span>{new Date(team.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Anggota ({team.teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.teamMembers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.mahasiswa.nama}</TableCell>
                    <TableCell className="font-mono text-sm">{m.mahasiswa.nim}</TableCell>
                    <TableCell className="text-sm">{m.mahasiswa.email}</TableCell>
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

      {/* Proposals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Proposals ({team.proposals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-center">Reviewers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.proposals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Belum ada proposal
                    </TableCell>
                  </TableRow>
                )}
                {team.proposals.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="capitalize">{p.type}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[p.status] || 'outline'} className="capitalize">
                        {p.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.proposalFiles[0]?.fileName || 'Belum upload'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{p._count.reviewerAssignments}</Badge>
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
