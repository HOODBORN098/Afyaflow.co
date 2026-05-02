import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Activity, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../lib/api';

export function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // We'll use a new endpoint for this or reuse register logic if appropriate
      // For now, let's assume we have a /api/auth/set-password endpoint
      await apiRequest('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      setIsSuccess(true);
      toast.success('Password set successfully!');
    } catch (err) {
      toast.error('Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Account Ready!</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Your password has been set. You can now log in to view your appointments and queue status.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold">AfyaFlow</h1>
          </div>
          <p className="text-muted-foreground font-medium">Complete your account setup</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-1">Setting password for:</p>
            <p className="font-bold text-lg">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? 'Setting Password...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
