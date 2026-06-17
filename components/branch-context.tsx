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
  const [activeBranch, setActiveBranch] = useState('bengali-chowk');
  
  useEffect(() => {
    const role = localStorage.getItem("krishna_role");
    if (role === 'bengali-chowk') setActiveBranch('bengali-chowk');
    else if (role === 'namnakala') setActiveBranch('namnakala');
    else {
      // Admin defaults to bengali chowk, but can read from local storage
      const saved = localStorage.getItem('krishna_admin_branch');
      if (saved) setActiveBranch(saved);
      else setActiveBranch('bengali-chowk');
    }
  }, []);

  const handleSetBranch = (val: string) => {
    const role = localStorage.getItem("krishna_role");
    if (role === 'admin') {
      setActiveBranch(val);
      localStorage.setItem('krishna_admin_branch', val);
    } else {
      // Security enforcement: Non-admins cannot switch branches
      if (role === 'bengali-chowk') setActiveBranch('bengali-chowk');
      else if (role === 'namnakala') setActiveBranch('namnakala');
    }
  };

  return (
    <BranchContext.Provider value={{ activeBranch, setActiveBranch: handleSetBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
