'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, AlertTriangle, FileText, Edit } from 'lucide-react';
import { ProposalDownloadButton } from '@/components/proposal-download-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

interface TeamInfo {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkm?: { id: string; nama: string };
  dosenPembimbing?: { nama: string };
  _count: { teamMembers: number };
}

interface ProposalFile {
  id: string;
  fileName: string;
  fileSize: number;
}

interface AssignmentDetail {
  id: string;
  reviewerNumber: number;
  proposalId: string;
  proposal: {
    id: string;
    type: string;
    status: string;
    team: TeamInfo;
    proposalFiles: ProposalFile[];
  };
  penilaianAdministrasi?: {
    id: string;
    totalKesalahan: number;
    catatan: string | null;
    isComplete: boolean;
    detailPenilaianAdministrasi: {
      kriteriaAdministrasiId: string;
      adaKesalahan: boolean;
      kriteriaAdministrasi: { id: string; deskripsi: string; urutan: number | null };
    }[];
  };
  penilaianSubstansi?: {
    id: string;
    totalSkor: string;
    catatan: string | null;
    isComplete: boolean;
    detailPenilaianSubstansi: {
      kriteriaSubstansiId: string;
      skor: string;
      kriteriaSubstansi: { id: string; nama: string; deskripsi: string; bobot: number; skorMin: number; skorMax: number; urutan: number | null };
    }[];
  };
}

type ToggleStates = Record<string, boolean>;

export default function ReviewSummaryPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  const { data: assignment, isLoading } = useQuery<AssignmentDetail>({
    queryKey: ['assignment-summary', assignmentId],
    queryFn: async () => {
      const [adminData, substansiData] = await Promise.all([
        api.get(`/reviews/${assignmentId}/administrasi`).catch(() => null),
        api.get(`/reviews/${assignmentId}/substansi`).catch(() => null),
      ]);
      const dashboard = await api.get<{ assignments: AssignmentDetail[] }>('/dashboard/reviewer');
      const a = dashboard.assignments.find((x: AssignmentDetail) => String(x.id) === assignmentId);
      if (!a) throw new Error('Assignment tidak ditemukan');
      return { ...a, penilaianAdministrasi: adminData, penilaianSubstansi: substansiData } as AssignmentDetail;
    },
  });

  const { data: toggles } = useQuery<ToggleStates>({
    queryKey: ['system-config'],
    queryFn: () => api.get('/config'),
  });

  const reviewEnabled = toggles?.reviewEnabled ?? false;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!assignment) {
    return <p className="text-muted-foreground">Assignment tidak ditemukan</p>;
  }

  const team = assignment.proposal.team;
  const file = assignment.proposal.proposalFiles?.[0];
  const adminDone = !!assignment.penilaianAdministrasi?.isComplete;
  const substansiDone = !!assignment.penilaianSubstansi?.isComplete;
  const bothDone = adminDone && substansiDone;

  // Admin penilaian data
  const adminDetails = assignment.penilaianAdministrasi?.detailPenilaianAdministrasi || [];
  const errorItems = adminDetails.filter((d) => d.adaKesalahan);
  const totalKesalahan = errorItems.length;

  // Substansi penilaian data
  const substansiDetails = assignment.penilaianSubstansi?.detailPenilaianSubstansi || [];
  const totalNilai = substansiDetails.reduce((sum, d) => {
    return sum + Number(d.skor) * d.kriteriaSubstansi.bobot;
  }, 0);
  const totalBobot = substansiDetails.reduce((sum, d) => sum + d.kriteriaSubstansi.bobot, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reviewer/proposals"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Hasil Review</h1>
        </div>
        <Badge variant={bothDone ? 'default' : 'secondary'}>
          {bothDone ? '✓ Review Tersubmit' : 'Belum Selesai'}
        </Badge>
      </div>

      {/* Success Alert */}
      {bothDone && (
        <Alert className="border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Review berhasil disubmit!</strong> Review Anda telah tersimpan.
            {reviewEnabled
              ? ' Hasil ini dapat diedit selama fase review masih dibuka oleh admin.'
              : ' Fase review sudah ditutup, hasil bersifat FINAL.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Proposal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Informasi Proposal
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <span className="text-muted-foreground">Dosen:</span>
              <span>{team.dosenPembimbing?.nama || '-'}</span>
              <span className="text-muted-foreground">Anggota:</span>
              <span>{team._count.teamMembers} orang</span>
              <span className="text-muted-foreground">File:</span>
              {file ? (
                <ProposalDownloadButton proposalId={String(assignment.proposalId)} label={file.fileName} />
              ) : (
                <span className="text-muted-foreground">Belum upload</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Penilaian Administratif */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Penilaian Administratif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminDone ? (
              <>
                <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="text-3xl font-bold text-red-600">{totalKesalahan}</span>
                    <span className="text-sm text-red-700 dark:text-red-300">Total Kesalahan</span>
                  </CardContent>
                </Card>

                {errorItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Kesalahan yang Ditemukan:</p>
                    {errorItems
                      .sort((a, b) => (a.kriteriaAdministrasi.urutan ?? 0) - (b.kriteriaAdministrasi.urutan ?? 0))
                      .map((d) => (
                        <div key={d.kriteriaAdministrasiId} className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 p-3">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{d.kriteriaAdministrasi.deskripsi}</span>
                        </div>
                      ))}
                  </div>
                )}

                {totalKesalahan === 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Tidak ada kesalahan administratif ditemukan.
                  </p>
                )}

                {assignment.penilaianAdministrasi?.catatan && (
                  <div>
                    <p className="text-sm font-medium mb-1">Catatan:</p>
                    <div className="rounded-md bg-muted p-3 text-sm border-l-3 border-primary">
                      {assignment.penilaianAdministrasi.catatan}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Penilaian administratif belum dilakukan
              </p>
            )}
          </CardContent>
        </Card>

        {/* Penilaian Substantif */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Penilaian Substantif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {substansiDone ? (
              <>
                <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="text-3xl font-bold text-orange-600">{totalNilai}</span>
                    <span className="text-sm text-orange-700 dark:text-orange-300">Total Nilai</span>
                  </CardContent>
                </Card>

                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kriteria</TableHead>
                        <TableHead className="w-14 text-center">Bobot</TableHead>
                        <TableHead className="w-14 text-center">Skor</TableHead>
                        <TableHead className="w-16 text-center">Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {substansiDetails
                        .sort((a, b) => (a.kriteriaSubstansi.urutan ?? 0) - (b.kriteriaSubstansi.urutan ?? 0))
                        .map((d) => {
                          const skor = Number(d.skor);
                          const nilai = skor * d.kriteriaSubstansi.bobot;
                          return (
                            <TableRow key={d.kriteriaSubstansiId}>
                              <TableCell className="text-sm">{d.kriteriaSubstansi.nama}</TableCell>
                              <TableCell className="text-center">{d.kriteriaSubstansi.bobot}</TableCell>
                              <TableCell className="text-center">{skor}</TableCell>
                              <TableCell className="text-center font-bold">{nilai}</TableCell>
                            </TableRow>
                          );
                        })}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-center">{totalBobot}</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center text-primary text-lg">{totalNilai}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {assignment.penilaianSubstansi?.catatan && (
                  <div>
                    <p className="text-sm font-medium mb-1">Catatan:</p>
                    <div className="rounded-md bg-muted p-3 text-sm border-l-3 border-primary">
                      {assignment.penilaianSubstansi.catatan}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Penilaian substantif belum dilakukan
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className={reviewEnabled ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950' : 'border-muted'}>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            {reviewEnabled ? (
              <>
                <p className="font-semibold text-orange-700 dark:text-orange-300">
                  Review dapat diedit selama fase review masih dibuka
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Setelah admin menutup fase review, hasil menjadi FINAL dan tidak bisa diubah.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-muted-foreground">
                  Fase review sudah ditutup
                </p>
                <p className="text-sm text-muted-foreground">
                  Hasil review bersifat FINAL dan tidak bisa diubah.
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {reviewEnabled && (
              <Button asChild>
                <Link href={`/reviewer/proposals/${assignmentId}/review`}>
                  <Edit className="mr-1 h-4 w-4" /> Edit Review
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/reviewer/proposals">
                <ArrowLeft className="mr-1 h-4 w-4" /> Kembali ke Daftar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
