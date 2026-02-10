'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

interface Assignment {
  id: string;
  reviewerNumber: number;
  proposal: {
    id: string;
    type: string;
    status: string;
    team: { id: string; namaTeam: string; judulProposal: string; jenisPkm?: { nama: string } };
  };
  penilaianAdministrasi?: { isComplete: boolean };
  penilaianSubstansi?: { isComplete: boolean };
}

interface ReviewerDashboard {
  reviewer: { id: string; nama: string };
  stats: { totalAssigned: number; completed: number; pending: number };
  assignments: Assignment[];
}

const getStatus = (a: Assignment) => {
  if (a.penilaianAdministrasi?.isComplete && a.penilaianSubstansi?.isComplete) return 'completed';
  if (a.penilaianAdministrasi?.isComplete || a.penilaianSubstansi?.isComplete) return 'in_progress';
  return 'pending';
};

export default function ReviewerProposalsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [jenisPkmFilter, setJenisPkmFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<ReviewerDashboard>({
    queryKey: ['reviewer-dashboard'],
    queryFn: () => api.get('/dashboard/reviewer'),
  });

  // Derive unique jenis PKM from assignments
  const jenisPkmOptions = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.assignments.forEach((a) => {
      const nama = a.proposal.team.jenisPkm?.nama;
      if (nama) set.add(nama);
    });
    return Array.from(set).sort();
  }, [data]);

  // Filter assignments
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.assignments.filter((a) => {
      const status = getStatus(a);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (jenisPkmFilter !== 'all' && a.proposal.team.jenisPkm?.nama !== jenisPkmFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchTeam = a.proposal.team.namaTeam.toLowerCase().includes(q);
        const matchJudul = a.proposal.team.judulProposal.toLowerCase().includes(q);
        if (!matchTeam && !matchJudul) return false;
      }
      return true;
    });
  }, [data, statusFilter, jenisPkmFilter, search]);

  // Stats from all assignments (unfiltered)
  const statCounts = useMemo(() => {
    if (!data) return { total: 0, completed: 0, in_progress: 0, pending: 0 };
    const counts = { total: data.assignments.length, completed: 0, in_progress: 0, pending: 0 };
    data.assignments.forEach((a) => {
      const s = getStatus(a);
      counts[s]++;
    });
    return counts;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Daftar Proposal yang Ditugaskan</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{statCounts.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-2xl font-bold text-gray-600">{statCounts.pending}</p>
              <p className="text-xs text-muted-foreground">Belum Dimulai</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{statCounts.in_progress}</p>
              <p className="text-xs text-muted-foreground">Sedang Direview</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-600">{statCounts.completed}</p>
              <p className="text-xs text-muted-foreground">Selesai</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status Review" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Belum Dimulai</SelectItem>
                <SelectItem value="in_progress">Sedang Direview</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jenisPkmFilter} onValueChange={setJenisPkmFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Jenis PKM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {jenisPkmOptions.map((j) => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Cari nama tim atau judul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              {(statusFilter !== 'all' || jenisPkmFilter !== 'all' || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setJenisPkmFilter('all'); setSearch(''); }}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Proposal ({filtered.length}{filtered.length !== data.assignments.length ? ` dari ${data.assignments.length}` : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Tim</TableHead>
                  <TableHead>Judul Proposal</TableHead>
                  <TableHead>Jenis PKM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {data.assignments.length === 0 ? 'Belum ada proposal yang ditugaskan' : 'Tidak ada proposal sesuai filter'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((a, idx) => {
                  const status = getStatus(a);
                  return (
                    <TableRow key={a.id} className={status === 'in_progress' ? 'bg-orange-50/50 dark:bg-orange-950/20' : status === 'pending' ? 'bg-muted/30' : ''}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{a.proposal.team.namaTeam}</TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate">
                        {a.proposal.team.judulProposal}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.proposal.team.jenisPkm?.nama || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status === 'completed' ? 'default' : status === 'in_progress' ? 'secondary' : 'outline'}>
                          {status === 'completed' ? '✓ Selesai' : status === 'in_progress' ? '⏳ Sedang' : '○ Belum'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {status === 'completed' ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/reviewer/proposals/${a.id}`}>Lihat Hasil</Link>
                          </Button>
                        ) : (
                          <Button size="sm" asChild>
                            <Link href={`/reviewer/proposals/${a.id}/review`}>
                              {status === 'in_progress' ? '✏️ Lanjutkan' : '▶️ Mulai Review'}
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Keterangan Status</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline">○ Belum</Badge>
              <span className="text-muted-foreground">= Belum dimulai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary">⏳ Sedang</Badge>
              <span className="text-muted-foreground">= Sedang dalam proses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="default">✓ Selesai</Badge>
              <span className="text-muted-foreground">= Review sudah disubmit</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
