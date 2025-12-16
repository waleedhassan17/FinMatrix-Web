// GL Module Layout
// Shared layout for all General Ledger pages

import type { ReactNode } from 'react';

interface GLLayoutProps {
  children: ReactNode;
}

export default function GLLayout({ children }: GLLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  );
}
