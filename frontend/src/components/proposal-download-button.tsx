'use client';

import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface FileInfo {
  id: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  mimeType: string;
  downloadUrl: string | null;
}

interface ProposalDownloadButtonProps {
  proposalId: string;
  /** Set to false to skip fetching (e.g. when you know no file exists) */
  hasFile?: boolean;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
}

export function ProposalDownloadButton({
  proposalId,
  hasFile = true,
  label = 'Download',
  size = 'sm',
  variant = 'outline',
}: ProposalDownloadButtonProps) {
  const { data: fileInfo, isLoading } = useQuery<FileInfo>({
    queryKey: ['proposal-file', proposalId],
    queryFn: () => api.get(`/proposals/${proposalId}/file`),
    enabled: !!proposalId && hasFile,
    retry: false,
  });

  if (!proposalId || !hasFile) return null;

  const downloadUrl = fileInfo?.downloadUrl;

  return (
    <Button
      size={size}
      variant={variant}
      disabled={isLoading || !downloadUrl}
      asChild={!!downloadUrl}
    >
      {downloadUrl ? (
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <Download className="mr-1 h-3 w-3" />
          {label}
        </a>
      ) : (
        <span>
          <Download className="mr-1 h-3 w-3" />
          {isLoading ? 'Loading...' : fileInfo && !downloadUrl ? 'File tidak tersedia' : label}
        </span>
      )}
    </Button>
  );
}
