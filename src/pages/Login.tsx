import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/app/auth-context';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/services/authService';
import { Eye, EyeOff, Lock, Mail, Copy, CheckCircle, AlertCircle, Factory } from 'lucide-react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');

  const validate = (): boolean => {
    const next: { email?: string; password?: string } = {};

    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }

    if (!password) {
      next.password = 'Password is required.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.ok) {
        addToast({
          type: 'success',
          title: 'Welcome back',
          message: 'Signed in with a demo session.',
        });
        navigate('/dashboard', { replace: true });
      } else {
        setFormError(result.error ?? 'Invalid demo email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyCredential = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      addToast({ type: 'success', title: `${label} copied`, message: value });
    } catch {
      addToast({ type: 'info', title: `Copy ${label}`, message: value });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Factory className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">TexFlow</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Textile Manufacturing System
          </h2>
          <p className="mt-4 text-navy-300 leading-relaxed">
            Manage buyers, inventory, production, quality, dispatch, workforce, and
            finance — all from one dashboard.
          </p>
        </div>

        <p className="text-sm text-navy-400">Everest Textile Mills</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900 leading-tight">TexFlow</p>
              <p className="text-xs text-neutral-500">Textile Manufacturing System</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl shadow-card p-6 sm:p-8 animate-in">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Demo authentication — no real backend is involved.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {formError && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-white border rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="login-email-error" className="mt-1.5 text-sm text-red-600" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className="w-full pl-10 pr-10 py-2 text-sm bg-white border rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600 rounded-md transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="login-password-error" className="mt-1.5 text-sm text-red-600" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button type="submit" loading={loading} className="w-full">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                Demo credentials
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => copyCredential(DEMO_EMAIL, 'Email')}
                  className="w-full flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-left hover:border-primary-300 hover:bg-primary-50/40 transition-colors group"
                >
                  <span className="min-w-0">
                    <span className="block text-xs text-neutral-500">Email</span>
                    <span className="block text-sm font-medium text-neutral-800 truncate">{DEMO_EMAIL}</span>
                  </span>
                  <Copy className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 flex-shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => copyCredential(DEMO_PASSWORD, 'Password')}
                  className="w-full flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-left hover:border-primary-300 hover:bg-primary-50/40 transition-colors group"
                >
                  <span className="min-w-0">
                    <span className="block text-xs text-neutral-500">Password</span>
                    <span className="block text-sm font-medium text-neutral-800 truncate">{DEMO_PASSWORD}</span>
                  </span>
                  <Copy className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 flex-shrink-0" />
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-500 flex items-start gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                Click a field to copy. Sessions are stored locally and are for demonstration only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}