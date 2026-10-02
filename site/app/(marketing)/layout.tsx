import Footer from "@site/components/pixels/Footer";
import Navbar from "@site/components/pixels/Navbar";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-background text-foreground min-h-dvh overflow-x-clip">
      <Navbar />
      <main className="site-container">{children}</main>
      <Footer />
    </div>
  );
}
