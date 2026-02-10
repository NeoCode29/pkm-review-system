'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MasterDataTabs } from '@/components/master-data-tabs';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface DosenPembimbing {
  id: string;
  nama: string;
  nidn: string | null;
  email: string | null;
  noHp: string | null;
  _count?: { teams: number };
}

export default function MasterDosenPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<DosenPembimbing | null>(null);
  const [nama, setNama] = useState('');
  const [nidn, setNidn] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [search, setSearch] = useState('');

  const { data: items, isLoading } = useQuery<DosenPembimbing[]>({
    queryKey: ['master-dosen', search],
    queryFn: () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      return api.get(`/dosen-pembimbing${params}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/dosen-pembimbing', {
      body: { nama, nidn: nidn || undefined, email: email || undefined, noHp: noHp || undefined },
    }),
    onSuccess: () => {
      toast.success('Dosen Pembimbing berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['master-dosen'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/dosen-pembimbing/${editItem!.id}`, {
      body: { nama, nidn: nidn || undefined, email: email || undefined, noHp: noHp || undefined },
    }),
    onSuccess: () => {
      toast.success('Dosen Pembimbing berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['master-dosen'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dosen-pembimbing/${id}`),
    onSuccess: () => {
      toast.success('Dosen Pembimbing berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['master-dosen'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus'),
  });

  const resetForm = () => {
    setOpen(false); setEditItem(null); setNama(''); setNidn(''); setEmail(''); setNoHp('');
  };

  const openEdit = (item: DosenPembimbing) => {
    setEditItem(item); setNama(item.nama); setNidn(item.nidn || '');
    setEmail(item.email || ''); setNoHp(item.noHp || ''); setOpen(true);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const handleSubmit = () => {
    if (!nama) return;
    if (editItem) updateMutation.mutate(); else createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Master Data</h1>
      <MasterDataTabs />

      <div className="flex items-center justify-between">
        <Input
          className="max-w-xs"
          placeholder="Cari dosen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Dosen
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Daftar Dosen Pembimbing ({items?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIDN</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead className="text-center">Tim</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada data dosen pembimbing
                      </TableCell>
                    </TableRow>
                  )}
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="font-mono text-sm">{item.nidn || '-'}</TableCell>
                      <TableCell className="text-sm">{item.email || '-'}</TableCell>
                      <TableCell className="text-sm">{item.noHp || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item._count?.teams ?? 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Dosen Pembimbing?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{item.nama}&quot; akan dihapus. Pastikan tidak ada tim terkait.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(item.id)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Dosen Pembimbing' : 'Tambah Dosen Pembimbing'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama <span className="text-destructive">*</span></Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Dr. Nama Dosen, M.T." />
            </div>
            <div className="space-y-2">
              <Label>NIDN</Label>
              <Input value={nidn} onChange={(e) => setNidn(e.target.value)} placeholder="0012345678" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dosen@email.com" />
            </div>
            <div className="space-y-2">
              <Label>No. HP</Label>
              <Input value={noHp} onChange={(e) => setNoHp(e.target.value)} placeholder="081234567890" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!nama || createMutation.isPending || updateMutation.isPending}>
              {editItem ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
