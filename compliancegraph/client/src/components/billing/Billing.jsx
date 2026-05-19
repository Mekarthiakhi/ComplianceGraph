import { useState } from 'react';
import Sidebar from '../shared/Sidebar';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { CreditCard, Check, Loader2, Landmark, HelpCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Tier',
    price: '₹5,000',
    duration: 'month',
    desc: 'Perfect for small factories and industrial warehouses.',
    features: [
      'Track up to 10 active licenses',
      'Automated WhatsApp notifications',
      'Standard AI compliance checklists',
      'Next-day email support queue'
    ]
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    price: '₹12,000',
    duration: 'quarter',
    popular: true,
    desc: 'Tailored for chemical plants and growing pharmaceutical manufacturers.',
    features: [
      'Track up to 30 active licenses',
      'Immediate alert priority routing',
      'Deep AI dependency analysis',
      'Blocker identification graphs',
      'Same-day priority phone support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Suite',
    price: '₹40,000',
    duration: 'year',
    desc: 'Engineered for multi-state corporate entities and large pharma conglomerates.',
    features: [
      'Unlimited licensing tracking',
      'Custom state regulatory mappings',
      'Multi-tenant administration access',
      'Dedicated compliance manager',
      'Direct API webhook integrations'
    ]
  }
];

export default function Billing() {
  const { user, company, setCompany } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handlePayment = async (planId) => {
    setLoadingPlan(planId);
    try {
      // 1. Create Order via Node/Express Backend
      const { data } = await api.post('/payments/order', {
        companyId: company.companyId,
        plan: planId
      });

      // 2. Set Up Razorpay Checkout Panel Parameters
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'ComplianceGraph',
        description: data.planName,
        order_id: data.orderId,
        handler: async (response) => {
          setLoadingPlan(planId);
          try {
            // 3. Verify Razorpay Signatures with API backend
            const verifyRes = await api.post('/payments/verify', {
              ...response,
              companyId: company.companyId,
              plan: planId
            });
            
            toast.success('Transaction approved! Subscription is active.');
            
            // 4. Reload Company details dynamically to synchronize status badge in Sidebar
            const companyRes = await api.get('/companies/me');
            setCompany(companyRes.data);
          } catch (err) {
            toast.error('Payment signature verification failed.');
          } finally {
            setLoadingPlan(null);
          }
        },
        prefill: {
          email: user?.email,
          contact: company?.phone || ''
        },
        theme: {
          color: '#4F46E5'
        }
      };

      // 5. Trigger Razorpay Script Frame Open
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Failed to initialize Razorpay checkout process.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Billing Content */}
      <main className="flex-1 ml-60 p-8 min-w-0 fade-in">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Subscription & Billing
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Choose an intelligence tier that matches your corporate regulatory scope
            </p>
          </div>
        </header>

        {/* Current Subscription Status Badge */}
        {company && (
          <div className="glass-card p-5 bg-slate-900/20 border-white/5 mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Current Subscription Level</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Plan Category: <strong className="text-slate-300 capitalize">{company.subscriptionPlan || 'Trial'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none block">
                  Status
                </span>
                <span className={`text-xs font-semibold capitalize mt-1 inline-block ${company.subscriptionStatus === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {company.subscriptionStatus} Account
                </span>
              </div>
              {company.subscriptionExpiresAt && (
                <div className="h-8 w-px bg-white/10 hidden sm:block mx-2" />
              )}
              {company.subscriptionExpiresAt && (
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none block">
                    Valid Until
                  </span>
                  <span className="text-xs text-slate-300 font-semibold mt-1 inline-block">
                    {new Date(company.subscriptionExpiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`glass-card p-8 flex flex-col justify-between relative overflow-hidden bg-slate-900/30
                          ${plan.popular
                            ? 'border-indigo-500/40 ring-1 ring-indigo-500/20'
                            : 'border-white/5'
                          }`}
            >
              {/* Popular glow badge */}
              {plan.popular && (
                <span className="absolute top-4 right-4 bg-indigo-500/10 border border-indigo-500/20
                                 text-indigo-400 font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{plan.desc}</p>
                
                {/* Cost Panel */}
                <div className="my-6 pb-6 border-b border-white/5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-500 text-xs font-semibold">/ {plan.duration}</span>
                  </div>
                </div>

                {/* Features Checklist */}
                <ul className="space-y-3.5 my-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handlePayment(plan.id)}
                disabled={loadingPlan !== null}
                className={`w-full mt-4 flex items-center justify-center gap-2 h-11 text-xs font-bold rounded-xl transition-all duration-200
                            ${plan.popular
                              ? 'btn-primary'
                              : 'btn-secondary bg-white/5 border-white/8 hover:bg-white/10 hover:border-white/15'
                            }`}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting Gateway...
                  </>
                ) : (
                  <>
                    <CreditCard size={14} />
                    Subscribe Now
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Support disclaimer */}
        <div className="mt-12 glass-card p-6 bg-slate-900/10 border-white/5 flex gap-4 text-xs text-slate-500 max-w-2xl">
          <Landmark size={18} className="shrink-0 mt-0.5 text-slate-600" />
          <p className="leading-relaxed">
            Corporate payments in ComplianceGraph are securely verified via Razorpay and backed by Indian national bank standards. Invoices are automatically emailed to your corporate registered profile within 24 hours. For billing adjustments or custom plan scopes, contact <span className="text-slate-400">billing@compliancegraph.in</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
