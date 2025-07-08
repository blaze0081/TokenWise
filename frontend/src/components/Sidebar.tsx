'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Top Wallet Discovery', href: '/' },
  { name: 'Insights Dashboard', href: '/insights' },
  { name: 'Historical Analysis', href: '/historical' },
  { name: 'Wallet Monitoring', href: '/monitoring' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">TokenWise</h1>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
