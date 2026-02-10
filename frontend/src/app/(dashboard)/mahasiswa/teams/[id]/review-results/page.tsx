'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Info,
  Download,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

interface Proposal {
  id: string;
  type: 'original' | 'revised';
  status: string;
  proposalFiles: { id: string; fileName: string }[];
}

interface TeamDetail {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkm?: { id: string; nama: string };
}

interface SubstansiDetail {
  kriteria: string;
  deskripsi: string;
  bobot: number;
  skor: string;
  nilai: number;
}

interface ReviewerSummary {
  reviewerLabel: string;
  assignmentId: string;
  reviewerNumber: number;
  substansi: {
    totalSkor: string;
    catatan: string | null;
    details: SubstansiDetail[];
  } | null;
  administrasi: {
    totalKesalahan: number;
    catatan: string | null;
  } | null;
}

interface AdminError {
  kriteriaId: string;
  deskripsi: string;
  urutan: number;
  reviewerCount: number;
}

interface AdminErrorResult {
  totalKesalahan: number;
  errors: AdminError[];
}

export default function ReviewResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: team, isLoading: teamLoading } = useQuery<TeamDetail>({
    queryKey: ['team', id],
    queryFn: () => api.get(`/teams/${id}`),
  });

  const { data: proposals, isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: ['proposals', id],
    queryFn: () => api.get(`/proposals/team/${id}`),
  });

  const originalProposal = proposals?.find((p) => p.type === 'original');

  const { data: reviewSummary, isLoading: summaryLoading } = useQuery<ReviewerSummary[]>({
    queryKey: ['review-summary', originalProposal?.id],
    queryFn: () => api.get(`/reviews/proposal/${originalProposal!.id}/summary`),
    enabled: !!originalProposal?.id,
  });

  const { data: adminErrors } = useQuery<AdminErrorResult>({
    queryKey: ['admin-errors', originalProposal?.id],
    queryFn: () => api.get(`/reviews/proposal/${originalProposal!.id}/administrasi/errors`),
    enabled: !!originalProposal?.id,
  });

  const isLoading = teamLoading || proposalsLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!team || !originalProposal) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Data tidak ditemukan</p>
      </div>
    );
  }

  const isReviewed = originalProposal.status === 'reviewed' || originalProposal.status === 'under_review';

  if (!isReviewed && !reviewSummary?.length) {
    return (
      <div className="space-y-6">
        <Breadcrumb teamId={id} />
        <h1 className="text-2xl font-bold">Hasil Review Proposal</h1>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Proposal belum direview. Hasil review akan muncul setelah reviewer menyelesaikan penilaian.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb teamId={id} />
      <h1 className="text-2xl font-bold">Hasil Review Proposal</h1>

      {/* Proposal Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Tim:</span>
              <span className="font-medium">{team.namaTeam}</span>
              <span className="text-muted-foreground">Judul:</span>
              <span>{team.judulProposal}</span>
              <span className="text-muted-foreground">Jenis PKM:</span>
              <Badge variant="outline">{team.jenisPkm?.nama || '-'}</Badge>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="default">
                {originalProposal.status === 'reviewed' ? 'Reviewed' : originalProposal.status}
              </Badge>
              <span className="text-muted-foreground">Reviewer:</span>
              <span>{reviewSummary?.length || 0} Reviewer</span>
              <span className="text-muted-foreground">Proposal:</span>
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/proposals/${originalProposal.id}/download`}
                  target="_blank"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download Original
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Tentang Hasil Review:</strong>
          <ul className="mt-1 ml-4 list-disc text-sm">
            <li>Penilaian Administratif: Ditampilkan <strong>daftar kriteria yang salah</strong> agar dapat diperbaiki</li>
            <li>Penilaian Substantif: Ditampilkan <strong>tabel perhitungan lengkap</strong> (Bobot x Skor = Nilai)</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Combined Admin Errors */}
      {adminErrors && adminErrors.totalKesalahan > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Kesalahan Administratif (Gabungan Semua Reviewer)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-md bg-red-50 p-3 dark:bg-red-950">
              <span className="text-3xl font-bold text-red-600">{adminErrors.totalKesalahan}</span>
              <span className="text-red-700 dark:text-red-300">Kriteria Tidak Sesuai</span>
            </div>
            <div className="space-y-2">
              {adminErrors.errors.map((err) => (
                <div
                  key={err.kriteriaId}
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50/50 p-3 text-sm dark:border-red-900 dark:bg-red-950/50"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <div>
                    <span className="text-red-800 dark:text-red-200">{err.deskripsi}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (ditandai oleh {err.reviewerCount} reviewer)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Reviewer Cards */}
      {reviewSummary?.map((reviewer) => (
        <ReviewerCard key={reviewer.assignmentId} reviewer={reviewer} />
      ))}
    </div>
  );
}

function Breadcrumb({ teamId }: { teamId: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link href="/mahasiswa/dashboard" className="hover:text-foreground">Dashboard</Link>
      <span>/</span>
      <Link href={`/mahasiswa/teams/${teamId}`} className="hover:text-foreground">Tim Saya</Link>
      <span>/</span>
      <Link href={`/mahasiswa/teams/${teamId}/proposal`} className="hover:text-foreground">Proposal</Link>
      <span>/</span>
      <span className="text-foreground">Hasil Review</span>
    </div>
  );
}

function ReviewerCard({ reviewer }: { reviewer: ReviewerSummary }) {
  const colors = reviewer.reviewerNumber === 1
    ? { border: 'border-blue-200 dark:border-blue-900', header: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-400', badge: 'default' as const }
    : { border: 'border-indigo-200 dark:border-indigo-900', header: 'bg-indigo-50 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-400', badge: 'secondary' as const };

  const totalNilai = reviewer.substansi?.details.reduce((sum, d) => sum + d.nilai, 0) || 0;

  return (
    <Card className={colors.border}>
      <CardHeader className={`${colors.header} pb-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={colors.badge}>{reviewer.reviewerLabel}</Badge>
          </div>
          {reviewer.substansi && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Nilai</p>
              <p className={`text-2xl font-bold ${colors.text}`}>{totalNilai}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Penilaian Administratif */}
          <div className="space-y-3">
            <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Penilaian Administratif
            </h4>
            {reviewer.administrasi ? (
              <>
                <div className="flex items-center gap-3 rounded-md bg-red-50 p-3 dark:bg-red-950">
                  <span className="text-2xl font-bold text-red-600">
                    {reviewer.administrasi.totalKesalahan}
                  </span>
                  <span className="text-sm text-red-700 dark:text-red-300">Kriteria Tidak Sesuai</span>
                </div>
                {reviewer.administrasi.catatan && (
                  <div className="rounded-md border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Catatan Reviewer</p>
                    <p className="text-sm italic text-muted-foreground">
                      &ldquo;{reviewer.administrasi.catatan}&rdquo;
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Belum dinilai</p>
            )}
          </div>

          {/* Penilaian Substantif */}
          <div className="space-y-3">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Penilaian Substantif
            </h4>
            {reviewer.substansi ? (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kriteria</TableHead>
                        <TableHead className="w-16 text-center">Bobot</TableHead>
                        <TableHead className="w-16 text-center">Skor</TableHead>
                        <TableHead className="w-20 text-center">Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviewer.substansi.details.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{d.kriteria}</TableCell>
                          <TableCell className="text-center text-sm">{d.bobot}</TableCell>
                          <TableCell className="text-center font-bold text-blue-600">{Number(d.skor)}</TableCell>
                          <TableCell className="text-center text-sm">= {d.nilai}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-blue-50 dark:bg-blue-950 font-bold">
                        <TableCell colSpan={3} className="text-right">Total Nilai</TableCell>
                        <TableCell className="text-center text-blue-700 dark:text-blue-400">
                          {totalNilai}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                {reviewer.substansi.catatan && (
                  <div className="rounded-md border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Catatan Reviewer</p>
                    <p className="text-sm italic text-muted-foreground">
                      &ldquo;{reviewer.substansi.catatan}&rdquo;
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Belum dinilai</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
