import { useEffect, useState } from 'react';
import Sidebar from '../shared/Sidebar';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Sparkles, FileText, Loader2, AlertCircle, Calendar, ShieldAlert, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIChecklist() {
  const { company } = useAuthStore();
  const [licenses, setLicenses] = useState([]);
  const [selectedLicenseId, setSelectedLicenseId] = useState('');
  const [checklist, setChecklist] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company) return;
    // Fetch user's active tracked licenses to populate selection dropdown
    api.get(`/licenses/${company.companyId}`)
      .then(r => {
        setLicenses(r.data);
      })
      .catch(() => toast.error('Failed to load tracked licenses'));
  }, [company]);

  const handleGenerateChecklist = async (e) => {
    e.preventDefault();
    if (!selectedLicenseId) return toast.error('Please select a license to continue');
    
    setLoading(true);
    setChecklist('');
    try {
      const { data } = await api.post('/ai/checklist', {
        companyId: company.companyId,
        licenseTypeId: selectedLicenseId
      });
      setChecklist(data.checklist);
      toast.success('Renewal checklist compiled successfully!');
    } catch (err) {
      toast.error('Failed to generate AI checklist. Please verify Claude API credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format the markdown output from Claude beautifully into customized HTML blocks
  const renderFormattedChecklist = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-indigo-400 mt-6 mb-3 uppercase tracking-wider">
            {line.replace('###', '').trim()}
          </h4>
        );
      }
      if (line.startsWith('##')) {
        return (
          <h3 key={idx} className="text-base font-bold text-white mt-8 mb-4 border-b border-white/5 pb-2">
            {line.replace('##', '').trim()}
          </h3>
        );
      }
      if (line.startsWith('#')) {
        return (
          <h2 key={idx} className="text-lg font-extrabold text-white mt-4 mb-4">
            {line.replace('#', '').trim()}
          </h2>
        );
      }

      // Checkbox checklist items (lines starting with - [ ] or - [x])
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        const itemText = line.replace('- [ ]', '').replace('- [x]', '').trim();
        return (
          <div key={idx} className="flex items-start gap-3 my-2.5 bg-white/3 p-3 rounded-xl border border-white/3">
            <CheckSquare size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-300 leading-normal">{itemText}</span>
          </div>
        );
      }

      // Bullet points
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const bulletText = line.replace(/^[-\*]\s*/, '').trim();
        return (
          <div key={idx} className="flex items-start gap-2.5 my-2 pl-4">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0 mt-1.5" />
            <span className="text-xs text-slate-400 leading-relaxed">{bulletText}</span>
          </div>
        );
      }

      // Numbered items
      if (/^\d+\./.test(line.trim())) {
        const numText = line.replace(/^\d+\.\s*/, '').trim();
        const num = line.match(/^\d+/)[0];
        return (
          <div key={idx} className="flex items-start gap-3.5 my-3 bg-slate-900/40 p-4 rounded-xl border border-white/5">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400
                            flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              {num}
            </div>
            <span className="text-xs text-slate-300 leading-relaxed">{numText}</span>
          </div>
        );
      }

      // Empty Lines
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Default Paragraph text
      return (
        <p key={idx} className="text-xs text-slate-400 leading-relaxed my-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-60 p-8 min-w-0 fade-in flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              AI Renewal Guide
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Consult Claude to compile step-by-step renewal pipelines for Indian regulatory clearances
            </p>
          </div>
        </header>

        {/* Dynamic Form Selection */}
        <div className="glass-card p-6 bg-slate-900/30 border-white/5 mb-8">
          <form onSubmit={handleGenerateChecklist} className="flex flex-col sm:flex-row items-end gap-5">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Select Active Tracked License
              </label>
              <select
                value={selectedLicenseId}
                onChange={(e) => setSelectedLicenseId(e.target.value)}
                className="input-field appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-slate-950 text-slate-500">Choose tracked license...</option>
                {licenses.map(l => (
                  <option key={l.licenseType?.licenseTypeId} value={l.licenseType?.licenseTypeId} className="bg-slate-900 text-white">
                    {l.licenseType?.name} ({l.licenseNumber})
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading || !selectedLicenseId}
              className="btn-primary w-full sm:w-auto h-12 flex items-center justify-center gap-2 font-semibold text-xs shrink-0 px-8"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Compile Renewal Guide
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="flex-1 glass-card bg-slate-950/40 border-white/5 p-8 overflow-y-auto min-h-[400px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-16">
              <Loader2 size={36} className="text-indigo-400 animate-spin mb-4" />
              <h3 className="text-sm font-bold text-white">Compiling Indian Regulations Database...</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
                Claude is analyzing state-level Factories Acts, pollution control laws, fees schedules, and pre-requisite compliance dependencies.
              </p>
            </div>
          ) : checklist ? (
            <div className="max-w-3xl mx-auto fade-in">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5 text-indigo-400">
                <Sparkles size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Claude AI Strategic Advisory</span>
              </div>
              <div className="space-y-1 font-sans">
                {renderFormattedChecklist(checklist)}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={40} className="text-slate-700 mb-4" />
              <h3 className="text-sm font-bold text-slate-400">Renewal Checklist Not Yet Generated</h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md leading-relaxed">
                Select one of your registered industrial clearances (e.g. Factories License, Fire Safety NOC) from the panel above and click "Compile" to generate step-by-step renewal guidance.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
