import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata = {
  title: 'AI Trip Planner',
  description: 'Plan your perfect trip with the power of AI',
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-[#0f172a]">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
