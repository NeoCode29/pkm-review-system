'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  mahasiswa: [
    { label: 'Dashboard', href: '/mahasiswa/dashboard', icon: <Home size={18} /> },
    { label: 'Cari Tim', href: '/mahasiswa/teams/browse', icon: <Search size={18} /> },
    { label: 'Buat Tim', href: '/mahasiswa/teams/create', icon: <PlusCircle size={18} /> },
    { label: 'Tim Saya', href: '/mahasiswa/teams', icon: <Users size={18} /> },
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
    { label: 'Master Data', href: '/admin/master-data/jurusan', icon: <Database size={18} /> },
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
  const items = NAV_ITEMS[role] || [];

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
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
  const { isAuthenticated, user } = useAuthStore();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
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
