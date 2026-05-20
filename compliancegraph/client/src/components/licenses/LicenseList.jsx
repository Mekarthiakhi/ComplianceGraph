import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import {
  FileText, Plus, HelpCircle, AlertTriangle, ShieldCheck,
  Calendar, ExternalLink, RefreshCw, AlertOctagon, CheckCircle, Edit3,
  Search, Download, ChevronLeft, ChevronRight, Menu, X, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function LicenseCardSkeleton() {
  return (
    <div className="glass-card p-6 bg-slate-900/30 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="h-2 bg-slate-700/50 rounded w-24 mb-2" />
          <div className="h-4 bg-slate-700/50 rounded w-40" />
        </div>
        <div className="h-6 bg-slate-700/50 rounded-full w-20" />
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-slate-700/50 rounded w-32" />
        <div className="h-3 bg-slate-700/50 rounded w-48" />
        <div className="h-3 bg-slate-700/50 rounded w-40" />
      </div>
    </div>
  );
}

function ApplicableLicenseSkeleton() {
  return (
    <div className="glass-card p-5 bg-slate-900/20 animate-pulse border border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-700/50 rounded w-40" />
          <div className="h-3 bg-slate-700/50 rounded w-full max-w-md" />
        </div>
        <div className="h-10 bg-slate-700/50 rounded w-24" />
      </div>
    </div>
  );
}

function SearchBarSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-pulse">
      <div className="flex-1 h-10 bg-slate-700/50 rounded-xl" />
      <div className="w-48 h-10 bg-slate-700/50 rounded-xl" />
    </div>
  );
}

// ============================================================================
// ERROR COMPONENT
// ============================================================================

function ErrorAlert({ title, message, onRetry }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
      <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-400">{title}</p>
        <p className="text-xs text-red-300/80 mt-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-red-300 hover:text-red-200 font-medium"
          >
            ↻ Retry
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LicenseList() {
  const { company } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tracked');
  const [licenses, setLicenses] = useState([]);
  const [applicable, setApplicable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLicense, setEditingLicense] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // Pagination & Search/Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLicenses = async () => {
    if (!company) return;
    setLoading(true);
    setError(null);
    try {
      const [licRes, appRes] = await Promise.all([
        api.get(`/licenses/${company.companyId}`),
        api.get(`/licenses/${company.companyId}/applicable`)
      ]);
      setLicenses(licRes.data);
      setApplicable(appRes.data);
    } catch (err) {
      setError('Failed to load licenses data');
      toast.error('Failed to load licenses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [company]);

  const handleUpdateStatus = async (licenseId) => {
    setEditLoading(true);
    try {
      await api.patch(`/licenses/${licenseId}/status`, {
        status: editStatus,
        notes: editNotes
      });
      toast.success('✅ License updated successfully');
      setEditingLicense(null);
      fetchLicenses();
    } catch (err) {
      toast.error('Failed to update license status');
    } finally {
      setEditLoading(false);
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

  // Search & Filter Logic
  const filteredLicenses = licenses.filter(l => {
    const matchesSearch = 
      l.licenseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.licenseType?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.licenseType?.governingAct?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || l.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLicenses = filteredLicenses.slice(startIdx, startIdx + itemsPerPage);

  // Export to CSV
  const handleExportCSV = () => {
    try {
      let csv = 'License Number,License Type,Governing Act,Status,Days to Expiry,Expiry Date,Regulator\n';
      licenses.forEach(l => {
        csv += `"${l.licenseNumber}","${l.licenseType?.name}","${l.licenseType?.governingAct}","${l.status}",${l.daysToExpiry},"${l.expiryDate}","${l.regulator?.name}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licenses-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('✅ Licenses exported as CSV');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    try {
      let pdf = 'License Report\n';
      pdf += `Generated: ${new Date().toLocaleString()}\n`;
      pdf += `Company: ${company?.name}\n\n`;
      pdf += '='.repeat(80) + '\n';
      
      licenses.forEach(l => {
        pdf += `\nLicense: ${l.licenseType?.name}\n`;
        pdf += `Number: ${l.licenseNumber}\n`;
        pdf += `Status: ${l.status}\n`;
        pdf += `Days to Expiry: ${l.daysToExpiry}\n`;
        pdf += `Expiry Date: ${l.expiryDate}\n`;
        pdf += `Regulator: ${l.regulator?.name}\n`;
        pdf += '-'.repeat(80) + '\n';
      });
      
      const blob = new Blob([pdf], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licenses-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      toast.success('✅ Licenses exported as TXT');
    } catch (err) {
      toast.error('Failed to export');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-6 left-6 z-50 p-2 hover:bg-white/10 rounded-xl transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <div
        className={`fixed md:relative left-0 top-0 h-screen w-60 z-40 transition-transform duration-300 md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 min-w-0 fade-in overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              Corporate Licenses
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mt-1" />
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Monitor, track, and update compliance permissions
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="btn-secondary py-2 px-3 md:px-4 text-xs h-10 flex items-center gap-2"
              title="Export as CSV"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="btn-secondary py-2 px-3 md:px-4 text-xs h-10 flex items-center gap-2"
              title="Export as TXT"
            >
              <Download size={14} />
              TXT
            </button>
            <Link
              to="/licenses/add"
              className="btn-primary py-2 px-3 md:px-4 text-xs h-10 flex items-center gap-2"
            >
              <Plus size={16} />
              Track New
            </Link>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <ErrorAlert
            title="Load Failed"
            message={error}
            onRetry={fetchLicenses}
          />
        )}

        {/* Search & Filter Bar */}
        {!loading && activeTab === 'tracked' && licenses.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search license number, type..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field pl-11 text-xs"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field appearance-none cursor-pointer text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_renewal">Pending Renewal</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        )}

        {/* Skeleton for Search Bar during loading */}
        {loading && activeTab === 'tracked' && <SearchBarSkeleton />}

        {/* Tab Controls */}
        <div className="flex border-b border-white/5 gap-6 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tracked')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                        ${activeTab === 'tracked'
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
          >
            Tracked ({licenses.length})
          </button>
          <button
            onClick={() => setActiveTab('applicable')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                        ${activeTab === 'applicable'
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
          >
            Scope ({applicable.filter(a => !a.held).length})
          </button>
        </div>

        {/* Loading State with Skeletons */}
        {loading && (
          <div className="space-y-4">
            {activeTab === 'tracked' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[...Array(6)].map((_, i) => (
                  <LicenseCardSkeleton key={i} />
                ))}
              </div>
            )}
            {activeTab === 'applicable' && (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <ApplicableLicenseSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && (
          <div className="fade-in">
            {/* Tab: Tracked Licenses */}
            {activeTab === 'tracked' && (
              licenses.length === 0 ? (
                <div className="glass-card p-12 text-center flex flex-col items-center bg-gradient-to-br from-slate-900/40 to-slate-900/20">
                  <FileText size={48} className="text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300">No Licenses Tracked Yet</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm">
                    Configure your active licenses to monitor renewal dates, analyze dependency blocker trees, and receive automated WhatsApp alerts.
                  </p>
                  <Link to="/licenses/add" className="btn-primary mt-6 text-xs px-4 py-2.5 h-10">
                    Add Your First License
                  </Link>
                </div>
              ) : filteredLicenses.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <AlertOctagon size={40} className="mx-auto text-slate-600 mb-3" />
                  <h3 className="text-sm font-semibold text-slate-300">No licenses match your search</h3>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    {paginatedLicenses.map(l => (
                      <div 
                        key={l.licenseId} 
                        className="glass-card p-6 flex flex-col justify-between bg-gradient-to-br from-slate-900/40 to-slate-900/20 
                                   hover:from-slate-900/50 hover:to-slate-900/30 
                                   border-white/5 hover:border-indigo-500/20 
                                   transition-all duration-300 relative overflow-hidden"
                      >
                        {/* Animated glow effect */}
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* Top Meta info */}
                        <div className="relative z-10">
                          <div className="flex items-start justify-between gap-4 mb-4">
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
                                : l.daysToExpiry === 0 ? 'Today' : `${l.daysToExpiry}d`}
                            </span>
                          </div>

                          {/* License stats */}
                          <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-xl border border-white/5 mb-4">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-slate-500" />
                              <div>
                                <p className="text-[10px] text-slate-500 leading-none">License #</p>
                                <p className="text-xs font-semibold text-slate-300 mt-1 truncate">{l.licenseNumber}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-500" />
                              <div>
                                <p className="text-[10px] text-slate-500 leading-none">Renewal Lead</p>
                                <p className="text-xs font-semibold text-slate-300 mt-1">{l.licenseType?.renewalLeadDays}d</p>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="space-y-2 text-xs mb-4">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Regulator:</span>
                              <span className="text-slate-300 font-medium">{l.regulator?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Expires:</span>
                              <span className="text-slate-300 font-medium">{l.expiryDate}</span>
                            </div>
                            {l.notes && (
                              <div className="bg-slate-900/50 p-2.5 rounded-lg text-slate-400 mt-3 border border-white/5 italic text-xs leading-tight">
                                "{l.notes}"
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Operations */}
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-4 relative z-10">
                          {l.licenseType?.applicationPortalUrl ? (
                            <a
                              href={l.licenseType.applicationPortalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                            >
                              Portal <ExternalLink size={12} />
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
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-8 h-8 rounded text-xs font-semibold transition-all
                              ${currentPage === i + 1
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Tab: Scope & Recommendations */}
            {activeTab === 'applicable' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3 text-xs leading-relaxed text-indigo-300">
                  <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                  <p>
                    Based on your state (<strong>{company?.state}</strong>) and industry (<strong>{company?.industryType}</strong>), the following licenses are required. Track them to calculate compliance risk indexes.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {applicable.map(({ licenseType, held, license }) => (
                    <div
                      key={licenseType.licenseTypeId}
                      className={`glass-card p-5 border flex flex-col md:flex-row justify-between items-start md:items-center gap-5
                                  transition-all duration-300
                                  ${held 
                                    ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 hover:border-emerald-500/40' 
                                    : 'border-white/5 bg-gradient-to-br from-slate-900/30 to-slate-900/20 hover:border-indigo-500/20'
                                  }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-white">{licenseType.name}</h3>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border
                                           ${getSeverityBadgeClass(licenseType.penaltySeverity)}`}>
                            {licenseType.penaltySeverity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          <strong>{licenseType.governingAct}</strong>
                          {licenseType.penaltyDescription && ` • Penalty: ${licenseType.penaltyDescription}`}
                        </p>
                      </div>

                      <div className="shrink-0 w-full md:w-auto">
                        {held ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-4 py-2 border border-emerald-500/20 bg-emerald-500/10 rounded-xl w-full justify-center">
                            <CheckCircle size={14} />
                            Tracked
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate('/licenses/add', { state: { prefilledTypeId: licenseType.licenseTypeId } })}
                            className="btn-secondary py-2 px-4 text-xs h-10 w-full md:w-auto flex items-center justify-center gap-1.5 hover:text-white"
                          >
                            <Plus size={14} />
                            Track
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
            <div className="glass-card max-w-md w-full p-6 bg-slate-950 border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Modal glow effect */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="text-lg font-bold text-white mb-2 relative z-10">Edit Compliance Status</h3>
              <p className="text-xs text-slate-400 mb-5 leading-normal relative z-10">
                Updating: <span className="font-semibold text-white">{editingLicense.licenseType?.name}</span>
              </p>

              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Current Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="input-field appearance-none cursor-pointer text-slate-300"
                    disabled={editLoading}
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
                    placeholder="Enter status notes or comments..."
                    disabled={editLoading}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 relative z-10">
                <button
                  type="button"
                  onClick={() => setEditingLicense(null)}
                  className="flex-1 btn-secondary text-xs h-10 py-0 disabled:opacity-40"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(editingLicense.licenseId)}
                  className="flex-1 btn-primary text-xs h-10 py-0 flex items-center justify-center gap-2"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
