import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import useAuthStore from '../../store/authStore';
import {
  LayoutDashboard, FileText, Network, Sparkles,
  CreditCard, LogOut, Shield
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/licenses',     icon: FileText,        label: 'Licenses'     },
  { to: '/graph',        icon: Network,         label: 'Graph View'   },
  { to: '/ai-checklist', icon: Sparkles,        label: 'AI Checklist' },
  { to: '/billing',      icon: CreditCard,      label: 'Billing'      },
];

export default function Sidebar() {
  const { company } = useAuthStore();
  const location = useLocation();

  const handleLogout = async () => {
    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_user');
    try {
      await signOut(auth);
    } catch (err) {}
    window.location.href = '/login';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40
                      bg-[#0d0f18] border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-tight">ComplianceGraph</span>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Company info */}
      {company ? (
        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-white/5 border border-white/8">
          <p className="text-xs font-medium text-white truncate">{company.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-[11px] text-slate-400 capitalize">{company.subscriptionStatus}</span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-semibold text-red-400 mb-2">Onboarding Incomplete</p>
          <Link to="/register" className="block text-center text-[11px] font-medium bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg transition-colors">
            Complete Now
          </Link>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to ||
                         (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-150 border
                          ${active
                            ? 'nav-item-active text-indigo-300 border-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
                          }`}
            >
              <Icon size={16} className={active ? 'text-indigo-400' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm
                     text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
