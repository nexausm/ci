"use client";

import { createContext, useContext } from "react";
import type { CompanyInfo } from "@/lib/types";

const CompanyContext = createContext<CompanyInfo | null>(null);

export function CompanyProvider({
  company,
  children,
}: {
  company: CompanyInfo;
  children: React.ReactNode;
}) {
  return (
    <CompanyContext.Provider value={company}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyInfo {
  const company = useContext(CompanyContext);
  if (!company) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return company;
}
