'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Jurusan {
  id: string;
  nama: string;
  kode: string;
  _count?: { programStudi: number };
}

export default function MasterJurusanPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Jurusan | null>(null);
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');

  const { data: items, isLoading } = useQuery<Jurusan[]>({
    queryKey: ['master-jurusan'],
    queryFn: () => api.get('/master-data/jurusan'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/master-data/jurusan', { body: { nama, kode } }),
    onSuccess: () => {
      toast.success('Jurusan berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['master-jurusan'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/master-data/jurusan/${editItem!.id}`, { body: { nama, kode } }),
    onSuccess: () => {
      toast.success('Jurusan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['master-jurusan'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/master-data/jurusan/${id}`),
    onSuccess: () => {
      toast.success('Jurusan berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['master-jurusan'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus'),
  });

  const resetForm = () => {
    setOpen(false);
    setEditItem(null);
    setNama('');
    setKode('');
  };

  const openEdit = (item: Jurusan) => {
    setEditItem(item);
    setNama(item.nama);
    setKode(item.kode);
    setOpen(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setNama('');
    setKode('');
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!nama || !kode) return;
    if (editItem) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Master Data - Jurusan</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Jurusan
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Jurusan</TableHead>
                    <TableHead className="text-center">Prodi</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Belum ada data jurusan
                      </TableCell>
                    </TableRow>
                  )}
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.kode}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="text-center">{item._count?.programStudi ?? 0}</TableCell>
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
                                <AlertDialogTitle>Hapus Jurusan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Jurusan &quot;{item.nama}&quot; akan dihapus. Pastikan tidak ada prodi terkait.
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
            <DialogTitle>{editItem ? 'Edit Jurusan' : 'Tambah Jurusan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Contoh: FT" />
            </div>
            <div className="space-y-2">
              <Label>Nama Jurusan</Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Fakultas Teknik" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!nama || !kode || createMutation.isPending || updateMutation.isPending}>
              {editItem ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
