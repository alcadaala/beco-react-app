import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MobileLayout from './layouts/MobileLayout';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import AdminSetup from './pages/AdminSetup';

// Lazy-loaded Collector components
const Dashboard = lazy(() => import('./features/collector/Dashboard'));
const Baafiye = lazy(() => import('./features/collector/Baafiye'));
const Balan = lazy(() => import('./features/collector/Balan'));
const Discounts = lazy(() => import('./features/collector/Discounts'));
const Tasks = lazy(() => import('./features/collector/Tasks'));
const Services = lazy(() => import('./features/collector/Services'));
const Billing = lazy(() => import('./features/collector/Billing'));
const HospitalDiscounts = lazy(() => import('./features/collector/HospitalDiscounts'));
const Quran = lazy(() => import('./features/collector/Quran'));
const DataBundles = lazy(() => import('./features/collector/DataBundles'));

import SupervisorLayout from './layouts/SupervisorLayout';

// Lazy-loaded Supervisor components
const SupervisorDashboard = lazy(() => import('./features/supervisor/Dashboard'));
const TeamList = lazy(() => import('./features/supervisor/TeamList'));
const SupervisorTasks = lazy(() => import('./features/supervisor/SupervisorTasks'));
const SupervisorServices = lazy(() => import('./features/supervisor/SupervisorServices'));
const SupervisorDiscounts = lazy(() => import('./features/supervisor/SupervisorDiscounts'));
const SupervisorBaafiye = lazy(() => import('./features/supervisor/SupervisorBaafiye'));
import SuperAdminLayout from './layouts/SuperAdminLayout';

// Lazy-loaded Super Admin components
const SuperAdminDashboard = lazy(() => import('./features/superadmin/Dashboard'));

// Lazy-loaded Super Admin components
const SuperAdminBranches = lazy(() => import('./features/superadmin/Branches'));
const SuperAdminReports = lazy(() => import('./features/superadmin/Reports'));
const DataAdmin = lazy(() => import('./features/superadmin/DataAdmin'));
const SuperAdminHospitals = lazy(() => import('./features/superadmin/Hospitals'));
const Subscriptions = lazy(() => import('./features/superadmin/Subscriptions'));
const UserApprovals = lazy(() => import('./features/superadmin/UserApprovals'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));

// Loading Fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* COLLECTOR ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['Collector']} />}>
            <Route element={<MobileLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="baafiye" element={<Baafiye />} />
              <Route path="balan" element={<Balan />} />
              <Route path="discounts" element={<Discounts />} />
              <Route path="data-bundles" element={<DataBundles />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="services" element={<Services />} />
              <Route path="billing" element={<Billing />} />
              <Route path="hospital-discounts" element={<HospitalDiscounts />} />
              <Route path="quran" element={<Quran />} />
            </Route>
          </Route>

          {/* SUPERVISOR ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['Supervisor']} />}>
            <Route path="/supervisor" element={<SupervisorLayout />}>
              <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
              <Route path="dashboard" element={<SupervisorDashboard />} />
              <Route path="team" element={<TeamList />} />
              <Route path="tasks" element={<SupervisorTasks />} />
              <Route path="discounts" element={<SupervisorDiscounts />} />
              <Route path="baafiye" element={<SupervisorBaafiye />} />
              <Route path="services" element={<SupervisorServices />} />
              <Route path="services/data-bundles" element={<DataBundles />} />
              <Route path="services/hospital-discounts" element={<HospitalDiscounts />} />
              <Route path="services/quran" element={<Quran />} />
              <Route path="services/approvals" element={<SupervisorDiscounts />} />
              <Route path="services/baafiye" element={<SupervisorBaafiye />} />
            </Route>
          </Route>

          {/* SUPER ADMIN ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="branches" element={<SuperAdminBranches />} />
              <Route path="hospitals" element={<SuperAdminHospitals />} />
              <Route path="reports" element={<SuperAdminReports />} />
              <Route path="data" element={<DataAdmin />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="approvals" element={<UserApprovals />} />
              <Route path="settings" element={<Navigate to="/superadmin/dashboard" replace />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
