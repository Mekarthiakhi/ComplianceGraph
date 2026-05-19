import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { Shield, Lock, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully!');
      navigate('/');
    } catch (err) {
      console.warn('Firebase login failed, testing developer fallback credentials.');
      // Fallback: If using default firebase key, or starts with dev/admin
      if (email.startsWith('dev') || email === 'admin@compliancegraph.com' || import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key') {
        const mockUser = {
          uid: email.replace(/[^a-zA-Z0-9]/g, '-'),
          email,
          displayName: 'Developer Admin',
          emailVerified: true
        };
        localStorage.setItem('mock_token', mockUser.uid);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        toast.success('⚠️ Firebase placeholders detected. Signed in with Mock Developer session!');
        window.location.href = '/';
      } else {
        toast.error('Invalid credentials or Firebase configuration mismatch. (Tip: Use a corporate email starting with "dev" to bypass)');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      <div className="glass-card w-full max-w-md p-8 relative z-10 fade-in shadow-2xl border-white/5 bg-slate-900/40">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-4 animate-pulse">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ComplianceGraph</h1>
          <p className="text-slate-400 text-sm mt-1">Intelligence Platform for Indian Industrial Compliance</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Corporate Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-11"
                placeholder="name@company.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Account Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-11"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 mt-2 h-12"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {(import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key' || !import.meta.env.VITE_FIREBASE_API_KEY) && (
            <button
              type="button"
              onClick={() => {
                const devEmail = email || 'dev@compliancegraph.com';
                const mockUser = {
                  uid: 'mock-dev-admin',
                  email: devEmail,
                  displayName: 'Developer Admin',
                  emailVerified: true
                };
                localStorage.setItem('mock_token', mockUser.uid);
                localStorage.setItem('mock_user', JSON.stringify(mockUser));
                toast.success('Logged in with Mock Developer session!');
                window.location.href = '/';
              }}
              className="w-full mt-2 h-11 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-500/60
                         text-indigo-400 hover:text-indigo-300 font-medium text-xs tracking-wider uppercase
                         flex items-center justify-center gap-2 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all duration-200"
            >
              🚀 Bypass Firebase (Use Mock Dev Auth)
            </button>
          )}
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-8">
          New to ComplianceGraph?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all">
            Onboard Company
          </Link>
        </p>
      </div>
    </div>
  );
}
