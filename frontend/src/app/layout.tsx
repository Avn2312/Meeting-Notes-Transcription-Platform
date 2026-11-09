import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fireflies.ai Clone — AI Meeting Notes & Transcription',
  description: 'AI meeting assistant web application replicating Fireflies.ai post-meeting workflows, interactive transcripts, summaries, and action items.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
