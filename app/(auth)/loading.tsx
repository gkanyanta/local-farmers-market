export default function AuthLoading() {
  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-32 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
        <div className="space-y-3 mt-6">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
