'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCog, Users, UserCheck, Shield, Ban, CheckCircle, UsersRound, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/table-skeleton';
import { EmptyState } from '@/components/empty-state';
import { useDebounce } from '@/hooks/use-debounce';
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
  userId: string;
  email: string;
  role: string;
  nama?: string;
  nim?: string;
  nidn?: string;
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

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['admin-users', page, roleFilter, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      return api.get(`/admin/users?${params}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      toast.success('User berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus user'),
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

  const hasActiveFilters = roleFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setRoleFilter('all');
    setSearch('');
    setPage(1);
  };

  const getName = (user: User) => {
    return user.nama || '-';
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
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{data?.data?.filter((u) => u.role === 'mahasiswa').length ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Mahasiswa</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{data?.data?.filter((u) => u.role === 'reviewer').length ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Reviewer</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{data?.data?.filter((u) => u.role === 'admin').length ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
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
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="max-w-sm"
              />
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="px-2 lg:px-3">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
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
            <TableSkeleton columns={5} rows={10} />
          ) : (
            <>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>NIM/NIDN</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center p-0">
                          <EmptyState
                            icon={UsersRound}
                            title="Tidak ada user ditemukan"
                            description={hasActiveFilters ? "Coba sesuaikan filter atau pencarian Anda." : "Belum ada data user di sistem."}
                            actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
                            onAction={hasActiveFilters ? clearFilters : undefined}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                    {data?.data.map((user) => {
                      const roleBadge = ROLE_BADGE[user.role] || { variant: 'outline' as const, label: user.role };
                      return (
                        <TableRow key={`${user.role}-${user.id}`}>
                          <TableCell className="font-medium">{getName(user)}</TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{user.nim || user.nidn || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {user.role !== 'admin' && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline" title="Nonaktifkan">
                                        <Ban className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Nonaktifkan User?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          User {getName(user)} ({user.email}) tidak akan bisa login. Anda bisa mengaktifkan kembali nanti.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deactivateMutation.mutate(user.userId)}>
                                          Nonaktifkan
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Aktifkan"
                                    onClick={() => activateMutation.mutate(user.userId)}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
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
                                        <AlertDialogAction onClick={() => deleteMutation.mutate(user.userId)}>
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
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
