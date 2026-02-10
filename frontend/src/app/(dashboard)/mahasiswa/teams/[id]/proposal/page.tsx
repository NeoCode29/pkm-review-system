'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Download,
  Info,
  AlertTriangle,
  Check,
  X,
  Lock,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

interface ProposalFile {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

interface Proposal {
  id: string;
  type: 'original' | 'revised';
  status: string;
  proposalFiles: ProposalFile[];
}

interface TeamDetail {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkm?: { id: string; nama: string };
  dosenPembimbing?: { id: string; nama: string };
  _count: { teamMembers: number };
}

interface ToggleState {
  key: string;
  enabled: boolean;
}

interface FileInfo {
  id: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  mimeType: string;
  downloadUrl: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  under_review: { label: 'Under Review', variant: 'default' },
  reviewed: { label: 'Reviewed', variant: 'default' },
  not_reviewed: { label: 'Not Reviewed', variant: 'destructive' },
  needs_revision: { label: 'Needs Revision', variant: 'destructive' },
  revised: { label: 'Revised', variant: 'default' },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProposalPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const fileInputOriginal = useRef<HTMLInputElement>(null);
  const fileInputRevised = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRevisedFile, setSelectedRevisedFile] = useState<File | null>(null);

  const { data: team, isLoading: teamLoading } = useQuery<TeamDetail>({
    queryKey: ['team', id],
    queryFn: () => api.get(`/teams/${id}`),
  });

  const { data: proposals, isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: ['proposals', id],
    queryFn: () => api.get(`/proposals/team/${id}`),
  });

  const { data: uploadConfig } = useQuery<ToggleState>({
    queryKey: ['config-uploadProposalEnabled'],
    queryFn: () => api.get('/config/uploadProposalEnabled'),
  });

  const { data: revisionConfig } = useQuery<ToggleState>({
    queryKey: ['config-uploadRevisionEnabled'],
    queryFn: () => api.get('/config/uploadRevisionEnabled'),
  });

  const uploadEnabled = uploadConfig?.enabled ?? false;
  const revisionEnabled = revisionConfig?.enabled ?? false;

  const originalProposal = proposals?.find((p) => p.type === 'original');
  const revisedProposal = proposals?.find((p) => p.type === 'revised');

  const originalFile = originalProposal?.proposalFiles?.[0];
  const revisedFile = revisedProposal?.proposalFiles?.[0];

  // For revised proposal: upload is allowed when status is needs_revision and revision toggle is on
  const canUploadRevision = revisedProposal?.status === 'needs_revision' && revisionEnabled;

  const memberCount = team?._count?.teamMembers || 0;
  const hasDosen = !!team?.dosenPembimbing;
  const canUpload = memberCount >= 3 && hasDosen && uploadEnabled;

  const uploadMutation = useMutation({
    mutationFn: async ({ proposalId, file }: { proposalId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = (await import('@/stores/authStore')).useAuthStore.getState().accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const resp = await fetch(`${baseUrl}/proposals/${proposalId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `Upload gagal (${resp.status})`);
      }
      return resp.json();
    },
    onSuccess: () => {
      toast.success('File berhasil diupload!');
      setSelectedFile(null);
      setSelectedRevisedFile(null);
      queryClient.invalidateQueries({ queryKey: ['proposals', id] });
      queryClient.invalidateQueries({ queryKey: ['mahasiswa-dashboard'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal upload file');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (proposalId: string) => api.post(`/proposals/${proposalId}/submit`),
    onSuccess: () => {
      toast.success('Proposal berhasil disubmit!');
      queryClient.invalidateQueries({ queryKey: ['proposals', id] });
      queryClient.invalidateQueries({ queryKey: ['mahasiswa-dashboard'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal submit proposal');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'original' | 'revised') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diperbolehkan');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10 MB');
      return;
    }
    if (type === 'original') setSelectedFile(file);
    else setSelectedRevisedFile(file);
  };

  const handleUpload = (proposalId: string, file: File) => {
    uploadMutation.mutate({ proposalId, file });
  };

  const isLoading = teamLoading || proposalsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Tim tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/mahasiswa/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <Link href={`/mahasiswa/teams/${id}`} className="hover:text-foreground">Tim Saya</Link>
        <span>/</span>
        <span className="text-foreground">Proposal</span>
      </div>

      <h1 className="text-2xl font-bold">Proposal Tim</h1>

      {/* System Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistem Proposal PKM:</strong>
          <ul className="mt-1 ml-4 list-disc text-sm">
            <li><strong>Proposal Original</strong> — Proposal pertama yang direview oleh 2 reviewer</li>
            <li><strong>Proposal Revised</strong> — Proposal revisi untuk dokumentasi (TIDAK direview lagi)</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Proposal Original</p>
              <p className="text-lg font-bold">
                {STATUS_MAP[originalProposal?.status || 'draft']?.label || 'Draft'}
              </p>
            </div>
            <Badge variant={STATUS_MAP[originalProposal?.status || 'draft']?.variant || 'secondary'}>
              {STATUS_MAP[originalProposal?.status || 'draft']?.label || 'Draft'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Proposal Revised</p>
              <p className="text-lg font-bold">
                {STATUS_MAP[revisedProposal?.status || 'draft']?.label || 'Draft'}
              </p>
            </div>
            <Badge variant={STATUS_MAP[revisedProposal?.status || 'draft']?.variant || 'secondary'}>
              {STATUS_MAP[revisedProposal?.status || 'draft']?.label || 'Draft'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ===== PROPOSAL ORIGINAL ===== */}
        <div className="space-y-4">
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400">
                  Proposal Original
                </CardTitle>
                <Badge variant={STATUS_MAP[originalProposal?.status || 'draft']?.variant || 'secondary'}>
                  {STATUS_MAP[originalProposal?.status || 'draft']?.label || 'Draft'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File sudah diupload */}
              {originalFile ? (
                <>
                  <div className="flex items-center gap-3 rounded-md border border-green-300 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                    <FileText className="h-8 w-8 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{originalFile.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Diupload: {formatDate(originalFile.uploadedAt)} | {formatFileSize(Number(originalFile.fileSize))}
                      </p>
                    </div>
                    <DownloadButton proposalId={originalProposal?.id} />
                  </div>

                  {/* Submit button if draft with file */}
                  {originalProposal?.status === 'draft' && (
                    <Button
                      className="w-full"
                      onClick={() => originalProposal && submitMutation.mutate(originalProposal.id)}
                      disabled={submitMutation.isPending}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {submitMutation.isPending ? 'Submitting...' : 'Submit Proposal Original'}
                    </Button>
                  )}

                  {/* Review results link */}
                  {(originalProposal?.status === 'reviewed' || originalProposal?.status === 'under_review') && (
                    <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950">
                      <BarChart3 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Hasil Review Tersedia</strong>
                        <p className="text-sm mt-1">Proposal telah direview. Lihat feedback dan highlight.</p>
                        <Button size="sm" className="mt-2" asChild>
                          <Link href={`/mahasiswa/teams/${id}/review-results`}>
                            <BarChart3 className="mr-1 h-3 w-3" />
                            Lihat Hasil Review
                          </Link>
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <>
                  {/* Upload form */}
                  {!uploadEnabled ? (
                    <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-muted p-8 text-center opacity-60">
                      <Lock className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Upload Proposal Belum Dibuka</p>
                      <p className="text-xs text-muted-foreground">Tunggu admin membuka periode upload</p>
                    </div>
                  ) : !canUpload ? (
                    <div className="space-y-3">
                      <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-muted p-8 text-center opacity-60">
                        <AlertTriangle className="h-12 w-12 text-amber-500" />
                        <p className="font-medium">Persyaratan Belum Terpenuhi</p>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Minimal 3 anggota tim', ok: memberCount >= 3 },
                          { label: 'Dosen pembimbing terisi', ok: hasDosen },
                        ].map((req) => (
                          <div key={req.label} className={`flex items-center gap-2 rounded p-2 text-sm ${req.ok ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
                            {req.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fileInputOriginal}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'original')}
                      />
                      <div
                        className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-blue-400 bg-blue-50/50 p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                        onClick={() => fileInputOriginal.current?.click()}
                      >
                        <FileText className="h-12 w-12 text-blue-500" />
                        <div>
                          <p className="font-medium text-blue-700 dark:text-blue-400">Klik atau drag file ke sini</p>
                          <p className="text-sm text-muted-foreground mt-1">Format: PDF | Maksimal: 10 MB</p>
                        </div>
                        {selectedFile && (
                          <div className="mt-2 rounded bg-blue-100 px-3 py-1.5 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {selectedFile.name} ({formatFileSize(selectedFile.size)})
                          </div>
                        )}
                      </div>
                      {selectedFile && originalProposal && (
                        <Button
                          className="w-full"
                          onClick={() => handleUpload(originalProposal.id, selectedFile)}
                          disabled={uploadMutation.isPending}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadMutation.isPending ? 'Uploading...' : 'Upload Proposal Original'}
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== PROPOSAL REVISED ===== */}
        <div className="space-y-4">
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-amber-700 dark:text-amber-400">
                  Proposal Revised
                </CardTitle>
                <Badge variant={STATUS_MAP[revisedProposal?.status || 'draft']?.variant || 'secondary'}>
                  {STATUS_MAP[revisedProposal?.status || 'draft']?.label || 'Draft'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File sudah diupload */}
              {revisedFile ? (
                <>
                  <div className="flex items-center gap-3 rounded-md border border-green-300 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                    <FileText className="h-8 w-8 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{revisedFile.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Diupload: {formatDate(revisedFile.uploadedAt)} | {formatFileSize(Number(revisedFile.fileSize))}
                      </p>
                    </div>
                    <DownloadButton proposalId={revisedProposal?.id} />
                  </div>

                  {revisedProposal?.status === 'draft' && (
                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      onClick={() => revisedProposal && submitMutation.mutate(revisedProposal.id)}
                      disabled={submitMutation.isPending}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {submitMutation.isPending ? 'Submitting...' : 'Submit Proposal Revised'}
                    </Button>
                  )}

                  <div className="rounded-md bg-amber-50 p-3 text-center text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    Proposal revised untuk dokumentasi (tidak direview)
                  </div>
                </>
              ) : (
                <>
                  {!canUploadRevision ? (
                    <div className="space-y-3">
                      <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-muted p-8 text-center opacity-60">
                        <Lock className="h-12 w-12 text-muted-foreground" />
                        <p className="font-medium text-muted-foreground">
                          {revisedProposal?.status !== 'needs_revision'
                            ? 'Proposal belum memerlukan revisi'
                            : 'Upload Revisi Belum Dibuka'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {revisedProposal?.status !== 'needs_revision'
                            ? 'Upload revisi tersedia setelah proposal original direview dan admin membuka periode revisi'
                            : 'Tunggu admin membuka periode upload revisi'}
                        </p>
                      </div>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Tentang Proposal Revised:</strong>
                          <ul className="mt-1 ml-4 list-disc text-sm">
                            <li>Hanya untuk dokumentasi perbaikan</li>
                            <li><strong>TIDAK akan direview lagi</strong></li>
                            <li>Proposal original + review tetap dapat diakses</li>
                            <li>Tersedia setelah admin buka toggle &quot;Upload Revisi&quot;</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fileInputRevised}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'revised')}
                      />
                      <div
                        className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-amber-400 bg-amber-50/50 p-8 text-center cursor-pointer hover:bg-amber-50 transition-colors dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
                        onClick={() => fileInputRevised.current?.click()}
                      >
                        <FileText className="h-12 w-12 text-amber-500" />
                        <div>
                          <p className="font-medium text-amber-700 dark:text-amber-400">Upload Proposal Revisi</p>
                          <p className="text-sm text-muted-foreground mt-1">Format: PDF | Max: 10 MB</p>
                        </div>
                        {selectedRevisedFile && (
                          <div className="mt-2 rounded bg-amber-100 px-3 py-1.5 text-sm text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {selectedRevisedFile.name} ({formatFileSize(selectedRevisedFile.size)})
                          </div>
                        )}
                      </div>
                      {selectedRevisedFile && revisedProposal && (
                        <Button
                          className="w-full bg-amber-600 hover:bg-amber-700"
                          onClick={() => handleUpload(revisedProposal.id, selectedRevisedFile)}
                          disabled={uploadMutation.isPending}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadMutation.isPending ? 'Uploading...' : 'Upload Proposal Revised'}
                        </Button>
                      )}
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="ml-4 list-disc text-sm">
                            <li>Proposal revised TIDAK akan direview lagi</li>
                            <li>Hanya untuk dokumentasi perbaikan</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Info */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Informasi Tim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Nama Tim:</span>
            <span className="font-medium">{team.namaTeam}</span>
            <span className="text-muted-foreground">Judul Proposal:</span>
            <span>{team.judulProposal}</span>
            <span className="text-muted-foreground">Jenis PKM:</span>
            <span>
              <Badge variant="outline">{team.jenisPkm?.nama || '-'}</Badge>
            </span>
            <span className="text-muted-foreground">Anggota:</span>
            <span>
              {memberCount} orang{' '}
              {memberCount >= 3 ? (
                <Badge variant="outline" className="text-green-700 border-green-300">Min. 3</Badge>
              ) : (
                <Badge variant="destructive">Kurang dari 3</Badge>
              )}
            </span>
            <span className="text-muted-foreground">Dosen Pembimbing:</span>
            <span>
              {team.dosenPembimbing?.nama || (
                <span className="text-muted-foreground italic">
                  Belum ditentukan.{' '}
                  <Link href={`/mahasiswa/teams/${id}/edit`} className="text-primary underline">
                    Edit tim
                  </Link>
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Success banner if both complete */}
      {originalProposal?.status === 'reviewed' && revisedFile && (
        <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Selamat! Proses proposal PKM Anda telah selesai. Silakan pantau pengumuman selanjutnya.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function DownloadButton({ proposalId }: { proposalId?: string }) {
  const { data: fileInfo, isLoading } = useQuery<FileInfo>({
    queryKey: ['proposal-file', proposalId],
    queryFn: () => api.get(`/proposals/${proposalId}/file`),
    enabled: !!proposalId,
  });

  if (!proposalId) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isLoading || !fileInfo?.downloadUrl}
      asChild={!!fileInfo?.downloadUrl}
    >
      {fileInfo?.downloadUrl ? (
        <a href={fileInfo.downloadUrl} target="_blank" rel="noopener noreferrer">
          <Download className="mr-1 h-3 w-3" />
          Download
        </a>
      ) : (
        <span>
          <Download className="mr-1 h-3 w-3" />
          {isLoading ? 'Loading...' : 'Download'}
        </span>
      )}
    </Button>
  );
}
