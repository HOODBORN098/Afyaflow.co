import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getCurrentRole, getAccessToken } from '../../lib/authStorage';

export function StaffRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = getCurrentRole();
    const token = getAccessToken();

    if (role === 'PATIENT') {
        navigate('/patient');
    } else if (role) {
        // Redirect staff to port 5174
        window.location.href = `http://localhost:5174/login?token=${token}`;
    } else {
        navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted font-sans p-6 text-center">
      <div className="space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-bold text-foreground">Redirecting to Staff Portal...</h2>
        <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
          Please wait while we securely transition you to the professional hospital interface.
        </p>
      </div>
    </div>
  );
}
