import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aerospace Predictive Maintenance',
  description: 'Real-time turbofan engine RUL monitoring and prediction',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-aerospace-darker text-white">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
