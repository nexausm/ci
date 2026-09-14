import Link from "next/link";

export default function DocsNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-6xl font-semibold tracking-tight">404</h1>
      <p className="text-fd-muted-foreground mt-3 text-lg">
        This page maybe has been moved.
      </p>
      <Link
        href="/docs"
        className="bg-fd-primary text-black mt-6 rounded-md px-4 py-2 text-sm font-medium"
      >
        Back to the docs
      </Link>
    </main>
  );
}
