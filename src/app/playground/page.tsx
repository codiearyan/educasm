'use client';

import { PlaygroundView } from '@/components/playground/playground-view';
import { useUserContext } from '@/components/providers/user-provider';
import { PreFillForm } from '@/components/shared/pre-fill-form';
import { toast } from 'react-hot-toast';

export default function PlaygroundPage() {
  const { userContext, setUserContext } = useUserContext();

  const handleError = (message: string) => {
    toast.error(message);
  };

  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  if (!userContext) {
    return <PreFillForm onSubmit={setUserContext} />;
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-3xl space-y-8">
        <PlaygroundView
          onError={handleError}
          onSuccess={handleSuccess}
          userContext={userContext}
        />
      </div>
    </div>
  );
} 