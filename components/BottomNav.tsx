'use client';

// Fixed iOS-style bottom tab bar with frosted glass backdrop
import Link      from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Layers, ArrowLeftRight, Home } from 'lucide-react';

const TABS = [
  { href: '/',            label: 'Inicio',      Icon: Home          },
  { href: '/album',       label: 'Mi Álbum',    Icon: LayoutGrid    },
  { href: '/repetidos',   label: 'Repetidas',   Icon: Layers        },
  { href: '/intercambio', label: 'Intercambio', Icon: ArrowLeftRight },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30
                 bg-white/80 dark:bg-black/80 backdrop-blur-ios
                 border-t border-gray-200/60 dark:border-gray-800/60"
      style={{ paddingBottom: 'var(--sab)' }}
    >
      <div className="flex items-stretch h-[50px]">
        {TABS.map(({ href, label, Icon }) => {
          // Match exact for root, startsWith for others
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5 tap-scale',
                active ? 'text-ios-blue' : 'text-ios-gray dark:text-ios-gray2',
              ].join(' ')}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.8}
                className="transition-all duration-150"
              />
              <span className={`text-[9px] font-medium leading-none ${active ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
