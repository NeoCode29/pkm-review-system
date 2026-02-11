'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Info, Check, Circle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { JenisPkm } from '@/types';

interface CreateTeamForm {
  namaTeam: string;
  judulProposal: string;
  jenisPkmId: string;
}

export default function CreateTeamPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openToJoin, setOpenToJoin] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTeamForm>();

  const namaTeam = watch('namaTeam');
  const judulProposal = watch('judulProposal');
  const jenisPkmId = watch('jenisPkmId');

  const { data: jenisPkmList } = useQuery<JenisPkm[]>({
    queryKey: ['jenis-pkm'],
    queryFn: () => api.get<JenisPkm[]>('/master-data/jenis-pkm'),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTeamForm) =>
      api.post('/teams', {
        body: { ...data, openToJoin },
      }),
    onSuccess: () => {
      toast.success('Tim berhasil dibuat! Anda menjadi Ketua Tim.');
      queryClient.invalidateQueries({ queryKey: ['mahasiswa-dashboard'] });
      router.push('/mahasiswa/dashboard');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal membuat tim');
    },
  });

  const onSubmit = (data: CreateTeamForm) => {
    createMutation.mutate(data);
  };

  const checks = [
    { ok: !!namaTeam, label: 'Nama tim diisi' },
    { ok: !!judulProposal, label: 'Judul proposal diisi' },
    { ok: !!jenisPkmId, label: 'Jenis PKM dipilih' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/mahasiswa/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Buat Tim Baru</h1>
      </div>

      <Alert>
        <Info size={16} />
        <AlertDescription>
          Anda akan menjadi <strong>Ketua Tim</strong> setelah membuat tim.
          Tim minimal harus memiliki 3 anggota untuk dapat mengupload proposal.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Tim</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nama Tim */}
            <div className="space-y-2">
              <Label htmlFor="namaTeam">
                Nama Tim <span className="text-destructive">*</span>
              </Label>
              <Input
                id="namaTeam"
                placeholder="Contoh: Tim Inovasi Digital"
                {...register('namaTeam', { required: 'Nama tim wajib diisi' })}
                disabled={createMutation.isPending}
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
                placeholder="Contoh: Aplikasi AR untuk Pembelajaran Sains"
                {...register('judulProposal', { required: 'Judul proposal wajib diisi' })}
                disabled={createMutation.isPending}
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
                onValueChange={(val) => setValue('jenisPkmId', val)}
                disabled={createMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis PKM" />
                </SelectTrigger>
                <SelectContent>
                  {jenisPkmList?.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register('jenisPkmId', { required: 'Pilih jenis PKM' })} />
              {errors.jenisPkmId && (
                <p className="text-sm text-destructive">{errors.jenisPkmId.message}</p>
              )}
            </div>

            <Separator />

            {/* Open to Join */}
            <div className="flex items-start gap-4">
              <Switch
                checked={openToJoin}
                onCheckedChange={setOpenToJoin}
                disabled={createMutation.isPending}
              />
              <div>
                <p className="text-sm font-medium">Terbuka untuk Bergabung</p>
                <p className="text-xs text-muted-foreground">
                  Jika aktif, tim akan terlihat di halaman &quot;Cari Tim&quot; dan
                  mahasiswa lain dapat mengirim request bergabung.
                </p>
              </div>
            </div>

            <Separator />

            {/* Checklist */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium text-amber-700 mb-3">
                  Checklist Sebelum Submit
                </p>
                <div className="space-y-2">
                  {checks.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {c.ok ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <Circle size={14} className="text-muted-foreground" />
                      )}
                      <span className={c.ok ? '' : 'text-muted-foreground'}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" asChild>
                <Link href="/mahasiswa/dashboard">Batal</Link>
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Membuat...' : 'Buat Tim'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
