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
  downloadUrl: string;
}

interface ProposalDownloadButtonProps {
  proposalId: string;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
}

export function ProposalDownloadButton({
  proposalId,
  label = 'Download',
  size = 'sm',
  variant = 'outline',
}: ProposalDownloadButtonProps) {
  const { data: fileInfo, isLoading } = useQuery<FileInfo>({
    queryKey: ['proposal-file', proposalId],
    queryFn: () => api.get(`/proposals/${proposalId}/file`),
    enabled: !!proposalId,
  });

  if (!proposalId) return null;

  return (
    <Button
      size={size}
      variant={variant}
      disabled={isLoading || !fileInfo?.downloadUrl}
      asChild={!!fileInfo?.downloadUrl}
    >
      {fileInfo?.downloadUrl ? (
        <a href={fileInfo.downloadUrl} target="_blank" rel="noopener noreferrer">
          <Download className="mr-1 h-3 w-3" />
          {label}
        </a>
      ) : (
        <span>
          <Download className="mr-1 h-3 w-3" />
          {isLoading ? 'Loading...' : label}
        </span>
      )}
    </Button>
  );
}
