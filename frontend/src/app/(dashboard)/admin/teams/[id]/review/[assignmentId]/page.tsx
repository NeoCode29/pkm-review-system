'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

interface AdminReview {
  id: string;
  totalKesalahan: number;
  catatan: string | null;
  isComplete: boolean;
  detailPenilaianAdministrasi: {
    adaKesalahan: boolean;
    kriteriaAdministrasi: { id: string; deskripsi: string; urutan: number | null };
  }[];
}

interface SubstansiReview {
  id: string;
  totalSkor: string;
  catatan: string | null;
  isComplete: boolean;
  detailPenilaianSubstansi: {
    skor: string;
    kriteriaSubstansi: {
      id: string;
      nama: string;
      deskripsi: string | null;
      bobot: number;
      skorMin: number;
      skorMax: number;
      urutan: number | null;
    };
  }[];
}

interface AssignmentInfo {
  id: string;
  reviewerNumber: number;
  proposal: {
    id: string;
    type: string;
    status: string;
    team: { id: string; namaTeam: string; judulProposal: string };
  };
  penilaianAdministrasi?: { isComplete: boolean };
  penilaianSubstansi?: { isComplete: boolean };
}

interface ReviewerDashboard {
  assignments: AssignmentInfo[];
}

export default function AdminReviewDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const assignmentId = params.assignmentId as string;

  const { data: adminReview, isLoading: adminLoading } = useQuery<AdminReview>({
    queryKey: ['review-admin', assignmentId],
    queryFn: () => api.get(`/reviews/${assignmentId}/administrasi`),
  });

  const { data: substansiReview, isLoading: substansiLoading } = useQuery<SubstansiReview>({
    queryKey: ['review-substansi', assignmentId],
    queryFn: () => api.get(`/reviews/${assignmentId}/substansi`),
  });

  const isLoading = adminLoading || substansiLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const totalNilai = substansiReview?.detailPenilaianSubstansi?.reduce((sum, d) => {
    return sum + Number(d.skor) * d.kriteriaSubstansi.bobot;
  }, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/teams/${teamId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Detail Hasil Review</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admin Review */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Review Administratif</CardTitle>
              {adminReview ? (
                <Badge variant={adminReview.totalKesalahan === 0 ? 'default' : 'destructive'}>
                  {adminReview.totalKesalahan === 0 ? 'LOLOS' : `${adminReview.totalKesalahan} Kesalahan`}
                </Badge>
              ) : (
                <Badge variant="outline">Belum Dinilai</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {adminReview ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kriteria</TableHead>
                        <TableHead className="w-24 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminReview.detailPenilaianAdministrasi.map((d) => (
                        <TableRow key={d.kriteriaAdministrasi.id}>
                          <TableCell className="text-sm">{d.kriteriaAdministrasi.deskripsi}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={d.adaKesalahan ? 'destructive' : 'default'} className="text-xs">
                              {d.adaKesalahan ? 'Error' : 'OK'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {adminReview.catatan && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <strong>Catatan:</strong> {adminReview.catatan}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Belum ada penilaian administratif</p>
            )}
          </CardContent>
        </Card>

        {/* Substansi Review */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Penilaian Substantif</CardTitle>
              {substansiReview ? (
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{totalNilai}</div>
                  <div className="text-xs text-muted-foreground">Total Score</div>
                </div>
              ) : (
                <Badge variant="outline">Belum Dinilai</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {substansiReview ? (
              <div className="space-y-4">
                <div className="rounded-md border">
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
                      {substansiReview.detailPenilaianSubstansi.map((d) => {
                        const nilai = Number(d.skor) * d.kriteriaSubstansi.bobot;
                        return (
                          <TableRow key={d.kriteriaSubstansi.id}>
                            <TableCell>
                              <div className="text-sm font-medium">{d.kriteriaSubstansi.nama}</div>
                              {d.kriteriaSubstansi.deskripsi && (
                                <div className="text-xs text-muted-foreground">{d.kriteriaSubstansi.deskripsi}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{d.kriteriaSubstansi.bobot}</TableCell>
                            <TableCell className="text-center">{d.skor}</TableCell>
                            <TableCell className="text-center font-bold">{nilai}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell className="text-right">TOTAL</TableCell>
                        <TableCell className="text-center">
                          {substansiReview.detailPenilaianSubstansi.reduce((s, d) => s + d.kriteriaSubstansi.bobot, 0)}
                        </TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center text-primary text-lg">{totalNilai}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                {substansiReview.catatan && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <strong>Catatan:</strong> {substansiReview.catatan}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Belum ada penilaian substantif</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Status */}
      <Card>
        <CardContent className="flex items-center justify-between p-4 text-sm text-muted-foreground">
          <div>
            <strong>Status Administratif:</strong>{' '}
            <Badge variant={adminReview?.isComplete ? 'default' : 'outline'}>
              {adminReview?.isComplete ? 'Completed' : 'Pending'}
            </Badge>
          </div>
          <div>
            <strong>Status Substantif:</strong>{' '}
            <Badge variant={substansiReview?.isComplete ? 'default' : 'outline'}>
              {substansiReview?.isComplete ? 'Completed' : 'Pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
