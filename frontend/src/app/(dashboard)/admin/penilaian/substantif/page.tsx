'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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

interface JenisPkm { id: string; nama: string }
interface KriteriaSubstansi {
  id: string;
  nama: string;
  deskripsi: string | null;
  bobot: number;
  skorMin: number;
  skorMax: number;
  urutan: number | null;
  jenisPkmId: string;
}

export default function KriteriaSubstantifPage() {
  const queryClient = useQueryClient();
  const [selectedPkm, setSelectedPkm] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<KriteriaSubstansi | null>(null);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [bobot, setBobot] = useState('');
  const [skorMin, setSkorMin] = useState('1');
  const [skorMax, setSkorMax] = useState('7');
  const [urutan, setUrutan] = useState('');

  const { data: jenisPkmList } = useQuery<JenisPkm[]>({
    queryKey: ['jenis-pkm'],
    queryFn: () => api.get('/master-data/jenis-pkm'),
  });

  const { data: kriteria, isLoading } = useQuery<KriteriaSubstansi[]>({
    queryKey: ['kriteria-substansi', selectedPkm],
    queryFn: () => api.get(`/master-data/kriteria-substansi/jenis-pkm/${selectedPkm}`),
    enabled: !!selectedPkm,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/master-data/kriteria-substansi', {
      body: {
        nama, deskripsi: deskripsi || undefined,
        bobot: Number(bobot), skorMin: Number(skorMin), skorMax: Number(skorMax),
        urutan: urutan ? Number(urutan) : undefined, jenisPkmId: selectedPkm,
      },
    }),
    onSuccess: () => {
      toast.success('Kriteria berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['kriteria-substansi', selectedPkm] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/master-data/kriteria-substansi/${editItem!.id}`, {
      body: {
        nama, deskripsi: deskripsi || undefined,
        bobot: Number(bobot), skorMin: Number(skorMin), skorMax: Number(skorMax),
        urutan: urutan ? Number(urutan) : undefined,
      },
    }),
    onSuccess: () => {
      toast.success('Kriteria berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['kriteria-substansi', selectedPkm] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/master-data/kriteria-substansi/${id}`),
    onSuccess: () => {
      toast.success('Kriteria berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['kriteria-substansi', selectedPkm] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus'),
  });

  const resetForm = () => {
    setOpen(false); setEditItem(null);
    setNama(''); setDeskripsi(''); setBobot(''); setSkorMin('1'); setSkorMax('7'); setUrutan('');
  };

  const openEdit = (item: KriteriaSubstansi) => {
    setEditItem(item); setNama(item.nama); setDeskripsi(item.deskripsi || '');
    setBobot(String(item.bobot)); setSkorMin(String(item.skorMin)); setSkorMax(String(item.skorMax));
    setUrutan(String(item.urutan ?? '')); setOpen(true);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const handleSubmit = () => {
    if (!nama || !bobot) return;
    if (editItem) updateMutation.mutate(); else createMutation.mutate();
  };

  const totalBobot = kriteria?.reduce((sum, k) => sum + k.bobot, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kriteria Substantif</h1>
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Kriteria ({kriteria?.length ?? 0})
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                Total Bobot: <strong className={totalBobot === 100 ? 'text-green-600' : 'text-red-600'}>{totalBobot}</strong>/100
              </span>
            </div>
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
                      <TableHead>Nama Kriteria</TableHead>
                      <TableHead className="text-center w-16">Bobot</TableHead>
                      <TableHead className="text-center w-24">Skor Range</TableHead>
                      <TableHead className="text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kriteria?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Belum ada kriteria untuk jenis PKM ini
                        </TableCell>
                      </TableRow>
                    )}
                    {kriteria?.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.urutan ?? idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.nama}</div>
                          {item.deskripsi && (
                            <div className="text-xs text-muted-foreground">{item.deskripsi}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold">{item.bobot}</TableCell>
                        <TableCell className="text-center text-sm">{item.skorMin} - {item.skorMax}</TableCell>
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
                                  <AlertDialogDescription>Kriteria &quot;{item.nama}&quot; akan dihapus permanen.</AlertDialogDescription>
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
              <Label>Nama Kriteria <span className="text-destructive">*</span></Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Orisinalitas Gagasan" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Penjelasan kriteria..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Bobot <span className="text-destructive">*</span></Label>
                <Input type="number" value={bobot} onChange={(e) => setBobot(e.target.value)} placeholder="15" />
              </div>
              <div className="space-y-2">
                <Label>Skor Min</Label>
                <Input type="number" value={skorMin} onChange={(e) => setSkorMin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Skor Max</Label>
                <Input type="number" value={skorMax} onChange={(e) => setSkorMax(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={urutan} onChange={(e) => setUrutan(e.target.value)} placeholder="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!nama || !bobot || createMutation.isPending || updateMutation.isPending}>
              {editItem ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
