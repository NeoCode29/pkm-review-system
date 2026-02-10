'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Home,
  Search,
  PlusCircle,
  Users,
  FileText,
  ClipboardList,
  Settings,
  Database,
  UserCog,
  LogOut,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  mahasiswa: [
    { label: 'Dashboard', href: '/mahasiswa/dashboard', icon: <Home size={18} /> },
  ],
  mahasiswa_no_team: [
    { label: 'Cari Tim', href: '/mahasiswa/teams/browse', icon: <Search size={18} /> },
    { label: 'Buat Tim', href: '/mahasiswa/teams/create', icon: <PlusCircle size={18} /> },
  ],
  reviewer: [
    { label: 'Dashboard', href: '/reviewer/dashboard', icon: <Home size={18} /> },
    { label: 'Daftar Proposal', href: '/reviewer/proposals', icon: <FileText size={18} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <Home size={18} /> },
    { label: 'Users', href: '/admin/users', icon: <UserCog size={18} /> },
    { label: 'Teams', href: '/admin/teams', icon: <Users size={18} /> },
    { label: 'Reviewers', href: '/admin/reviewers', icon: <ClipboardList size={18} /> },
    { label: 'Penilaian', href: '/admin/penilaian/administratif', icon: <BarChart3 size={18} /> },
    { label: 'Master Data', href: '/admin/master-data/prodi', icon: <Database size={18} /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  mahasiswa: 'Mahasiswa',
  reviewer: 'Reviewer',
  admin: 'Admin',
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuthStore();
  const role = user?.role || 'mahasiswa';

  const { data: dashboardData } = useQuery<{ layout: string; team?: { id: string } }>({
    queryKey: ['mahasiswa-dashboard'],
    queryFn: () => api.get('/dashboard/mahasiswa'),
    enabled: role === 'mahasiswa',
    staleTime: 30_000,
  });

  const teamId = dashboardData?.team?.id;

  const items = (() => {
    const base = NAV_ITEMS[role] || [];
    if (role !== 'mahasiswa') return base;
    const hasTeam = dashboardData?.layout === 'TEAM_DASHBOARD' && teamId;
    if (!hasTeam) return [...base, ...NAV_ITEMS.mahasiswa_no_team];
    return [
      ...base,
      { label: 'Tim Saya', href: `/mahasiswa/teams/${teamId}`, icon: <Users size={18} /> },
      { label: 'Proposal', href: `/mahasiswa/teams/${teamId}/proposal`, icon: <FileText size={18} /> },
    ];
  })();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = profile
    ? 'nama' in profile
      ? profile.nama
      : ''
    : user?.email || '';

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          P
        </div>
        <div>
          <div className="text-sm font-semibold">PKM Review</div>
          <div className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {items.map((item, idx) => {
            // Determine active state
            let isActive = pathname === item.href;

            // For parent menu items that have sub-routes (Master Data, Penilaian)
            const parentPrefixes: Record<string, string> = {
              '/admin/master-data/prodi': '/admin/master-data',
              '/admin/penilaian/administratif': '/admin/penilaian',
            };
            const prefix = parentPrefixes[item.href];
            if (!isActive && prefix && pathname.startsWith(prefix)) {
              isActive = true;
            }

            // For other items, check startsWith but avoid overlap with longer sibling matches
            if (!isActive && !prefix && pathname.startsWith(item.href + '/')) {
              const betterMatch = items.some(
                (other, oi) => oi !== idx && pathname.startsWith(other.href) && other.href.length > item.href.length,
              );
              isActive = !betterMatch;
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User info + Logout */}
      <div className="p-4">
        <div className="mb-3">
          <div className="text-sm font-medium truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground truncate">
            {user?.email}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if already hydrated (client-side nav) or wait for hydration (page refresh)
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setReady(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <SidebarContent onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            {user.email}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
