
"use client";

import Header from "./Header";
import Footer from "./Footer";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pb-6 pt-[56px]">
        {children}
      </main>

      <Footer />
    </div>
  );
}
