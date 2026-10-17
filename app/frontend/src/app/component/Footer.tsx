
"use client";

import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-border bg-background text-foreground transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="FinTrack AI"
              width={26}
              height={26}
            />

            <span className="text-sm font-semibold">
              FinTrack AI
            </span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {currentYear} FinTrack AI. All rights reserved.
          </p>

          {/* Tagline */}
          <p className="text-xs text-muted-foreground">
            Your money, clearly in focus.
          </p>
        </div>
      </div>
    </footer>
  );
}
