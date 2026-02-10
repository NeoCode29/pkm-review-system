'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PenilaianTabs } from '@/components/penilaian-tabs';

interface JenisPkm { id: string; nama: string }
interface KriteriaAdmin {
  id: string;
  deskripsi: string;
  urutan: number | null;
  jenisPkmId: string;
}

export default function KriteriaAdministratifPage() {
  const queryClient = useQueryClient();
  const [selectedPkm, setSelectedPkm] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<KriteriaAdmin | null>(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [urutan, setUrutan] = useState('');

  const { data: jenisPkmList } = useQuery<JenisPkm[]>({
    queryKey: ['jenis-pkm'],
    queryFn: () => api.get('/master-data/jenis-pkm'),
  });

  useEffect(() => {
    if (jenisPkmList?.length && !selectedPkm) {
      setSelectedPkm(String(jenisPkmList[0].id));
    }
  }, [jenisPkmList, selectedPkm]);

  const { data: kriteria, isLoading } = useQuery<KriteriaAdmin[]>({
    queryKey: ['kriteria-admin', selectedPkm],
    queryFn: () => api.get(`/master-data/kriteria-administrasi/jenis-pkm/${selectedPkm}`),
    enabled: !!selectedPkm,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/master-data/kriteria-administrasi', {
      body: { deskripsi, urutan: urutan ? Number(urutan) : undefined, jenisPkmId: selectedPkm },
    }),
    onSuccess: () => {
      toast.success('Kriteria berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['kriteria-admin', selectedPkm] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/master-data/kriteria-administrasi/${editItem!.id}`, {
      body: { deskripsi, urutan: urutan ? Number(urutan) : undefined },
    }),
    onSuccess: () => {
      toast.success('Kriteria berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['kriteria-admin', selectedPkm] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/master-data/kriteria-administrasi/${id}`),
    onSuccess: () => {
      toast.success('Kriteria berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['kriteria-admin', selectedPkm] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus'),
  });

  const resetForm = () => { setOpen(false); setEditItem(null); setDeskripsi(''); setUrutan(''); };

  const openEdit = (item: KriteriaAdmin) => {
    setEditItem(item); setDeskripsi(item.deskripsi); setUrutan(String(item.urutan ?? '')); setOpen(true);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const handleSubmit = () => {
    if (!deskripsi) return;
    if (editItem) updateMutation.mutate(); else createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PenilaianTabs />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kriteria Administratif</h1>
        {selectedPkm && (
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> Tambah Kriteria
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Pilih Jenis PKM</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPkm} onValueChange={setSelectedPkm}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Jenis PKM..." />
            </SelectTrigger>
            <SelectContent>
              {jenisPkmList?.map((j) => (
                <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPkm && (
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
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>Deskripsi Kriteria</TableHead>
                      <TableHead className="text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kriteria?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Belum ada kriteria untuk jenis PKM ini
                        </TableCell>
                      </TableRow>
                    )}
                    {kriteria?.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.urutan ?? idx + 1}</TableCell>
                        <TableCell>{item.deskripsi}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive"><Trash2 className="h-3 w-3" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Kriteria?</AlertDialogTitle>
                                  <AlertDialogDescription>Kriteria ini akan dihapus permanen.</AlertDialogDescription>
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
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Kriteria' : 'Tambah Kriteria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi kriteria..." />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={urutan} onChange={(e) => setUrutan(e.target.value)} placeholder="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!deskripsi || createMutation.isPending || updateMutation.isPending}>
              {editItem ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
