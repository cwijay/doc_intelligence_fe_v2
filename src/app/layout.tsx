import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "biz2Bricks.ai | Document Intelligence for Small Business",
  description: "AI-powered document management and intelligence platform designed for small businesses to organize, analyze, and extract insights from their documents.",
  keywords: ["document management", "small business", "AI", "document intelligence", "business automation"],
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f9fafb" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-inter antialiased`}>
        <ThemeProvider>
          <ErrorBoundary>
            <QueryProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </QueryProvider>
          </ErrorBoundary>
          <Toaster
            position="top-right"
            gutter={12}
            containerStyle={{
              top: 80,
            }}
            toastOptions={{
              duration: 4000,
              className: '',
              style: {
                background: '#ffffff',
                color: '#1e293b',
                boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderLeft: '4px solid #E07850',
                maxWidth: '400px',
                lineHeight: '1.5',
                gap: '12px',
              },
              success: {
                style: {
                  background: 'linear-gradient(to right, #f0fdf4, #ffffff)',
                  borderLeft: '4px solid #22c55e',
                  color: '#166534',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                style: {
                  background: 'linear-gradient(to right, #fef2f2, #ffffff)',
                  borderLeft: '4px solid #ef4444',
                  color: '#991b1b',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
              loading: {
                style: {
                  background: 'linear-gradient(to right, #fef3ef, #ffffff)',
                  borderLeft: '4px solid #E07850',
                  color: '#5a3020',
                },
                iconTheme: {
                  primary: '#E07850',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
