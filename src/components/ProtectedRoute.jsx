import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, role, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-stone-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // CHECK IF PROFILE IS LOADED
    // If user is authenticated but profile is not yet loaded, wait.
    // Do NOT redirect to login, as this causes a loop.
    if (!profile) {
        return (
            <div className="flex justify-center items-center h-screen bg-stone-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    // CHECK PENDING STATUS
    // Bypass pending check as per user request to remove approval step
    // if (profile?.status === 'pending') {
    //    return <Navigate to="/pending" replace />;
    // }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Redirect based on actual role if trying to access unauthorized area
        if (role === 'Super Admin') return <Navigate to="/superadmin/dashboard" replace />;
        if (role === 'Supervisor') return <Navigate to="/supervisor/dashboard" replace />;
        if (role === 'Collector') return <Navigate to="/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
