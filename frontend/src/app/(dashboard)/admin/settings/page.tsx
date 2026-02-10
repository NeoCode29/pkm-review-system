'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Upload, FileSearch, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface ToggleState {
  configKey: string;
  configValue: { enabled: boolean };
}

const TOGGLE_INFO: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
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
  },
  uploadRevisionEnabled: {
    label: 'Upload Revisi',
    desc: 'Mahasiswa dapat mengupload revisi proposal',
    icon: <RefreshCw className="h-5 w-5" />,
    color: 'text-green-500',
  },
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data: toggles, isLoading } = useQuery<ToggleState[]>({
    queryKey: ['system-config'],
    queryFn: () => api.get('/config'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      api.put(`/config/${key}`, { body: { enabled } }),
    onSuccess: () => {
      toast.success('Pengaturan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Gagal memperbarui pengaturan'),
  });

  const getToggleValue = (key: string) => {
    const toggle = toggles?.find((t) => t.configKey === key);
    return toggle?.configValue?.enabled ?? false;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola fase sistem. Hanya satu toggle yang aktif pada satu waktu (auto-exclusive).
        </p>
      </div>

      {/* Current Phase */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" /> Current Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const active = Object.keys(TOGGLE_INFO).find((key) => getToggleValue(key));
            if (!active) return <Badge variant="outline">CLOSED</Badge>;
            const info = TOGGLE_INFO[active];
            return (
              <Badge variant="default" className="text-sm">
                {info.label}
              </Badge>
            );
          })()}
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
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => toggleMutation.mutate({ key, enabled: checked })}
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
    </div>
  );
}
