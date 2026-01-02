import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { lazyImport } from './utils/lazyImport';
import MobileLayout from './layouts/MobileLayout';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import AdminSetup from './pages/AdminSetup';

// Lazy-loaded Collector components
const Dashboard = lazyImport(() => import('./features/collector/Dashboard'));
const Baafiye = lazyImport(() => import('./features/collector/Baafiye'));
const Balan = lazyImport(() => import('./features/collector/Balan'));
const Discounts = lazyImport(() => import('./features/collector/Discounts'));
const Tasks = lazyImport(() => import('./features/collector/Tasks'));
const Services = lazyImport(() => import('./features/collector/Services'));
const Billing = lazyImport(() => import('./features/collector/Billing'));
const HospitalDiscounts = lazyImport(() => import('./features/collector/HospitalDiscounts'));
const Quran = lazyImport(() => import('./features/collector/Quran'));
const DataBundles = lazyImport(() => import('./features/collector/DataBundles'));

import SupervisorLayout from './layouts/SupervisorLayout';

// Lazy-loaded Supervisor components
const SupervisorDashboard = lazyImport(() => import('./features/supervisor/Dashboard'));
const TeamList = lazyImport(() => import('./features/supervisor/TeamList'));
const SupervisorTasks = lazyImport(() => import('./features/supervisor/SupervisorTasks'));
const SupervisorServices = lazyImport(() => import('./features/supervisor/SupervisorServices'));
const SupervisorDiscounts = lazyImport(() => import('./features/supervisor/SupervisorDiscounts'));
const SupervisorBaafiye = lazyImport(() => import('./features/supervisor/SupervisorBaafiye'));
import SuperAdminLayout from './layouts/SuperAdminLayout';

// Lazy-loaded Super Admin components
const SuperAdminDashboard = lazyImport(() => import('./features/superadmin/Dashboard'));

// Lazy-loaded Super Admin components
const SuperAdminBranches = lazyImport(() => import('./features/superadmin/Branches'));
const SuperAdminReports = lazyImport(() => import('./features/superadmin/Reports'));
const DataAdmin = lazyImport(() => import('./features/superadmin/DataAdmin'));
const SuperAdminHospitals = lazyImport(() => import('./features/superadmin/Hospitals'));
const Subscriptions = lazyImport(() => import('./features/superadmin/Subscriptions'));
const UserApprovals = lazyImport(() => import('./features/superadmin/UserApprovals'));
const PendingApproval = lazyImport(() => import('./pages/PendingApproval'));

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
