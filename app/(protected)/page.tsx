import { Suspense } from "react";
import { Dashboard } from "@/app/components/dashboard";

export default function Home() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
