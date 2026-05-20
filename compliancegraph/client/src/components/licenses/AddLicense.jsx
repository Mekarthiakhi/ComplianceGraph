import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { FileText, Calendar, Edit3, ArrowLeft, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddLicense() {
  const { company } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [applicable, setApplicable] = useState([]);
  const [form, setForm] = useState({
    licenseTypeId: '',
    licenseNumber: '',
    issueDate: '',
    expiryDate: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company) return;

    // Fetch applicable license types
    api.get(`/licenses/${company.companyId}/applicable`)
      .then(r => {
        setApplicable(r.data);

        // Handle prefilled state passed via router state from LicenseList
        const prefilledId = location.state?.prefilledTypeId;
        if (prefilledId) {
          setForm(f => ({ ...f, licenseTypeId: prefilledId }));
        }
      })
      .catch(() => toast.error('Failed to load available license types'));
  }, [company, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.licenseTypeId) return toast.error('Please select a License Type');
    if (!form.licenseNumber.trim()) return toast.error('License Number is required');
    if (!form.issueDate) return toast.error('Issue Date is required');
    if (!form.expiryDate) return toast.error('Expiry Date is required');

    const issue = new Date(form.issueDate);
    const expiry = new Date(form.expiryDate);
    if (expiry <= issue) return toast.error('Expiry Date must be after the Issue Date');

    setLoading(true);
    try {
      await api.post('/licenses', {
        ...form,
        companyId: company.companyId
      });
      toast.success('License added successfully. Now tracking in timeline!');
      navigate('/licenses');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register license details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Form Content */}
      <main className="flex-1 ml-60 p-8 min-w-0 fade-in flex items-center justify-center">
        <div className="glass-card w-full max-w-lg p-8 bg-slate-900/30 border-white/5 shadow-2xl relative">

          {/* Header & Back Button */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <button
              onClick={() => navigate('/licenses')}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10
                         flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Track Regulatory License</h2>
              <p className="text-xs text-slate-500 mt-1">Configure compliance alert thresholds and timeline trackers</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* License Type Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                License Classification / Governing Act
              </label>
              <select
                value={form.licenseTypeId}
                onChange={e => setForm(f => ({ ...f, licenseTypeId: e.target.value }))}
                className="input-field appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-slate-950 text-slate-500">Choose license type...</option>

                {/* Applicable Licenses from Database */}
                {applicable.length > 0 && (
                  <optgroup label="RECOMMENDED FOR YOUR PROFILE" className="bg-slate-950 text-indigo-400 font-semibold tracking-wider text-xs">
                    {applicable.map(({ licenseType, held }) => (
                      <option
                        key={licenseType.licenseTypeId}
                        value={licenseType.licenseTypeId}
                        className="bg-slate-900 text-white font-normal text-sm"
                      >
                        {licenseType.name} {held ? '✓ (Tracking)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* Healthcare / Clinical */}
                <optgroup label="HEALTHCARE & CLINICAL" className="bg-slate-950 text-teal-400 font-semibold tracking-wider text-xs">
                  <option value="Clinical Establishment License" className="bg-slate-900 text-white font-normal text-sm">Clinical Establishment License</option>
                  <option value="Hospital Registration" className="bg-slate-900 text-white font-normal text-sm">Hospital Registration</option>
                  <option value="NABH Accreditation" className="bg-slate-900 text-white font-normal text-sm">NABH Accreditation</option>
                  <option value="NABL Accreditation" className="bg-slate-900 text-white font-normal text-sm">NABL Accreditation</option>
                  <option value="Blood Bank License" className="bg-slate-900 text-white font-normal text-sm">Blood Bank License</option>
                  <option value="Pharmacy License" className="bg-slate-900 text-white font-normal text-sm">Pharmacy License</option>
                  <option value="Drug License" className="bg-slate-900 text-white font-normal text-sm">Drug License</option>
                  <option value="PNDT Registration" className="bg-slate-900 text-white font-normal text-sm">PNDT Registration</option>
                  <option value="Radiation Safety License" className="bg-slate-900 text-white font-normal text-sm">Radiation Safety License</option>
                  <option value="Biomedical Waste Authorization" className="bg-slate-900 text-white font-normal text-sm">Biomedical Waste Authorization</option>
                </optgroup>

                {/* Safety / Infrastructure */}
                <optgroup label="SAFETY & INFRASTRUCTURE" className="bg-slate-950 text-amber-400 font-semibold tracking-wider text-xs">
                  <option value="Fire NOC" className="bg-slate-900 text-white font-normal text-sm">Fire NOC</option>
                  <option value="Electrical Safety Certificate" className="bg-slate-900 text-white font-normal text-sm">Electrical Safety Certificate</option>
                  <option value="Lift License" className="bg-slate-900 text-white font-normal text-sm">Lift License</option>
                  <option value="Boiler License" className="bg-slate-900 text-white font-normal text-sm">Boiler License</option>
                  <option value="Oxygen Storage License" className="bg-slate-900 text-white font-normal text-sm">Oxygen Storage License</option>
                </optgroup>

                {/* Food / Environmental */}
                <optgroup label="FOOD & ENVIRONMENTAL" className="bg-slate-950 text-emerald-400 font-semibold tracking-wider text-xs">
                  <option value="FSSAI License" className="bg-slate-900 text-white font-normal text-sm">FSSAI License</option>
                  <option value="Pollution Control Consent" className="bg-slate-900 text-white font-normal text-sm">Pollution Control Consent</option>
                </optgroup>

                {/* Business / Tax */}
                <optgroup label="BUSINESS & TAXATION" className="bg-slate-950 text-indigo-400 font-semibold tracking-wider text-xs">
                  <option value="Trade License" className="bg-slate-900 text-white font-normal text-sm">Trade License</option>
                  <option value="Shop & Establishment License" className="bg-slate-900 text-white font-normal text-sm">Shop & Establishment License</option>
                  <option value="GST Registration" className="bg-slate-900 text-white font-normal text-sm">GST Registration</option>
                  <option value="Factory License" className="bg-slate-900 text-white font-normal text-sm">Factory License</option>
                </optgroup>

                {/* Employee / Labour */}
                <optgroup label="EMPLOYEE & LABOUR" className="bg-slate-950 text-rose-400 font-semibold tracking-wider text-xs">
                  <option value="Labour License" className="bg-slate-900 text-white font-normal text-sm">Labour License</option>
                  <option value="PF Registration" className="bg-slate-900 text-white font-normal text-sm">PF Registration</option>
                  <option value="ESI Registration" className="bg-slate-900 text-white font-normal text-sm">ESI Registration</option>
                </optgroup>

                {/* Others */}
                <optgroup label="OTHER CERTIFICATIONS" className="bg-slate-950 text-slate-400 font-semibold tracking-wider text-xs">
                  <option value="ISO Certification" className="bg-slate-900 text-white font-normal text-sm">ISO Certification</option>
                  <option value="Vendor Compliance License" className="bg-slate-900 text-white font-normal text-sm">Vendor Compliance License</option>
                  <option value="Other" className="bg-slate-900 text-white font-normal text-sm">Other</option>
                </optgroup>
              </select>
            </div>

            {/* License Number Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                License / Registration Number
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                  placeholder="e.g. TSPCB/HYD/CTO/2024/7610"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Issue Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                    className="input-field pl-11 select-none pr-4 text-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Expiry Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                    className="input-field pl-11 select-none pr-4 text-slate-300"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes / Internal Comments */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Internal Process Notes (Optional)
              </label>
              <div className="relative">
                <Edit3 className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Reference external document IDs, process status, internal POCs..."
                  className="input-field pl-11 resize-none py-3"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => navigate('/licenses')}
                className="flex-1 btn-secondary text-xs h-11 flex items-center justify-center"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary text-xs h-11 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save License
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}
