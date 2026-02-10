'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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

interface Jurusan { id: string; nama: string }
interface ProgramStudi {
  id: string;
  nama: string;
  jurusanId: string;
  jurusan?: { id: string; nama: string };
  _count?: { mahasiswa: number };
}

export default function MasterProdiPage() {
  const queryClient = useQueryClient();
  const [jurusanFilter, setJurusanFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProgramStudi | null>(null);
  const [nama, setNama] = useState('');
  const [jurusanId, setJurusanId] = useState('');

  const { data: jurusanList } = useQuery<Jurusan[]>({
    queryKey: ['master-jurusan'],
    queryFn: () => api.get('/master-data/jurusan'),
  });

  const { data: items, isLoading } = useQuery<ProgramStudi[]>({
    queryKey: ['master-prodi', jurusanFilter],
    queryFn: () => {
      const params = jurusanFilter !== 'all' ? `?jurusanId=${jurusanFilter}` : '';
      return api.get(`/master-data/program-studi${params}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/master-data/program-studi', { body: { nama, jurusanId } }),
    onSuccess: () => {
      toast.success('Program Studi berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['master-prodi'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/master-data/program-studi/${editItem!.id}`, { body: { nama, jurusanId } }),
    onSuccess: () => {
      toast.success('Program Studi berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['master-prodi'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/master-data/program-studi/${id}`),
    onSuccess: () => {
      toast.success('Program Studi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['master-prodi'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus'),
  });

  const resetForm = () => {
    setOpen(false); setEditItem(null); setNama(''); setJurusanId('');
  };

  const openEdit = (item: ProgramStudi) => {
    setEditItem(item); setNama(item.nama);
    setJurusanId(String(item.jurusan?.id || item.jurusanId)); setOpen(true);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const handleSubmit = () => {
    if (!nama || !jurusanId) return;
    if (editItem) updateMutation.mutate(); else createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Master Data</h1>
      <MasterDataTabs />

      <div className="flex items-center justify-between">
        <span />
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Program Studi
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={jurusanFilter} onValueChange={setJurusanFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              {jurusanList?.map((j) => (
                <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Daftar Program Studi ({items?.length ?? 0} prodi)
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
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead>Nama Program Studi</TableHead>
                    <TableHead className="text-center">Mahasiswa</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada data program studi
                      </TableCell>
                    </TableRow>
                  )}
                  {items?.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.jurusan?.nama || '-'}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="text-center">{item._count?.mahasiswa ?? 0}</TableCell>
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
                                <AlertDialogTitle>Hapus Program Studi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{item.nama}&quot; akan dihapus. Pastikan tidak ada mahasiswa terdaftar.
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
            <DialogTitle>{editItem ? 'Edit Program Studi' : 'Tambah Program Studi'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Jurusan <span className="text-destructive">*</span></Label>
              <Select value={jurusanId} onValueChange={setJurusanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  {jurusanList?.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama Program Studi <span className="text-destructive">*</span></Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Teknik Informatika" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!nama || !jurusanId || createMutation.isPending || updateMutation.isPending}>
              {editItem ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
