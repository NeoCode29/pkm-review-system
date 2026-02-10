'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Team {
  id: string;
  namaTeam: string;
  judulProposal: string;
  status: string;
  openToJoin: boolean;
  jenisPkm?: { id: string; nama: string };
  _count: { teamMembers: number };
  proposals?: { status: string }[];
}

interface TeamsResponse {
  data: Team[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface JenisPkm {
  id: string;
  nama: string;
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  submitted: 'default',
  under_review: 'secondary',
  reviewed: 'default',
  needs_revision: 'destructive',
};

export default function AdminTeamsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [jenisPkmFilter, setJenisPkmFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  const { data: jenisPkmList } = useQuery<JenisPkm[]>({
    queryKey: ['jenis-pkm'],
    queryFn: () => api.get('/master-data/jenis-pkm'),
  });

  const { data, isLoading } = useQuery<TeamsResponse>({
    queryKey: ['admin-teams', page, jenisPkmFilter, statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (jenisPkmFilter !== 'all') params.set('jenisPkmId', jenisPkmFilter);
      if (statusFilter !== 'all') params.set('proposalStatus', statusFilter);
      if (search) params.set('search', search);
      return api.get(`/teams?${params}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: string) => api.delete(`/teams/${teamId}`),
    onSuccess: () => {
      toast.success('Tim berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus tim'),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const getProposalStatus = (team: Team) => {
    if (!team.proposals?.length) return 'no_proposal';
    return team.proposals[0]?.status || 'draft';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manajemen Team</h1>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={jenisPkmFilter} onValueChange={(v) => { setJenisPkmFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Jenis PKM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis PKM</SelectItem>
                {jenisPkmList?.map((j) => (
                  <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status Proposal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="needs_revision">Needs Revision</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Cari nama tim atau judul..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Team List ({data?.meta.total ?? 0} teams)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Tim</TableHead>
                      <TableHead>Judul Proposal</TableHead>
                      <TableHead>Jenis PKM</TableHead>
                      <TableHead className="text-center">Anggota</TableHead>
                      <TableHead>Status Proposal</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Tidak ada tim ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                    {data?.data.map((team) => {
                      const pStatus = getProposalStatus(team);
                      return (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.namaTeam}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {team.judulProposal || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{team.jenisPkm?.nama || '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{team._count.teamMembers}/5</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGE[pStatus] || 'outline'} className="capitalize">
                              {pStatus.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/teams/${team.id}`}>
                                  <Eye className="mr-1 h-3 w-3" /> Detail
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-3 w-3" />
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
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(team.id)}>
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {data.meta.page} of {data.meta.totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
