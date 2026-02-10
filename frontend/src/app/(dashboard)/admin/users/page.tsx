'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCog, Shield, GraduationCap, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  mahasiswa?: { nama: string; nim: string; programStudi?: { nama: string } };
  reviewerUser?: { nama: string };
}

interface UsersResponse {
  data: User[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const ROLE_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  mahasiswa: { variant: 'default', label: 'Mahasiswa' },
  reviewer: { variant: 'secondary', label: 'Reviewer' },
  admin: { variant: 'destructive', label: 'Admin' },
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['admin-users', page, roleFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (search) params.set('search', search);
      return api.get(`/admin/users?${params}`);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => api.put(`/admin/users/${userId}/activate`),
    onSuccess: () => {
      toast.success('User berhasil diaktifkan');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal mengaktifkan user'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => api.put(`/admin/users/${userId}/deactivate`),
    onSuccess: () => {
      toast.success('User berhasil dinonaktifkan');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menonaktifkan user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      toast.success('User berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus user'),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const getName = (user: User) => {
    if (user.mahasiswa?.nama) return user.mahasiswa.nama;
    if (user.reviewerUser?.nama) return user.reviewerUser.nama;
    if (user.role === 'admin') return 'Administrator';
    return '-';
  };

  const getProdi = (user: User) => {
    return user.mahasiswa?.programStudi?.nama || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manajemen User</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCog className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{data?.meta.total ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Cari nama atau email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            User List ({data?.meta.total ?? 0} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Prodi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Tidak ada user ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                    {data?.data.map((user) => {
                      const roleBadge = ROLE_BADGE[user.role] || { variant: 'outline' as const, label: user.role };
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{getName(user)}</TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{getProdi(user)}</TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? 'default' : 'outline'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {user.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => deactivateMutation.mutate(user.id)}
                                  disabled={user.role === 'admin'}
                                >
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => activateMutation.mutate(user.id)}
                                >
                                  Activate
                                </Button>
                              )}
                              {user.role !== 'admin' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">Delete</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        User {getName(user)} ({user.email}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteMutation.mutate(user.id)}>
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {data.meta.page} of {data.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.meta.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
