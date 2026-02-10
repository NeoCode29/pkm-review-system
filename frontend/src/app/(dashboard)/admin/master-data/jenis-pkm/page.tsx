'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface JenisPkm {
  id: string;
  nama: string;
  kode: string;
  deskripsi: string | null;
  _count?: { teams: number };
}

export default function MasterJenisPkmPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<JenisPkm | null>(null);
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  const { data: items, isLoading } = useQuery<JenisPkm[]>({
    queryKey: ['jenis-pkm'],
    queryFn: () => api.get('/master-data/jenis-pkm'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/master-data/jenis-pkm', { body: { nama, kode, deskripsi: deskripsi || undefined } }),
    onSuccess: () => {
      toast.success('Jenis PKM berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['jenis-pkm'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/master-data/jenis-pkm/${editItem!.id}`, { body: { nama, kode, deskripsi: deskripsi || undefined } }),
    onSuccess: () => {
      toast.success('Jenis PKM berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['jenis-pkm'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/master-data/jenis-pkm/${id}`),
    onSuccess: () => {
      toast.success('Jenis PKM berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['jenis-pkm'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus'),
  });

  const resetForm = () => {
    setOpen(false);
    setEditItem(null);
    setNama('');
    setKode('');
    setDeskripsi('');
  };

  const openEdit = (item: JenisPkm) => {
    setEditItem(item);
    setNama(item.nama);
    setKode(item.kode);
    setDeskripsi(item.deskripsi || '');
    setOpen(true);
  };

  const openCreate = () => {
    resetForm();
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
        <h1 className="text-2xl font-bold">Master Data - Jenis PKM</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Jenis PKM
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
                    <TableHead>Nama</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-center">Teams</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Belum ada data jenis PKM
                      </TableCell>
                    </TableRow>
                  )}
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.kode}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {item.deskripsi || '-'}
                      </TableCell>
                      <TableCell className="text-center">{item._count?.teams ?? 0}</TableCell>
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
                                <AlertDialogTitle>Hapus Jenis PKM?</AlertDialogTitle>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Jenis PKM' : 'Tambah Jenis PKM'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Contoh: PKM-KC" />
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: PKM Karsa Cipta" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi singkat..." />
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
