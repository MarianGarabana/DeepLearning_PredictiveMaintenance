import type { Metadata } from 'next';
import { Chakra_Petch, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { Navigation } from '@/components/Navigation';
import './globals.css';

// HUD Avionics type system — self-hosted via next/font (no runtime requests).
const display = Chakra_Petch({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

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
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="bg-ground text-ink font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
