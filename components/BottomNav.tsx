'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Beranda', href: '/', icon: Home },
    { name: 'Mencari', href: '/search', icon: Search },
    { name: 'Pustaka', href: '/library', icon: Library },
    { name: 'Developer', href: '/developer', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe pt-1 pointer-events-none">
      <div className="max-w-md mx-auto mb-2 rounded-3xl liquid-glass px-2 py-1 pointer-events-auto shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 min-w-0 h-full py-0.5 transition-all duration-200',
                  isActive ? 'text-white' : 'text-white/60 hover:text-white'
                )}
              >
                <div
                  className={cn(
                    'px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center',
                    isActive 
                      ? 'bg-white text-zinc-950 shadow-md shadow-white/10 scale-105' 
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn('w-4.5 h-4.5 transition-transform', isActive ? 'text-zinc-950 fill-current' : 'text-white/70')}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={cn('text-[10px] tracking-tight transition-all truncate mt-0.5', isActive ? 'font-bold text-white' : 'font-medium text-white/60')}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}


