import '@mantine/core/styles.css';

import React from 'react';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import JotaiProvider from '@/lib/jotai/providers/JotaiProvider';
import QueryProvider from '@/lib/react-query/QueryProvider';
import { theme } from '../theme';

export const metadata = {
  title: 'VIP Shop Management',
  description: 'Enterprise-grade shop management application',
  keywords: ['shop', 'management', 'enterprise'],
  authors: [{ name: 'VIP Shop Management' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'VIP Shop Management',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <meta name="theme-color" content="#228be6" />
      </head>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <JotaiProvider>
              <MantineProvider theme={theme}>{children}</MantineProvider>
            </JotaiProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
