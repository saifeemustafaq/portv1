import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import HomeContent from '@/app/components/HomeContent';
import { Suspense } from 'react';

export default function Home() {
  return (
    <ErrorBoundary name="HomePage">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <HomeContent />
      </Suspense>
    </ErrorBoundary>
  );
}
