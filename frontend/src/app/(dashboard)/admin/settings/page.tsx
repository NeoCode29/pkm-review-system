'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Upload, FileSearch, RefreshCw, History, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// Backend returns flat object: { uploadProposalEnabled: true, reviewEnabled: false, ... }
type ToggleStates = Record<string, boolean>;

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  userId: string;
  createdAt: string;
}

const TOGGLE_INFO: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string; sideEffects?: { on?: string; off?: string } }> = {
  uploadProposalEnabled: {
    label: 'Upload Proposal',
    desc: 'Mahasiswa dapat mengupload proposal original',
    icon: <Upload className="h-5 w-5" />,
    color: 'text-blue-500',
  },
  reviewEnabled: {
    label: 'Review Period',
    desc: 'Reviewer dapat menilai proposal yang disubmit',
    icon: <FileSearch className="h-5 w-5" />,
    color: 'text-yellow-500',
    sideEffects: {
      on: 'Semua proposal berstatus "submitted" dan "revised" akan otomatis berubah ke "under_review".',
      off: 'Semua proposal "under_review" akan difinalisasi: yang sudah di-review mendapat skor rata-rata, yang belum akan berstatus "not_reviewed".',
    },
  },
  uploadRevisionEnabled: {
    label: 'Upload Revisi',
    desc: 'Mahasiswa dapat mengupload revisi proposal',
    icon: <RefreshCw className="h-5 w-5" />,
    color: 'text-green-500',
    sideEffects: {
      on: 'Semua proposal berstatus "reviewed" akan otomatis berubah ke "needs_revision".',
    },
  },
};

const PHASE_MAP: Record<string, { label: string; color: string }> = {
  uploadProposalEnabled: { label: 'Submission Period', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  reviewEnabled: { label: 'Review Period', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  uploadRevisionEnabled: { label: 'Revision Period', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{ key: string; enabled: boolean } | null>(null);

  const { data: toggles, isLoading } = useQuery<ToggleStates>({
    queryKey: ['system-config'],
    queryFn: () => api.get('/config'),
  });

  const { data: auditLog } = useQuery<AuditLogEntry[]>({
    queryKey: ['config-audit-log'],
    queryFn: () => api.get('/config/audit-log?limit=10'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      api.put(`/config/${key}`, { body: { enabled } }),
    onSuccess: () => {
      toast.success('Pengaturan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['config-audit-log'] });
      setConfirmDialog(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal memperbarui pengaturan');
      setConfirmDialog(null);
    },
  });

  const getToggleValue = (key: string) => {
    return toggles?.[key] ?? false;
  };

  const handleToggle = (key: string, checked: boolean) => {
    const info = TOGGLE_INFO[key];
    const sideEffect = checked ? info.sideEffects?.on : info.sideEffects?.off;
    if (sideEffect) {
      setConfirmDialog({ key, enabled: checked });
    } else {
      toggleMutation.mutate({ key, enabled: checked });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  const activeKey = Object.keys(TOGGLE_INFO).find((key) => getToggleValue(key));
  const activePhase = activeKey ? PHASE_MAP[activeKey] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola fase sistem. Hanya satu toggle yang aktif pada satu waktu (auto-exclusive).
        </p>
      </div>

      {/* Current Phase */}
      <Card className={activePhase?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-medium opacity-70">Current System Phase</p>
            <p className="text-xl font-bold">{activePhase?.label || 'CLOSED'}</p>
            {!activePhase && (
              <p className="text-sm opacity-80 mt-0.5">Semua fitur upload dan review sedang ditutup</p>
            )}
          </div>
          <Settings className="h-8 w-8 opacity-30" />
        </CardContent>
      </Card>

      <Separator />

      {/* Toggle Cards */}
      <div className="space-y-4">
        {Object.entries(TOGGLE_INFO).map(([key, info]) => {
          const enabled = getToggleValue(key);
          return (
            <Card key={key} className={enabled ? 'border-primary' : ''}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={info.color}>{info.icon}</div>
                  <div>
                    <p className="font-medium">{info.label}</p>
                    <p className="text-sm text-muted-foreground">{info.desc}</p>
                    {info.sideEffects && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Toggle ini memiliki side-effect pada status proposal
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => handleToggle(key, checked)}
                  disabled={toggleMutation.isPending}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <strong>Catatan:</strong> Toggle bersifat auto-exclusive. Mengaktifkan satu toggle akan otomatis menonaktifkan toggle lainnya.
          Menonaktifkan semua toggle akan mengubah fase ke CLOSED.
        </CardContent>
      </Card>

      {/* Audit Log */}
      {auditLog && auditLog.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Recent Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditLog.map((entry) => {
                const oldVal = safeParseJSON(entry.oldValue);
                const newVal = safeParseJSON(entry.newValue);
                const toggleLabel = TOGGLE_INFO[entry.entityId]?.label || entry.entityId;
                return (
                  <div key={entry.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{toggleLabel}</span>
                      <span className="text-muted-foreground ml-2">
                        {oldVal?.enabled ? 'ON' : 'OFF'} → {newVal?.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Konfirmasi Perubahan
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <span className="block">
                  Anda akan {confirmDialog?.enabled ? 'mengaktifkan' : 'menonaktifkan'}{' '}
                  <strong>{confirmDialog ? TOGGLE_INFO[confirmDialog.key]?.label : ''}</strong>.
                </span>
                {confirmDialog && (
                  <span className="block text-yellow-600 dark:text-yellow-400 font-medium">
                    {confirmDialog.enabled
                      ? TOGGLE_INFO[confirmDialog.key]?.sideEffects?.on
                      : TOGGLE_INFO[confirmDialog.key]?.sideEffects?.off}
                  </span>
                )}
                <span className="block">Tindakan ini tidak dapat dibatalkan. Lanjutkan?</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog && toggleMutation.mutate(confirmDialog)}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? 'Memproses...' : 'Lanjutkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function safeParseJSON(str: string) {
  try { return JSON.parse(str); } catch { return null; }
}
