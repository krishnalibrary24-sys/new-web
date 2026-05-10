"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BranchProvider, useBranch } from "@/components/branch-context";

function DashboardInner({ children, role }: { children: React.ReactNode, role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = role === "admin";
  const { activeBranch, setActiveBranch } = useBranch();

  const navLinks = [
    { name: "Overview", icon: "space_dashboard", path: "/dashboard" },
    { name: "Students", icon: "school", path: "/dashboard/members" },
    { name: "Admission", icon: "person_add", path: "/dashboard/admission" },
    { name: "Seat Map", icon: "grid_view", path: "/dashboard/seating" },
    { name: "Dues", icon: "account_balance_wallet", path: "/dashboard/dues" },
    { name: "Invoices", icon: "receipt_long", path: "/dashboard/invoices" },
    { name: "Enquiries", icon: "contact_mail", path: "/dashboard/enquiries" },
    { name: "Expenses", icon: "trending_up", path: "/dashboard/expenses" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("krishna_role");
    localStorage.removeItem("krishna_staff_id");
    router.push("/login");
  };

  const getRoleBadge = () => {
    if (isAdmin) return { label: "Admin", color: "bg-primary/15 text-primary border-primary/25" };
    if (role === "bengali-chowk") return { label: "Bengali Chowk", color: "bg-tertiary/15 text-tertiary border-tertiary/25" };
    return { label: "Namnakala", color: "bg-secondary/15 text-secondary border-secondary/25" };
  };

  const badge = getRoleBadge();

  return (
    <div className="h-screen w-full bg-surface flex flex-col md:flex-row text-foreground font-body-md overflow-hidden relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600/[0.08] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/[0.06] rounded-full blur-[120px]" />
      </div>

      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="hidden md:flex w-[260px] flex-col bg-surface-container-low/60 backdrop-blur-xl border-r border-white/[0.06] h-screen sticky top-0 z-20">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20 group-hover:bg-primary/25 transition-colors">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>local_library</span>
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block font-manrope">Krishna Library</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border inline-block mt-0.5 ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </Link>
        </div>

        {/* Branch Toggle (Admin only) */}
        {isAdmin && (
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="bg-white/[0.04] rounded-xl p-1 flex relative">
              <button 
                onClick={() => setActiveBranch('bengali-chowk')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all z-10 ${activeBranch === 'bengali-chowk' ? 'text-white' : 'text-on-surface-variant hover:text-white/70'}`}
              >
                Bengali Chowk
              </button>
              <button 
                onClick={() => setActiveBranch('namnakala')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all z-10 ${activeBranch === 'namnakala' ? 'text-white' : 'text-on-surface-variant hover:text-white/70'}`}
              >
                Namnakala
              </button>
              <div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary/80 rounded-lg transition-all duration-300 ease-out shadow-[0_0_12px_rgba(191,194,255,0.15)]"
                style={{ left: activeBranch === 'bengali-chowk' ? '4px' : 'calc(50%)' }}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" data-lenis-prevent>
          <div className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest px-4 mb-2">Navigation</div>
          {navLinks.slice(0, 4).map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path} 
                href={link.path}
                className={`sidebar-link ${isActive ? 'active' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined text-lg" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}
          
          <div className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest px-4 mt-5 mb-2">Finance</div>
          {navLinks.slice(4).map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path} 
                href={link.path}
                className={`sidebar-link ${isActive ? 'active' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined text-lg" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-white/[0.06]">
          <button 
            onClick={handleLogout}
            className="sidebar-link text-on-surface-variant hover:text-red-400 hover:bg-red-500/[0.06] w-full"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 h-screen overflow-y-auto pb-20 md:pb-0 relative z-10" data-lenis-prevent>
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-container-low/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_library</span>
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight font-manrope">Krishna Library</span>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ml-2 ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-on-surface-variant hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ═══ Mobile Bottom Nav ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest/95 backdrop-blur-xl border-t border-white/[0.06] z-50 px-1 py-1.5 flex justify-around pb-safe">
        {navLinks.slice(0, 5).map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link 
              key={link.path} 
              href={link.path}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-on-surface-variant/60"
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {link.icon}
              </span>
              <span className="text-[9px] font-semibold mt-0.5 tracking-wide">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedRole = localStorage.getItem("krishna_role");
    if (!savedRole) {
      router.push("/login");
    } else {
      setRole(savedRole);
    }
  }, [router]);

  if (!role) return null;

  return (
    <BranchProvider>
      <DashboardInner role={role}>{children}</DashboardInner>
    </BranchProvider>
  );
}
