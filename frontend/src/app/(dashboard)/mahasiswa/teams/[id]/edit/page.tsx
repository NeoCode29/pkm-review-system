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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
        judulProposal: team.judulProposal,
        jenisPkmId: String(team.jenisPkm?.id || team.jenisPkmId),
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

  const onSubmit = (data: EditTeamForm) => {
    updateMutation.mutate(data);
  };

  const hasProposalSubmitted = team?.proposals?.some(
    (p) => p.status !== 'draft' && p.status !== 'no_proposal',
  );

  const dosenComplete = !!(dosenNama && dosenNidn && dosenEmail && dosenNoHp);
  const memberCount = team?._count?.teamMembers || 0;

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
        <Skeleton className="h-[400px] w-full max-w-3xl" />
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
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/mahasiswa/teams/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Data Tim</h1>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Semua anggota tim memiliki hak yang sama untuk mengedit data tim.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Data Tim */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Tim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nama Tim */}
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

            {/* Judul Proposal */}
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

            {/* Jenis PKM */}
            <div className="space-y-2">
              <Label>
                Jenis PKM <span className="text-destructive">*</span>
              </Label>
              <Select
                value={jenisPkmId}
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
                <p className="text-sm text-muted-foreground">
                  Jenis PKM tidak dapat diubah setelah proposal disubmit
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dosen Pembimbing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Dosen Pembimbing <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 [&>svg]:text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Wajib Diisi!</strong> Dosen pembimbing harus diisi sebelum dapat mengupload proposal.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dosenNama">
                  Nama Dosen Pembimbing <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dosenNama"
                  {...registerDosen('nama')}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosenNidn">
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
                <Label htmlFor="dosenEmail">
                  Email Dosen <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dosenEmail"
                  type="email"
                  {...registerDosen('email')}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosenNoHp">
                  No HP Dosen <span className="text-destructive">*</span>
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
                <span className="font-medium">Data Dosen Pembimbing Lengkap</span>
                <span className="text-sm">— Anda dapat mengupload proposal</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pengaturan Tim */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pengaturan Tim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Switch
                checked={openToJoin}
                onCheckedChange={setOpenToJoin}
                disabled={updateMutation.isPending}
              />
              <div>
                <p className="font-medium">Terbuka untuk Bergabung</p>
                <p className="text-sm text-muted-foreground">
                  Jika aktif, tim akan terlihat di halaman &quot;Cari Tim&quot;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href={`/mahasiswa/teams/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (team) {
                  reset({
                    namaTeam: team.namaTeam,
                    judulProposal: team.judulProposal,
                    jenisPkmId: String(team.jenisPkmId),
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
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </form>

      {/* Checklist Kelengkapan */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Checklist Kelengkapan Tim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-md p-2.5 ${
                item.ok
                  ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                  : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
              }`}
            >
              {item.ok ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <X className="h-4 w-4 shrink-0" />
              )}
              <span className="text-sm">{item.label}</span>
            </div>
          ))}

          {allComplete && (
            <Alert className="mt-3 border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
              <Check className="h-4 w-4" />
              <AlertDescription className="font-medium">
                Tim siap untuk upload proposal!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
