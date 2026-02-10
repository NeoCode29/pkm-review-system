'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
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
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Reviewer {
  id: string;
  nama: string;
  nidn: string | null;
  bidangKeahlian: string | null;
  userId: string;
  user?: { email: string };
  _count?: { reviewerAssignments: number };
}

export default function AdminReviewersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nidn, setNidn] = useState('');
  const [bidangKeahlian, setBidangKeahlian] = useState('');

  const { data: reviewers, isLoading } = useQuery<Reviewer[]>({
    queryKey: ['admin-reviewers'],
    queryFn: () => api.get('/reviewers'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/reviewers', {
      body: {
        nama,
        email,
        password,
        nidn: nidn || undefined,
        bidangKeahlian: bidangKeahlian || undefined,
      },
    }),
    onSuccess: () => {
      toast.success('Reviewer berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['admin-reviewers'] });
      resetForm();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menambahkan reviewer'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reviewers/${id}`),
    onSuccess: () => {
      toast.success('Reviewer berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['admin-reviewers'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal menghapus reviewer'),
  });

  const resetForm = () => {
    setOpen(false);
    setNama('');
    setEmail('');
    setPassword('');
    setNidn('');
    setBidangKeahlian('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manajemen Reviewer</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Reviewer
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Reviewer List ({reviewers?.length ?? 0} reviewers)
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
                    <TableHead>Bidang Keahlian</TableHead>
                    <TableHead className="text-center">Assignments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Belum ada reviewer
                      </TableCell>
                    </TableRow>
                  )}
                  {reviewers?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.nama}</TableCell>
                      <TableCell className="text-sm font-mono">{r.nidn || '-'}</TableCell>
                      <TableCell className="text-sm">{r.bidangKeahlian || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{r._count?.reviewerAssignments ?? 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/reviewers/${r.id}`}>
                              <Eye className="mr-1 h-3 w-3" /> Detail
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Reviewer?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Reviewer &quot;{r.nama}&quot; akan dihapus beserta semua assignment-nya.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(r.id)}>Hapus</AlertDialogAction>
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

      {/* Create Reviewer Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Reviewer Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama <span className="text-destructive">*</span></Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Dr. Nama Reviewer" />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="reviewer@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 karakter" />
            </div>
            <div className="space-y-2">
              <Label>NIDN</Label>
              <Input value={nidn} onChange={(e) => setNidn(e.target.value)} placeholder="0012345678" />
            </div>
            <div className="space-y-2">
              <Label>Bidang Keahlian</Label>
              <Input value={bidangKeahlian} onChange={(e) => setBidangKeahlian(e.target.value)} placeholder="Teknik Informatika" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!nama || !email || !password || createMutation.isPending}
            >
              Tambah Reviewer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
