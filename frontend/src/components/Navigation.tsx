'use client';

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Fleet', icon: '🛫' },
  { href: '/performance', label: 'Performance', icon: '📊' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-aerospace-dark border-b border-aerospace-accent/20">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-white hover:text-aerospace-accent transition">
          <div className="w-8 h-8 bg-aerospace-accent rounded flex items-center justify-center text-aerospace-darker font-bold">
            PM
          </div>
          <span className="font-bold text-lg">Predictive Maintenance</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-8">
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded transition ${
                pathname === href
                  ? 'text-aerospace-accent border-b-2 border-aerospace-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              <span className="font-semibold">{label}</span>
            </Link>
          ))}
        </div>

        {/* API Status */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-aerospace-success rounded-full animate-pulse"></div>
          <span>API Connected</span>
        </div>
      </div>
    </nav>
  );
}
