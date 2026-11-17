import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { OperationProvider } from '@/components/merchant-pulse/operation-context'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Merchant Pulse — Saúde da carteira', template: '%s | Merchant Pulse' },
  description: 'Monitore a performance dos seus restaurantes, identifique riscos e aja antes do churn.',
  applicationName: 'Merchant Pulse',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b1120',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="dark"><body className="antialiased"><OperationProvider>{children}</OperationProvider>{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
