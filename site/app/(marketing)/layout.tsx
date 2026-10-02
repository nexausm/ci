import Footer from "@site/components/pixels/Footer";
import Navbar from "@site/components/pixels/Navbar";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dark text-foreground min-h-dvh bg-[#040404]">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
