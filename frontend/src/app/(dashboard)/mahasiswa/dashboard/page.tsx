'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Users,
  FileText,
  PlusCircle,
  Search,
  Upload,
  Eye,
  Pencil,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

interface DashboardTeam {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkm?: { id: string; nama: string };
  dosenPembimbing?: { id: string; nama: string };
  teamMembers: {
    id: string;
    role: string;
    mahasiswa: { id: string; nama: string; nim: string };
  }[];
  proposals: { id: string; status: string }[];
  _count: { teamMembers: number };
}

interface OpenTeamPreview {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkm?: { id: string; nama: string };
  _count: { teamMembers: number };
}

type DashboardResponse =
  | { layout: 'TEAM_DASHBOARD'; team: DashboardTeam; role: string; proposalStatus: string }
  | { layout: 'NO_TEAM'; openTeamsPreview: OpenTeamPreview[] };

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}

function NoTeamLayout({ openTeams }: { openTeams: OpenTeamPreview[] }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Empty State */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users size={28} className="text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Anda Belum Bergabung dalam Tim</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Untuk mengajukan proposal PKM, Anda harus tergabung dalam tim.
                <br />
                Buat tim baru atau bergabung dengan tim yang sudah ada.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/mahasiswa/teams/create">
                  <PlusCircle size={16} className="mr-2" />
                  Buat Tim Baru
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/mahasiswa/teams/browse">
                  <Search size={16} className="mr-2" />
                  Cari Tim
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Teams Preview */}
      {openTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tim yang Tersedia</CardTitle>
            <p className="text-sm text-muted-foreground">
              Beberapa tim yang sedang mencari anggota
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {openTeams.map((team) => (
                <Card key={team.id} className="border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{team.namaTeam}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {team.judulProposal}
                        </p>
                      </div>
                      {team.jenisPkm && (
                        <Badge variant="secondary" className="shrink-0">
                          {team.jenisPkm.nama}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {team._count.teamMembers}/5 anggota
                      </span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/mahasiswa/teams/browse">Lihat Detail</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link href="/mahasiswa/teams/browse">Lihat Semua Tim Tersedia</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamDashboardLayout({
  team,
  role,
  proposalStatus,
}: {
  team: DashboardTeam;
  role: string;
  proposalStatus: string;
}) {
  const memberCount = team._count.teamMembers;
  const hasDosen = !!team.dosenPembimbing;
  const isKetua = role === 'ketua';

  const pendingActions: { icon: React.ReactNode; title: string; desc: string; href: string; label: string }[] = [];

  if (proposalStatus === 'no_proposal' || proposalStatus === 'draft') {
    pendingActions.push({
      icon: <FileText size={16} />,
      title: 'Upload Proposal',
      desc: 'Proposal belum diupload. Upload sebelum deadline submission.',
      href: `/mahasiswa/teams/${team.id}/proposal`,
      label: 'Upload',
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* My Team Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Tim Saya</p>
              <h2 className="text-xl font-semibold text-primary truncate">
                {team.namaTeam}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {team.judulProposal}
              </p>
            </div>
            {team.jenisPkm && (
              <Badge variant="secondary" className="shrink-0 text-sm">
                {team.jenisPkm.nama}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{memberCount}</div>
              <div className="text-xs text-muted-foreground">Anggota</div>
            </div>
            <div className="rounded-lg border p-3 text-center bg-amber-50">
              <div className="text-lg font-bold text-amber-600 uppercase">
                {proposalStatus === 'no_proposal' ? '—' : proposalStatus}
              </div>
              <div className="text-xs text-muted-foreground">Status Proposal</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{hasDosen ? '✓' : '—'}</div>
              <div className="text-xs text-muted-foreground">Dosen Pembimbing</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{isKetua ? 'Ketua' : 'Anggota'}</div>
              <div className="text-xs text-muted-foreground">Peran Anda</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href={`/mahasiswa/teams/${team.id}`}>
                <Eye size={14} className="mr-1.5" />
                Lihat Detail Tim
              </Link>
            </Button>
            {(proposalStatus === 'no_proposal' || proposalStatus === 'draft') && (
              <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" asChild>
                <Link href={`/mahasiswa/teams/${team.id}/proposal`}>
                  <Upload size={14} className="mr-1.5" />
                  Upload Proposal
                </Link>
              </Button>
            )}
            {isKetua && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/mahasiswa/teams/${team.id}/edit`}>
                  <Pencil size={14} className="mr-1.5" />
                  Edit Tim
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <AlertTriangle size={16} />
              Tindakan yang Diperlukan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingActions.map((action, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="shrink-0 text-muted-foreground">{action.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <Button size="sm" asChild>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Team Members Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Anggota Tim ({memberCount} orang)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {team.teamMembers.map((member) => {
              const initials = member.mahasiswa.nama
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {member.mahasiswa.nama}
                      </span>
                      {member.role === 'ketua' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Ketua
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.mahasiswa.nim}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link href={`/mahasiswa/teams/${team.id}`}>
              Lihat Semua Anggota →
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MahasiswaDashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ['mahasiswa-dashboard'],
    queryFn: () => api.get<DashboardResponse>('/dashboard/mahasiswa'),
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Alert variant="destructive">
        <Info size={16} />
        <AlertDescription>
          Gagal memuat dashboard. Silakan refresh halaman.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  if (data.layout === 'NO_TEAM') {
    return <NoTeamLayout openTeams={data.openTeamsPreview} />;
  }

  return (
    <TeamDashboardLayout
      team={data.team}
      role={data.role}
      proposalStatus={data.proposalStatus}
    />
  );
}
