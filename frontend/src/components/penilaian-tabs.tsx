'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Kriteria Administratif', href: '/admin/penilaian/administratif' },
  { label: 'Kriteria Substantif', href: '/admin/penilaian/substantif' },
];

export function PenilaianTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b mb-4">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            pathname === tab.href
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
