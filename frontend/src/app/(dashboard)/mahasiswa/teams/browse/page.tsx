'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, PlusCircle, Send, Info, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import type { JenisPkm } from '@/types';

interface BrowseTeam {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkm?: { id: string; nama: string };
  _count: { teamMembers: number };
  openToJoin: boolean;
}

interface BrowseResponse {
  data: BrowseTeam[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function BrowseTeamsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [joinTeam, setJoinTeam] = useState<BrowseTeam | null>(null);
  const [joinMessage, setJoinMessage] = useState('');

  const { data, isLoading } = useQuery<BrowseResponse>({
    queryKey: ['browse-teams', page],
    queryFn: () =>
      api.get<BrowseResponse>('/teams/browse', {
        params: { page, limit: 10 },
      }),
  });

  const { data: jenisPkmList } = useQuery<JenisPkm[]>({
    queryKey: ['jenis-pkm'],
    queryFn: () => api.get<JenisPkm[]>('/master-data/jenis-pkm'),
  });

  const joinMutation = useMutation({
    mutationFn: (teamId: string) =>
      api.post(`/teams/${teamId}/join-requests`, {
        body: { message: joinMessage || undefined },
      }),
    onSuccess: () => {
      toast.success('Request bergabung berhasil dikirim!');
      setJoinTeam(null);
      setJoinMessage('');
      queryClient.invalidateQueries({ queryKey: ['browse-teams'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal mengirim request');
    },
  });

  const teams = data?.data || [];
  const meta = data?.meta;

  const filteredTeams = searchQuery
    ? teams.filter(
        (t) =>
          t.namaTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.judulProposal.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : teams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cari Tim</h1>
        <Button asChild>
          <Link href="/mahasiswa/teams/create">
            <PlusCircle size={16} className="mr-2" />
            Buat Tim
          </Link>
        </Button>
      </div>

      <Alert>
        <Info size={16} />
        <AlertDescription>
          Anda hanya dapat bergabung dengan <strong>1 tim</strong>. Pilih tim
          yang sesuai dengan minat dan keahlian Anda.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Cari nama tim atau judul proposal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3 py-8">
              <Users size={40} className="mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Tidak ada tim yang tersedia.</p>
              <Button asChild>
                <Link href="/mahasiswa/teams/create">Buat Tim Baru</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Menampilkan <strong>{filteredTeams.length}</strong> tim
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="border">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{team.namaTeam}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {team.judulProposal}
                      </p>
                    </div>
                    {team.jenisPkm && (
                      <Badge variant="secondary" className="shrink-0">
                        {team.jenisPkm.nama}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <strong>{team._count.teamMembers}</strong>/5 anggota
                    </span>
                    {team._count.teamMembers < 5 ? (
                      <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">
                        Terbuka
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">
                        Penuh
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {team._count.teamMembers < 5 ? (
                      <Button
                        size="sm"
                        onClick={() => setJoinTeam(team)}
                      >
                        <Send size={14} className="mr-1.5" />
                        Request Bergabung
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="py-1.5 px-3">
                        Tim Sudah Penuh
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </Button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <Card className="bg-muted/50 text-center">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-3">
            Tidak menemukan tim yang cocok?
          </p>
          <Button asChild>
            <Link href="/mahasiswa/teams/create">
              <PlusCircle size={16} className="mr-2" />
              Buat Tim Baru
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Join Request Modal */}
      <Dialog open={!!joinTeam} onOpenChange={() => setJoinTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Request Bergabung</DialogTitle>
          </DialogHeader>
          {joinTeam && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">{joinTeam.namaTeam}</p>
                <p className="text-sm text-muted-foreground">
                  {joinTeam.judulProposal}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Pesan Perkenalan (opsional)</Label>
                <Textarea
                  placeholder="Perkenalkan diri Anda dan jelaskan mengapa tertarik bergabung..."
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Pesan ini akan dilihat oleh anggota tim
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinTeam(null)}>
              Batal
            </Button>
            <Button
              onClick={() => joinTeam && joinMutation.mutate(joinTeam.id)}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? 'Mengirim...' : 'Kirim Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
