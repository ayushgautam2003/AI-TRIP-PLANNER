'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PlaneTakeoff, LogOut, LayoutDashboard, Plus } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <header className={`top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHome
        ? 'fixed bg-[#0f172a]/60 backdrop-blur-md'
        : 'sticky bg-[#0f172a]/98 backdrop-blur-md border-b border-white/8'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
            <PlaneTakeoff className="w-4 h-4 text-violet-400" />
          </div>
          <span className="font-bold text-[15px] text-white tracking-tight">
            AI Trip Planner
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <span className="hidden md:block text-xs text-slate-400 mr-2">
                {user.name.split(' ')[0]}
              </span>

              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white font-medium transition-colors px-3 py-2 rounded-lg hover:bg-white/8"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Trips</span>
              </Link>

              <Link
                href="/create-trip"
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 active:scale-95 transition-all ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
                New Trip
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-white/5 ml-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/8"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 ml-1 bg-violet-600 text-white hover:bg-violet-700"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

      </div>
    </header>
  );
}
