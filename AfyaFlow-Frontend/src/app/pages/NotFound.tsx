import { useNavigate } from 'react-router';
import { Activity, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="w-12 h-12 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">AfyaFlow</h1>
        </div>
        
        <div className="mb-8">
          <h2 className="text-8xl font-bold text-primary mb-4">404</h2>
          <h3 className="text-3xl font-semibold text-foreground mb-2">Page Not Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
