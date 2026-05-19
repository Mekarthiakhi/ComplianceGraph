import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth } from './services/firebase';
import useAuthStore from './store/authStore';
import api from './services/api';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import LicenseList from './components/licenses/LicenseList';
import AddLicense from './components/licenses/AddLicense';
import GraphView from './components/graph/GraphView';
import AIChecklist from './components/ai/AIChecklist';
import Billing from './components/billing/Billing';

export default function App() {
  const { setUser, setCompany, setLoading } = useAuthStore();

  useEffect(() => {
    const mockUserStr = localStorage.getItem('mock_user');
    if (mockUserStr) {
      try {
        const mockUser = JSON.parse(mockUserStr);
        setUser(mockUser);
        api.get('/companies/me')
          .then((r) => setCompany(r.data))
          .catch(() => setCompany(null))
          .finally(() => setLoading(false));
        return;
      } catch (e) {
        localStorage.removeItem('mock_user');
        localStorage.removeItem('mock_token');
      }
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const r = await api.get('/companies/me');
          setCompany(r.data);
        } catch {
          setCompany(null);
        }
      } else {
        setCompany(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e2130',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/licenses" element={<ProtectedRoute><LicenseList /></ProtectedRoute>} />
        <Route path="/licenses/add" element={<ProtectedRoute><AddLicense /></ProtectedRoute>} />
        <Route path="/graph" element={<ProtectedRoute><GraphView /></ProtectedRoute>} />
        <Route path="/ai-checklist" element={<ProtectedRoute><AIChecklist /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
