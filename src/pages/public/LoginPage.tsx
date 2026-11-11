import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { DEMO_USERS } from '../../services/mockData';
import { HeartPulse, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role') || 'patient';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Pre-populate with demo user matching the role for smooth hackathon evaluation
    const demo = DEMO_USERS[requestedRole] || DEMO_USERS.patient;
    setEmail(demo.user.email);
    setPassword(demo.passwordHint);
  }, [requestedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const session = await login(email, password);
      if (session.user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (session.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (roleKey: 'patient' | 'doctor' | 'admin') => {
    const target = DEMO_USERS[roleKey];
    setEmail(target.user.email);
    setPassword(target.passwordHint);
    setIsLoading(true);
    setError(null);
    try {
      const session = await login(target.user.email, target.passwordHint);
      if (session.user.role === 'doctor') navigate('/doctor/dashboard');
      else if (session.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/patient/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white mx-auto shadow-md">
            <HeartPulse className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Sign in to RuralCare 360</h2>
          <p className="text-xs text-brandMuted">
            Secure telemedicine access for rural patients, doctors & administrators
          </p>
        </div>

        <Card className="shadow-lg border-slate-200/90">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@demo.ruralcare.test"
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="md"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Judge Login shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Hackathon 1-Click Evaluation Logins:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('patient')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-[11px] font-medium text-slate-700 transition-colors text-center"
              >
                👤 Patient (Asha)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('doctor')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-[11px] font-medium text-slate-700 transition-colors text-center"
              >
                🩺 Doctor (Dr. Meera)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-[11px] font-medium text-slate-700 transition-colors text-center"
              >
                🛡️ Admin (Suresh)
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Need a patient account?{' '}
          <Link to="/register" className="text-teal-700 font-semibold hover:underline">
            Register as Patient
          </Link>
        </p>
      </div>
    </div>
  );
};

