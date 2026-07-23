"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type BranchContextType = {
  activeBranch: string;
  setActiveBranch: (branch: string) => void;
};

const BranchContext = createContext<BranchContextType>({ 
  activeBranch: 'bengali-chowk', 
  setActiveBranch: () => {} 
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [activeBranch, setActiveBranch] = useState<string>(() => {
    if (typeof window === 'undefined') return 'bengali-chowk';
    const role = localStorage.getItem("krishna_role");
    const staffId = (localStorage.getItem("krishna_staff_id") || "").toUpperCase();

    // Strict branch binding for non-admin staff
    if (role === 'bengali-chowk' || staffId.includes('BENGALI')) return 'bengali-chowk';
    if (role === 'namnakala' || staffId.includes('NAMNAKALA')) return 'namnakala';

    // Admin role: use saved branch preference or default to bengali-chowk
    if (role === 'admin') {
      const saved = localStorage.getItem('krishna_admin_branch');
      if (saved === 'namnakala' || saved === 'bengali-chowk') return saved;
    }

    return 'bengali-chowk';
  });

  useEffect(() => {
    // Continuously enforce authorized branch
    const role = localStorage.getItem("krishna_role");
    const staffId = (localStorage.getItem("krishna_staff_id") || "").toUpperCase();

    if (role === 'bengali-chowk' || staffId.includes('BENGALI')) {
      if (activeBranch !== 'bengali-chowk') setActiveBranch('bengali-chowk');
    } else if (role === 'namnakala' || staffId.includes('NAMNAKALA')) {
      if (activeBranch !== 'namnakala') setActiveBranch('namnakala');
    }
  }, [activeBranch]);

  const handleSetBranch = (val: string) => {
    const role = localStorage.getItem("krishna_role");
    const staffId = (localStorage.getItem("krishna_staff_id") || "").toUpperCase();

    // ONLY true admin account can switch branches
    const isTrueAdmin = role === 'admin' && !staffId.includes('NAMNAKALA') && !staffId.includes('BENGALI');

    if (isTrueAdmin) {
      if (val === 'bengali-chowk' || val === 'namnakala') {
        setActiveBranch(val);
        localStorage.setItem('krishna_admin_branch', val);
      }
    } else {
      // Security enforcement: Non-admins cannot switch branches
      if (role === 'namnakala' || staffId.includes('NAMNAKALA')) {
        setActiveBranch('namnakala');
      } else {
        setActiveBranch('bengali-chowk');
      }
    }
  };

  return (
    <BranchContext.Provider value={{ activeBranch, setActiveBranch: handleSetBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
