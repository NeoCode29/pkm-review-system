'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Jurusan, ProgramStudi } from '@/types';

const registerSchema = z
  .object({
    nim: z.string().regex(/^\d{12}$/, 'NIM harus 12 digit angka'),
    nama: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.email('Email tidak valid'),
    jurusanId: z.string().min(1, 'Pilih jurusan'),
    programStudiId: z.string().min(1, 'Pilih program studi'),
    noHp: z.string().optional(),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [selectedJurusan, setSelectedJurusan] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>();

  // Fetch jurusan on mount
  useEffect(() => {
    api
      .get<Jurusan[]>('/master-data/jurusan')
      .then(setJurusanList)
      .catch(() => toast.error('Gagal memuat data jurusan'));
  }, []);

  // Fetch prodi when jurusan changes
  useEffect(() => {
    if (!selectedJurusan) {
      setProdiList([]);
      return;
    }
    api
      .get<ProgramStudi[]>('/master-data/program-studi', {
        params: { jurusanId: selectedJurusan },
      })
      .then(setProdiList)
      .catch(() => toast.error('Gagal memuat data program studi'));
  }, [selectedJurusan]);

  const onSubmit = async (data: RegisterForm) => {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword: _, ...payload } = data;
      await api.post('/auth/register', { body: payload });
      toast.success('Registrasi berhasil! Silakan login.');
      router.push('/login');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Registrasi gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background">
          <UserPlus size={20} />
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Registrasi</h1>
        <p className="text-sm text-muted-foreground">
          Buat akun mahasiswa untuk mulai menggunakan sistem.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* NIM & Nama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nim">
              NIM <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nim"
              placeholder="123456789012"
              maxLength={12}
              {...register('nim')}
              disabled={isLoading}
            />
            {errors.nim && (
              <p className="text-sm text-destructive">{errors.nim.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nama"
              placeholder="Nama sesuai KTM"
              {...register('nama')}
              disabled={isLoading}
            />
            {errors.nama && (
              <p className="text-sm text-destructive">{errors.nama.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="mail@student.ac.id"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Jurusan & Prodi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Jurusan <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(val) => {
                setSelectedJurusan(val);
                setValue('jurusanId', val);
                setValue('programStudiId', '');
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jurusan" />
              </SelectTrigger>
              <SelectContent>
                {jurusanList.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('jurusanId')} />
            {errors.jurusanId && (
              <p className="text-sm text-destructive">
                {errors.jurusanId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Program Studi <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(val) => setValue('programStudiId', val)}
              disabled={isLoading || !selectedJurusan}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Prodi" />
              </SelectTrigger>
              <SelectContent>
                {prodiList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('programStudiId')} />
            {errors.programStudiId && (
              <p className="text-sm text-destructive">
                {errors.programStudiId.message}
              </p>
            )}
          </div>
        </div>

        {/* No HP */}
        <div className="space-y-2">
          <Label htmlFor="noHp">No HP</Label>
          <Input
            id="noHp"
            type="tel"
            placeholder="08123456789"
            {...register('noHp')}
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 karakter"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Konfirmasi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-foreground text-background hover:bg-foreground/90"
          disabled={isLoading}
        >
          {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Login di sini
        </Link>
      </p>
    </div>
  );
}
