'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Info,
  AlertTriangle,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { JenisPkm } from '@/types';

interface TeamDetail {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkmId: string;
  jenisPkm?: { id: string; nama: string };
  dosenPembimbingId?: string;
  dosenPembimbing?: {
    id: string;
    nama: string;
    nidn?: string;
    email?: string;
    noHp?: string;
  };
  openToJoin: boolean;
  status: string;
  teamMembers: { id: string; mahasiswa: { id: string; nama: string; nim: string }; role: string }[];
  proposals: { id: string; status: string }[];
  _count: { teamMembers: number };
}

interface EditTeamForm {
  namaTeam: string;
  judulProposal: string;
  jenisPkmId: string;
}

interface DosenForm {
  nama: string;
  nidn: string;
  email: string;
  noHp: string;
}

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [openToJoin, setOpenToJoin] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditTeamForm>();

  const {
    register: registerDosen,
    watch: watchDosen,
    setValue: setDosenValue,
    reset: resetDosen,
    formState: { isDirty: isDosenDirty },
  } = useForm<DosenForm>();

  const namaTeam = watch('namaTeam');
  const judulProposal = watch('judulProposal');
  const jenisPkmId = watch('jenisPkmId');
  const dosenNama = watchDosen('nama');
  const dosenNidn = watchDosen('nidn');
  const dosenEmail = watchDosen('email');
  const dosenNoHp = watchDosen('noHp');

  const { data: team, isLoading } = useQuery<TeamDetail>({
    queryKey: ['team', id],
    queryFn: () => api.get(`/teams/${id}`),
  });

  const { data: jenisPkmList } = useQuery<JenisPkm[]>({
    queryKey: ['jenis-pkm'],
    queryFn: () => api.get<JenisPkm[]>('/master-data/jenis-pkm'),
  });

  // Populate form when team data loads
  useEffect(() => {
    if (team) {
      reset({
        namaTeam: team.namaTeam,
        judulProposal: team.judulProposal || '',
        jenisPkmId: String(team.jenisPkm?.id || team.jenisPkmId || ''),
      });
      setOpenToJoin(team.openToJoin);
      if (team.dosenPembimbing) {
        resetDosen({
          nama: team.dosenPembimbing.nama || '',
          nidn: team.dosenPembimbing.nidn || '',
          email: team.dosenPembimbing.email || '',
          noHp: team.dosenPembimbing.noHp || '',
        });
      }
    }
  }, [team, reset, resetDosen]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditTeamForm) => {
      // If dosen data changed, create/update dosen first
      let dosenPembimbingId = team?.dosenPembimbingId;

      if (dosenNama) {
        const dosenResult = await api.post<{ id: string }>('/dosen-pembimbing', {
          body: {
            nama: dosenNama,
            nidn: dosenNidn || undefined,
            email: dosenEmail || undefined,
            noHp: dosenNoHp || undefined,
          },
        });
        dosenPembimbingId = String(dosenResult.id);
      }

      return api.put(`/teams/${id}`, {
        body: {
          ...data,
          openToJoin,
          ...(dosenPembimbingId ? { dosenPembimbingId: String(dosenPembimbingId) } : {}),
        },
      });
    },
    onSuccess: () => {
      toast.success('Data tim berhasil diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['mahasiswa-dashboard'] });
      router.push(`/mahasiswa/teams/${id}`);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal memperbarui data tim');
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.put(`/teams/${id}/members/${memberId}/role`, { body: { role } }),
    onSuccess: () => {
      toast.success('Role anggota berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal mengubah role'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => api.delete(`/teams/${id}/members/${memberId}`),
    onSuccess: () => {
      toast.success('Anggota berhasil dihapus dari tim');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus anggota'),
  });

  const onSubmit = (data: EditTeamForm) => {
    updateMutation.mutate(data);
  };

  const hasProposalSubmitted = team?.proposals?.some(
    (p) => p.status !== 'draft' && p.status !== 'no_proposal',
  );

  const dosenComplete = !!(dosenNama && dosenNidn && dosenEmail && dosenNoHp);
  const memberCount = team?.teamMembers?.length || 0;

  const checklist = [
    { label: 'Nama tim diisi', ok: !!namaTeam },
    { label: 'Judul proposal diisi', ok: !!judulProposal },
    { label: 'Jenis PKM dipilih', ok: !!jenisPkmId },
    { label: 'Dosen pembimbing terisi lengkap', ok: dosenComplete },
    { label: `Minimal 3 anggota tim (saat ini: ${memberCount})`, ok: memberCount >= 3 },
  ];

  const allComplete = checklist.every((c) => c.ok);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Tim tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/mahasiswa/teams/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Data Tim</h1>
            <p className="text-sm text-muted-foreground">Perbarui informasi, dosen pembimbing, dan anggota tim</p>
          </div>
        </div>
      </div>

      <Alert className="bg-muted/50">
        <Info className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-muted-foreground">
          Semua anggota tim memiliki hak yang sama untuk melengkapi profil data tim ini.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Data Tim */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informasi Proposal Tim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaTeam">
                  Nama Tim <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="namaTeam"
                  {...register('namaTeam', { required: 'Nama tim wajib diisi' })}
                  disabled={updateMutation.isPending}
                />
                {errors.namaTeam && (
                  <p className="text-sm text-destructive">{errors.namaTeam.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="judulProposal">
                  Judul Proposal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="judulProposal"
                  {...register('judulProposal', { required: 'Judul proposal wajib diisi' })}
                  disabled={updateMutation.isPending}
                />
                {errors.judulProposal && (
                  <p className="text-sm text-destructive">{errors.judulProposal.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Jenis PKM <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={jenisPkmId || ""}
                  onValueChange={(v) => setValue('jenisPkmId', v, { shouldDirty: true })}
                  disabled={updateMutation.isPending || !!hasProposalSubmitted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenis PKM" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisPkmList?.map((j) => (
                      <SelectItem key={j.id} value={String(j.id)}>
                        {j.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasProposalSubmitted && (
                  <p className="text-xs text-muted-foreground">
                    Jenis PKM tidak dapat diubah setelah proposal disubmit.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dosen Pembimbing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Dosen Pembimbing <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 [&>svg]:text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm py-1">
                  <strong>Wajib Diisi!</strong> Dosen pembimbing harus terisi lengkap sebelum dapat mengupload proposal.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dosenNama" className="text-muted-foreground">
                    Nama Dosen <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dosenNama"
                    {...registerDosen('nama')}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosenNidn" className="text-muted-foreground">
                    NIDN <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dosenNidn"
                    {...registerDosen('nidn')}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dosenEmail" className="text-muted-foreground">
                    Email Aktif <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dosenEmail"
                    type="email"
                    {...registerDosen('email')}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosenNoHp" className="text-muted-foreground">
                    No. Handphone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dosenNoHp"
                    type="tel"
                    {...registerDosen('noHp')}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>

              {dosenComplete && (
                <div className="flex items-center gap-2 rounded-md border border-green-500 bg-green-50 p-3 text-green-800 dark:bg-green-950 dark:text-green-200">
                  <Check className="h-5 w-5" />
                  <span className="font-medium text-sm">Data Dosen Lengkap & Valid</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Aturan Kelengkapan Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-md p-2.5 border ${
                      item.ok
                        ? 'bg-green-50/50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900 dark:text-green-200'
                        : 'bg-red-50/50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-200'
                    }`}
                  >
                    {item.ok ? (
                      <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}

                {allComplete && (
                  <Alert className="mt-4 border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 text-center py-2">
                    <AlertDescription className="font-semibold mx-auto">
                      🎉 Tim telah siap untuk mengupload proposal
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b mb-3">
              <CardTitle className="text-lg">Kelola Anggota ({memberCount}/5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Nama Mahasiswa</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[60px] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.teamMembers?.map((m) => (
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
                            disabled={updateMemberRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs">
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
                                <AlertDialogTitle>Hapus Anggota Tim?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini akan mengeluarkan <strong>{m.mahasiswa.nama}</strong> dari tim ini secara paksa. Ia tidak akan memiliki akses lagi.
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
                Info: Hanya anggota dengan role selain "Ketua" yang dapat dikeluarkan. Ketua tim tidak bisa dihapus.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b mb-3">
              <CardTitle className="text-lg">Visibilitas Rekrutmen (Tertutup/Terbuka)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 p-2 rounded-lg border bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Open Recruitment</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-1">
                    Saat mode ini aktif, tim Anda akan dipublikasikan dan mahasiswa yang belum dapat tim bisa melakukan permintaan (request) bergabung.
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
      </div>

      <div className="flex flex-col sm:flex-row bg-card p-4 rounded-xl border sm:items-center justify-between gap-4 sticky bottom-6 shadow-md shadow-black/5 z-10 mx-auto w-full">
        <Button variant="outline" type="button" onClick={() => router.push(`/mahasiswa/teams/${id}`)} className="w-full sm:w-auto">
          Batal Edit
        </Button>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => {
              if (team) {
                reset({
                  namaTeam: team.namaTeam,
                  judulProposal: team.judulProposal || '',
                  jenisPkmId: String(team.jenisPkmId || ''),
                });
                setOpenToJoin(team.openToJoin);
                if (team.dosenPembimbing) {
                  resetDosen({
                    nama: team.dosenPembimbing.nama || '',
                    nidn: team.dosenPembimbing.nidn || '',
                    email: team.dosenPembimbing.email || '',
                    noHp: team.dosenPembimbing.noHp || '',
                  });
                }
              }
            }}
            disabled={updateMutation.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Menyimpan Semua Data...' : 'Simpan Semua Perubahan'}
          </Button>
        </div>
      </div>

    </div>
  );
}
