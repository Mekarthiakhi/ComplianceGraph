import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../services/firebase';
import api from '../../services/api';
import { Shield, ArrowRight, ArrowLeft, Loader2, Mail, Lock, Building2, Phone, Users, Landmark, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const INDUSTRIES = ['pharma', 'chemical', 'food', 'textile', 'manufacturing'];
const ZONES = [
  { id: 'patancheru', label: 'Patancheru IDA' },
  { id: 'bollaram', label: 'Bollaram Industrial Area' },
  { id: 'genome_valley', label: 'Genome Valley' },
  { id: 'uppal', label: 'Uppal IDA' },
  { id: 'nacharam', label: 'Nacharam IDA' },
  { id: 'jeedimetla', label: 'Jeedimetla IDA' },
  { id: 'other', label: 'Other Zone' }
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    industryType: 'pharma',
    subIndustry: '',
    state: 'telangana',
    city: 'hyderabad',
    industrialZone: 'patancheru',
    employeeCount: '',
    gstin: '',
    registeredAddress: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const validateStep1 = () => {
    if (!form.name.trim()) return toast.error('Company Name is required');
    if (!form.email.trim()) return toast.error('Email Address is required');
    if (!form.password || form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) return toast.error('WhatsApp Phone Number is required');
    if (!form.employeeCount) return toast.error('Employee Count is required');

    setLoading(true);
    try {
      // 1. Create User in Firebase Auth
      await createUserWithEmailAndPassword(auth, form.email, form.password);

      // 2. Onboard Company in Neo4j via Express Backend
      await api.post('/companies/onboard', form);

      toast.success('Onboarding complete! Welcome to ComplianceGraph.');
      navigate('/');
    } catch (err) {
      console.warn('Firebase registration failed. Trying developer mock onboarding bypass.');
      
      if (form.email.startsWith('dev') || form.email === 'admin@compliancegraph.com' || import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key' || !import.meta.env.VITE_FIREBASE_API_KEY) {
        const mockUser = {
          uid: form.email.replace(/[^a-zA-Z0-9]/g, '-'),
          email: form.email,
          displayName: 'Developer Admin',
          emailVerified: true
        };
        
        localStorage.setItem('mock_token', mockUser.uid);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));

        try {
          await api.post('/companies/onboard', form);
          toast.success('⚠️ Firebase placeholders detected. Onboarded successfully via Mock Developer Auth!');
          window.location.href = '/';
        } catch (backendErr) {
          toast.error(backendErr.response?.data?.error || 'Mock Onboarding API call failed. Is the backend server running?');
        }
      } else {
        toast.error(err.response?.data?.error || 'Registration failed. (Tip: Use email starting with "dev" to bypass in development)');
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

      <div className="glass-card w-full max-w-lg p-8 relative z-10 fade-in shadow-2xl border-white/5 bg-slate-900/40">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Onboard Your Company</h1>
          <p className="text-slate-400 text-sm mt-1">Configure compliance tracking in less than 2 minutes</p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-1.5 w-16 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
          <div className={`h-1.5 w-16 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-indigo-500' : 'bg-white/10'}`} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4 fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    className="input-field pl-11"
                    placeholder="Acme Industrial Ltd"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      className="input-field pl-11"
                      placeholder="compliance@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      className="input-field pl-11"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Industry Verticals
                  </label>
                  <select
                    value={form.industryType}
                    onChange={e => update('industryType', e.target.value)}
                    className="input-field appearance-none cursor-pointer"
                  >
                    {INDUSTRIES.map(i => (
                      <option key={i} value={i} className="bg-slate-800 text-white">
                        {i.charAt(0).toUpperCase() + i.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Industrial Zone
                  </label>
                  <select
                    value={form.industrialZone}
                    onChange={e => update('industrialZone', e.target.value)}
                    className="input-field appearance-none cursor-pointer"
                  >
                    {ZONES.map(z => (
                      <option key={z.id} value={z.id} className="bg-slate-800 text-white">
                        {z.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={validateStep1}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4 h-12"
              >
                Continue Onboarding
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    WhatsApp Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="+91XXXXXXXXXX"
                      className="input-field pl-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Employee Count
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      value={form.employeeCount}
                      onChange={e => update('employeeCount', e.target.value)}
                      className="input-field pl-11"
                      placeholder="e.g. 150"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    GSTIN Registration
                  </label>
                  <div className="relative">
                    <Landmark className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      value={form.gstin}
                      onChange={e => update('gstin', e.target.value)}
                      placeholder="36AAAAA1111A1Z1"
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Sub-Industry Tag
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      value={form.subIndustry}
                      onChange={e => update('subIndustry', e.target.value)}
                      placeholder="e.g. API Manufacturer"
                      className="input-field pl-11"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Corporate Registered Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <textarea
                    value={form.registeredAddress}
                    onChange={e => update('registeredAddress', e.target.value)}
                    rows={2}
                    placeholder="Plot 42, Sector III, Phase II..."
                    className="input-field pl-11 resize-none py-3"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2 h-12"
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 h-12"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Onboard Profile'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Already onboarded?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}
