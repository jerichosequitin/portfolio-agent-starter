import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { portfolio } from '@/lib/portfolio';

import './globals.css';

export const metadata: Metadata = {
  title: `${portfolio.profile.name} | ${portfolio.profile.role}`,
  description: portfolio.profile.intro,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
