"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CompanyInfo } from "@/lib/types";

const CompanyContext = createContext<{
  company: CompanyInfo;
  setCompany: (next: CompanyInfo) => void;
} | null>(null);

export function CompanyProvider({
  company,
  children,
}: {
  company: CompanyInfo;
  children: React.ReactNode;
}) {
  const [current, setCompany] = useState(company);
  const value = useMemo(() => ({ company: current, setCompany }), [current]);

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

function useCompanyContext() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return ctx;
}

export function useCompany() {
  return useCompanyContext().company;
}

export function useSetCompany() {
  return useCompanyContext().setCompany;
}
