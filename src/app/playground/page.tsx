'use client';

import { PlaygroundView } from '@/components/playground/playground-view';
import { useUserContext } from '@/components/providers/user-provider';
import { toast } from 'react-hot-toast';

export default function PlaygroundPage() {
  const { userContext } = useUserContext();

  const handleError = (message: string) => {
    toast.error(message);
  };

  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  if (!userContext) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fade-in">
        <div className="w-full max-w-3xl space-y-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-white mb-8">
            Please complete your profile
          </h1>
          <div className="space-y-2">
            <p className="text-gray-400 text-center">
              You need to set up your profile before you can start practicing.
            </p>
          </div>
        </div>
      </div>
    );
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