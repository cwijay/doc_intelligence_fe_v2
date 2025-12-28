import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Access headers to ensure dynamic rendering
  await headers();
  
  return (
    <div>
      {children}
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Register | biz2Bricks.ai',
    description: 'Create your account and start managing documents with AI',
    robots: 'noindex, nofollow',
    other: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  };
}