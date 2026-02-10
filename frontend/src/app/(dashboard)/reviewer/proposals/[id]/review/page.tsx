'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { ProposalDownloadButton } from '@/components/proposal-download-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TeamInfo {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkmId: string;
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

interface KriteriaAdmin {
  id: string;
  deskripsi: string;
  urutan: number | null;
}

interface KriteriaSubstansi {
  id: string;
  nama: string;
  deskripsi: string | null;
  bobot: number;
  skorMin: number;
  skorMax: number;
  urutan: number | null;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const assignmentId = params.id as string;

  // Toggle state
  const { data: toggles } = useQuery<Record<string, boolean>>({
    queryKey: ['system-config'],
    queryFn: () => api.get('/config'),
  });
  const reviewEnabled = toggles?.reviewEnabled ?? false;

  // State for admin checklist
  const [adminChecklist, setAdminChecklist] = useState<Record<string, boolean>>({});
  const [adminCatatan, setAdminCatatan] = useState('');

  // State for substansi scores
  const [substansiScores, setSubstansiScores] = useState<Record<string, number>>({});
  const [substansiCatatan, setSubstansiCatatan] = useState('');

  // Fetch assignment detail (includes existing penilaian)
  const { data: assignment, isLoading: assignmentLoading } = useQuery<AssignmentDetail>({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const [adminData, substansiData] = await Promise.all([
        api.get(`/reviews/${assignmentId}/administrasi`).catch(() => null),
        api.get(`/reviews/${assignmentId}/substansi`).catch(() => null),
      ]);
      // Get assignment info from reviewer dashboard
      const dashboard = await api.get<{ assignments: AssignmentDetail[] }>('/dashboard/reviewer');
      const a = dashboard.assignments.find((x: AssignmentDetail) => String(x.id) === assignmentId);
      if (!a) throw new Error('Assignment tidak ditemukan');
      return { ...a, penilaianAdministrasi: adminData, penilaianSubstansi: substansiData } as AssignmentDetail;
    },
  });

  const jenisPkmId = assignment?.proposal.team.jenisPkmId;

  // Fetch kriteria
  const { data: kriteriaAdminList } = useQuery<KriteriaAdmin[]>({
    queryKey: ['kriteria-admin', jenisPkmId],
    queryFn: () => api.get(`/master-data/kriteria-administrasi/jenis-pkm/${jenisPkmId}`),
    enabled: !!jenisPkmId,
  });

  const { data: kriteriaSubstansiList } = useQuery<KriteriaSubstansi[]>({
    queryKey: ['kriteria-substansi', jenisPkmId],
    queryFn: () => api.get(`/master-data/kriteria-substansi/jenis-pkm/${jenisPkmId}`),
    enabled: !!jenisPkmId,
  });

  // Populate form from existing penilaian
  useEffect(() => {
    if (assignment?.penilaianAdministrasi) {
      const checklist: Record<string, boolean> = {};
      assignment.penilaianAdministrasi.detailPenilaianAdministrasi?.forEach((d) => {
        checklist[String(d.kriteriaAdministrasiId)] = d.adaKesalahan;
      });
      setAdminChecklist(checklist);
      setAdminCatatan(assignment.penilaianAdministrasi.catatan || '');
    }
    if (assignment?.penilaianSubstansi) {
      const scores: Record<string, number> = {};
      assignment.penilaianSubstansi.detailPenilaianSubstansi?.forEach((d) => {
        scores[String(d.kriteriaSubstansiId)] = Number(d.skor);
      });
      setSubstansiScores(scores);
      setSubstansiCatatan(assignment.penilaianSubstansi.catatan || '');
    }
  }, [assignment]);

  // Mutations
  const adminMutation = useMutation({
    mutationFn: () => {
      const checklist = (kriteriaAdminList || []).map((k) => ({
        kriteriaAdministrasiId: String(k.id),
        adaKesalahan: adminChecklist[String(k.id)] || false,
      }));
      const body = { checklist, catatan: adminCatatan || undefined };
      const hasExisting = !!assignment?.penilaianAdministrasi;
      return hasExisting
        ? api.put(`/reviews/${assignmentId}/administrasi`, { body })
        : api.post(`/reviews/${assignmentId}/administrasi`, { body });
    },
    onSuccess: () => {
      toast.success('Penilaian administratif berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['reviewer-dashboard'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menyimpan'),
  });

  const substansiMutation = useMutation({
    mutationFn: () => {
      const scores = (kriteriaSubstansiList || []).map((k) => ({
        kriteriaSubstansiId: String(k.id),
        skor: substansiScores[String(k.id)] || 0,
      }));
      const body = { scores, catatan: substansiCatatan || undefined };
      const hasExisting = !!assignment?.penilaianSubstansi;
      return hasExisting
        ? api.put(`/reviews/${assignmentId}/substansi`, { body })
        : api.post(`/reviews/${assignmentId}/substansi`, { body });
    },
    onSuccess: () => {
      toast.success('Penilaian substantif berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['reviewer-dashboard'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menyimpan'),
  });

  if (assignmentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!assignment) {
    return <p className="text-muted-foreground">Assignment tidak ditemukan</p>;
  }

  const team = assignment.proposal.team;
  const file = assignment.proposal.proposalFiles?.[0];
  const totalKesalahan = Object.values(adminChecklist).filter(Boolean).length;
  const totalNilai = (kriteriaSubstansiList || []).reduce((sum, k) => {
    const skor = substansiScores[String(k.id)] || 0;
    return sum + skor * k.bobot;
  }, 0);

  const adminDone = !!assignment.penilaianAdministrasi?.isComplete;
  const substansiDone = !!assignment.penilaianSubstansi?.isComplete;
  const bothDone = adminDone && substansiDone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reviewer/proposals"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Review Proposal</h1>
        </div>
        <Badge variant={bothDone ? 'default' : 'secondary'}>
          {bothDone ? 'Selesai' : 'Sedang Direview'}
        </Badge>
      </div>

      {/* Proposal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informasi Proposal</CardTitle>
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

      {/* Review Closed Alert */}
      {!reviewEnabled && (
        <Alert className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong>Fase review ditutup.</strong> Form penilaian tidak bisa diubah saat ini. Hubungi admin jika ada kendala.
          </AlertDescription>
        </Alert>
      )}

      {/* Review Tabs */}
      <Tabs defaultValue="admin" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin" className="gap-2">
            {adminDone && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            Administratif
          </TabsTrigger>
          <TabsTrigger value="substansi" className="gap-2">
            {substansiDone && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            Substantif
          </TabsTrigger>
        </TabsList>

        {/* Tab: Administratif */}
        <TabsContent value="admin">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Penilaian Administratif</CardTitle>
              <p className="text-xs text-muted-foreground">
                Centang item yang <strong>BERMASALAH/SALAH</strong>. Item yang tidak dicentang dianggap benar.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {kriteriaAdminList?.map((k) => (
                <div key={k.id} className="flex items-start gap-3 rounded-md border p-3">
                  <Checkbox
                    id={`admin-${k.id}`}
                    checked={adminChecklist[String(k.id)] || false}
                    disabled={!reviewEnabled}
                    onCheckedChange={(checked) =>
                      setAdminChecklist((prev) => ({ ...prev, [String(k.id)]: !!checked }))
                    }
                  />
                  <label htmlFor={`admin-${k.id}`} className="text-sm cursor-pointer leading-relaxed">
                    {k.deskripsi}
                  </label>
                </div>
              ))}

              {(!kriteriaAdminList || kriteriaAdminList.length === 0) && (
                <p className="text-sm text-muted-foreground italic">
                  Belum ada kriteria administratif untuk jenis PKM ini
                </p>
              )}

              {/* Summary */}
              <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-3xl font-bold text-red-600">{totalKesalahan}</span>
                  <span className="text-sm text-red-700 dark:text-red-300">Total Kesalahan</span>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Catatan (Opsional)</Label>
                <Textarea
                  value={adminCatatan}
                  onChange={(e) => setAdminCatatan(e.target.value)}
                  placeholder="Catatan tambahan untuk mahasiswa..."
                  rows={3}
                  disabled={!reviewEnabled}
                />
              </div>

              <Button
                onClick={() => adminMutation.mutate()}
                disabled={adminMutation.isPending || !reviewEnabled}
                className="w-full"
              >
                {adminDone ? 'Update Penilaian Administratif' : 'Simpan Penilaian Administratif'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Substantif */}
        <TabsContent value="substansi">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Penilaian Substantif</CardTitle>
              <p className="text-xs text-muted-foreground">
                Berikan skor untuk setiap kriteria. Nilai = Bobot x Skor. Skor 4 tidak diperbolehkan.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Kriteria</TableHead>
                      <TableHead className="w-16 text-center">Bobot</TableHead>
                      <TableHead className="w-20 text-center">Skor</TableHead>
                      <TableHead className="w-20 text-center">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kriteriaSubstansiList?.map((k, idx) => {
                      const skor = substansiScores[String(k.id)] || 0;
                      const nilai = skor * k.bobot;
                      return (
                        <TableRow key={k.id}>
                          <TableCell>{k.urutan ?? idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{k.nama}</div>
                            {k.deskripsi && (
                              <div className="text-xs text-muted-foreground">{k.deskripsi}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{k.bobot}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={k.skorMin}
                              max={k.skorMax}
                              value={skor || ''}
                              disabled={!reviewEnabled}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setSubstansiScores((prev) => ({
                                  ...prev,
                                  [String(k.id)]: isNaN(val) ? 0 : val,
                                }));
                              }}
                              className="w-16 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {skor > 0 ? nilai : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!kriteriaSubstansiList || kriteriaSubstansiList.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          Belum ada kriteria substantif untuk jenis PKM ini
                        </TableCell>
                      </TableRow>
                    )}
                    {kriteriaSubstansiList && kriteriaSubstansiList.length > 0 && (
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2} className="text-right">TOTAL</TableCell>
                        <TableCell className="text-center">
                          {kriteriaSubstansiList.reduce((s, k) => s + k.bobot, 0)}
                        </TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center text-primary text-lg">{totalNilai}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Score Legend */}
              <div className="rounded-md bg-muted p-3 text-xs">
                <strong>Skala Skor:</strong> 1=Buruk, 2=Sangat Kurang, 3=Kurang, 5=Cukup, 6=Baik, 7=Sangat Baik (skor 4 tidak digunakan)
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Catatan (Opsional)</Label>
                <Textarea
                  value={substansiCatatan}
                  onChange={(e) => setSubstansiCatatan(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={3}
                  disabled={!reviewEnabled}
                />
              </div>

              <Button
                onClick={() => substansiMutation.mutate()}
                disabled={substansiMutation.isPending || !reviewEnabled}
                className="w-full"
              >
                {substansiDone ? 'Update Penilaian Substantif' : 'Simpan Penilaian Substantif'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Status */}
      {bothDone && (
        <Card className="border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Kedua penilaian sudah terisi
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Review untuk proposal ini telah selesai
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/reviewer/proposals">Kembali ke Daftar</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
