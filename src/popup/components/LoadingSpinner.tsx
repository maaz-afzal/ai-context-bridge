interface Props {
  message?: string;
}

export const LoadingSpinner = ({ message = 'Loading...' }: Props) => (
  <div className="flex flex-col items-center justify-center py-8">
    <div className="w-12 h-12 mb-4 border-b-2 border-blue-500 rounded-full animate-spin" />
    <p className="text-gray-600">{message}</p>
  </div>
);
