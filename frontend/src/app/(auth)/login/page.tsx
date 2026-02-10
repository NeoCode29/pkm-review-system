'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse } from '@/types';

const loginSchema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        body: data,
      });

      setAuth({
        user: res.user,
        profile: res.profile,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });

      toast.success('Login berhasil');

      // Redirect based on role
      switch (res.user.role) {
        case 'mahasiswa':
          router.push('/mahasiswa/dashboard');
          break;
        case 'reviewer':
          router.push('/reviewer/dashboard');
          break;
        case 'admin':
          router.push('/admin/dashboard');
          break;
        default:
          router.push('/');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mb-2 text-3xl font-bold tracking-tight">
          PKM Review
        </div>
        <CardDescription>Sistem Review Proposal PKM</CardDescription>
        <CardTitle className="mt-4 text-xl">Login</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@student.ac.id"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Masukkan password"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Login'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
