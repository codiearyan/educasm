export const TopicsSkeleton = () => {
  return (
    <div className="flex flex-wrap gap-2 mt-4 mb-6">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-6 rounded-full bg-gray-800/50"
          style={{ width: `${Math.floor(Math.random() * (160 - 100) + 100)}px` }}
        />
      ))}
    </div>
  );
};

export const QuestionsSkeleton = () => {
  return (
    <div className="mt-6 border-t border-gray-800 pt-3">
      <div className="h-5 w-40 bg-gray-800/50 rounded mb-3" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div 
              className="h-5 bg-gray-800/50 rounded flex-1"
              style={{ width: `${Math.floor(Math.random() * (90 - 70) + 70)}%` }}
            />
            <div className="h-5 w-5 bg-gray-800/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}; 