import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import {
  FileText, Plus, HelpCircle, AlertTriangle, ShieldCheck,
  Calendar, ExternalLink, RefreshCw, AlertOctagon, CheckCircle, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LicenseList() {
  const { company } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tracked');
  const [licenses, setLicenses] = useState([]);
  const [applicable, setApplicable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLicense, setEditingLicense] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchLicenses = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [licRes, appRes] = await Promise.all([
        api.get(`/licenses/${company.companyId}`),
        api.get(`/licenses/${company.companyId}/applicable`)
      ]);
      setLicenses(licRes.data);
      setApplicable(appRes.data);
    } catch (err) {
      toast.error('Failed to load licenses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [company]);

  const handleUpdateStatus = async (licenseId) => {
    try {
      await api.patch(`/licenses/${licenseId}/status`, {
        status: editStatus,
        notes: editNotes
      });
      toast.success('License updated successfully');
      setEditingLicense(null);
      fetchLicenses();
    } catch (err) {
      toast.error('Failed to update license status');
    }
  };

  const getDaysBadgeClass = (days, status) => {
    if (status === 'expired' || days < 0) return 'badge-critical';
    if (days < 30) return 'badge-high';
    if (days < 90) return 'badge-medium';
    return 'badge-active';
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      default: return 'badge-medium';
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-60 p-8 min-w-0 fade-in">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Corporate Licenses
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Monitor, track, and update compliance permissions
            </p>
          </div>
          <Link
            to="/licenses/add"
            className="btn-primary py-2 px-4 text-xs h-10 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            Track New License
          </Link>
        </header>

        {/* Tab Controls */}
        <div className="flex border-b border-white/5 gap-6 mb-6">
          <button
            onClick={() => setActiveTab('tracked')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all
                        ${activeTab === 'tracked'
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
          >
            Tracked Licenses ({licenses.length})
          </button>
          <button
            onClick={() => setActiveTab('applicable')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all
                        ${activeTab === 'applicable'
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
          >
            Onboarding Checklist & Scope ({applicable.filter(a => !a.held).length})
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <RefreshCw size={24} className="text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="fade-in">
            {/* Tab: Tracked Licenses */}
            {activeTab === 'tracked' && (
              licenses.length === 0 ? (
                <div className="glass-card p-12 text-center flex flex-col items-center">
                  <FileText size={48} className="text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300">No Licenses Tracked Yet</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm">
                    Configure your active licenses to monitor renewal dates, analyze dependency blocker trees, and receive automated WhatsApp alerts.
                  </p>
                  <Link to="/licenses/add" className="btn-primary mt-6 text-xs px-4 py-2.5 h-10">
                    Add Your First License
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {licenses.map(l => (
                    <div key={l.licenseId} className="glass-card p-6 flex flex-col justify-between bg-slate-900/30 border-white/5 relative overflow-hidden">
                      {/* Top Meta info */}
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                              {l.licenseType?.governingAct}
                            </span>
                            <h3 className="text-base font-bold text-white mt-1">
                              {l.licenseType?.name}
                            </h3>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full border shrink-0
                                           ${getDaysBadgeClass(l.daysToExpiry, l.status)}`}>
                            {l.status === 'expired' || l.daysToExpiry < 0
                              ? 'EXPIRED'
                              : l.daysToExpiry === 0 ? 'Expires today' : `${l.daysToExpiry} days left`}
                          </span>
                        </div>

                        {/* License stats */}
                        <div className="grid grid-cols-2 gap-4 mt-6 p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-500" />
                            <div>
                              <p className="text-[10px] text-slate-500 leading-none">License Number</p>
                              <p className="text-xs font-semibold text-slate-300 mt-1 truncate">{l.licenseNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-500" />
                            <div>
                              <p className="text-[10px] text-slate-500 leading-none">Renewal Lead Days</p>
                              <p className="text-xs font-semibold text-slate-300 mt-1">{l.licenseType?.renewalLeadDays} Days</p>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-4 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Regulator:</span>
                            <span className="text-slate-300 font-medium">{l.regulator?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Expires On:</span>
                            <span className="text-slate-300 font-medium">{l.expiryDate}</span>
                          </div>
                          {l.notes && (
                            <div className="bg-slate-900/50 p-2.5 rounded-lg text-slate-400 mt-3 border border-white/5 italic">
                              "{l.notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Operations */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                        {l.licenseType?.applicationPortalUrl ? (
                          <a
                            href={l.licenseType.applicationPortalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                          >
                            Visit Portal <ExternalLink size={12} />
                          </a>
                        ) : (
                          <div />
                        )}

                        <button
                          onClick={() => {
                            setEditingLicense(l);
                            setEditStatus(l.status);
                            setEditNotes(l.notes || '');
                          }}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                        >
                          <Edit3 size={12} />
                          Quick Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Tab: Scope & Recommendations */}
            {activeTab === 'applicable' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3 text-xs leading-relaxed text-indigo-300 mb-2">
                  <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                  <p>
                    Based on your registered state (<strong>{company?.state}</strong>) and industry category (<strong>{company?.industryType}</strong>), the following mandatory regulatory clearances are required. Track them to calculate weighted compliance risk indexes.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {applicable.map(({ licenseType, held, license }) => (
                    <div
                      key={licenseType.licenseTypeId}
                      className={`glass-card p-5 border flex flex-col md:flex-row justify-between items-start md:items-center gap-5
                                  ${held ? 'border-emerald-500/10 bg-emerald-500/3' : 'border-white/5 bg-slate-900/20'}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold text-white">{licenseType.name}</h3>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border
                                           ${getSeverityBadgeClass(licenseType.penaltySeverity)}`}>
                            {licenseType.penaltySeverity} Priority
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                          Governed under the <strong>{licenseType.governingAct}</strong>. 
                          {licenseType.penaltyDescription && ` Penalty if breached: ${licenseType.penaltyDescription}`}
                        </p>
                      </div>

                      <div className="shrink-0 w-full md:w-auto">
                        {held ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-4 py-2 border border-emerald-500/20 bg-emerald-500/10 rounded-xl w-full justify-center">
                            <CheckCircle size={14} />
                            Tracked ({license?.licenseNumber})
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate('/licenses/add', { state: { prefilledTypeId: licenseType.licenseTypeId } })}
                            className="btn-secondary py-2 px-4 text-xs h-10 w-full md:w-auto flex items-center justify-center gap-1.5 hover:text-white"
                          >
                            <Plus size={14} />
                            Start Tracking
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Edit Popup Modal */}
        {editingLicense && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
            <div className="glass-card max-w-md w-full p-6 bg-slate-950 border border-white/10 shadow-2xl relative">
              <h3 className="text-lg font-bold text-white mb-4">Edit Compliance Status</h3>
              <p className="text-xs text-slate-400 mb-5 leading-normal">
                Updating: <span className="font-semibold text-white">{editingLicense.licenseType?.name}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Current Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="input-field appearance-none cursor-pointer text-slate-300"
                  >
                    <option value="active" className="bg-slate-950">Active</option>
                    <option value="pending_renewal" className="bg-slate-950">Pending Renewal</option>
                    <option value="expired" className="bg-slate-950">Expired</option>
                    <option value="suspended" className="bg-slate-950">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Update Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="input-field py-3 resize-none"
                    placeholder="Enter process status notes or comments..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingLicense(null)}
                  className="flex-1 btn-secondary text-xs h-10 py-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(editingLicense.licenseId)}
                  className="flex-1 btn-primary text-xs h-10 py-0"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
