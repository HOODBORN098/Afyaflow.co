import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Activity, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { loginApi, roleToRoute } from '../../lib/api';
import { setAuthSession } from '../../lib/authStorage';
import { hasBookingData } from '../../lib/bookingService';

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Intercept SSO token
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const role = payload.role || '';
        const userId = payload.userId || payload.id || 0;
        
        setAuthSession(token, role, userId);
        window.history.replaceState({}, document.title, window.location.pathname);
        toast.success("Authentication successful");
        navigate(roleToRoute(role));
      } catch (err) {
        console.error("Invalid token parsing", err);
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await loginApi({ email, password });
      
      if (res.role !== 'PATIENT' && res.role !== 'USER') {
        window.location.href = `http://localhost:5174/login?token=${res.accessToken}`;
        return;
      }

      // ========== BOOKING DATA RESTORATION ==========
      /**
       * After successful login, check if user has a booking in progress.
       * If yes, redirect to booking page to complete it.
       * If no, go to patient dashboard.
       * 
       * This ensures user doesn't lose booking data if they log out mid-booking.
       */
      setAuthSession(res.accessToken, res.role, res.userId);
      toast.success('Login successful!');
      
      // Check if user has pending booking
      if (hasBookingData()) {
        console.log('Booking data found, redirecting to complete booking');
        navigate('/book-appointment'); // Go back to booking with data restored
      } else {
        navigate(roleToRoute(res.role)); // Normal flow to dashboard
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error("Login Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">AfyaFlow</h1>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 rounded" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/register')}
                className="text-primary hover:underline font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
