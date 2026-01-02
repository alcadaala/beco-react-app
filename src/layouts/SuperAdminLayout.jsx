import { Outlet, useNavigate } from 'react-router-dom';
import { SuperAdminBottomNav } from '../components/SuperAdminBottomNav';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminLayout() {
    const { signOut } = useAuth(); // hook usage
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (confirm('Ma hubtaa inaad ka baxdo?')) {
            await signOut();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-200 flex items-center justify-center font-sans text-gray-900">
            {/* Mobile Device Frame */}
            <div className="w-full max-w-[480px] h-screen bg-gray-50 flex flex-col relative shadow-2xl overflow-hidden sm:rounded-[2rem] sm:h-[95vh] sm:border-[8px] sm:border-gray-900">

                {/* Status Bar Mockup */}
                <div className="hidden sm:block absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-xl z-[60]"></div>

                {/* LOGOUT BUTTON */}
                <button
                    onClick={handleLogout}
                    className="absolute top-3 right-3 z-[60] p-2 bg-white/80 backdrop-blur-md text-red-500 rounded-full shadow-sm hover:bg-red-50 active:scale-95 transition-all border border-white/20"
                    title="Logout"
                >
                    <LogOut size={16} />
                </button>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar w-full">
                    <Outlet />
                </main>

                {/* Bottom Navigation */}
                <div className="flex-none z-40 bg-white border-t border-gray-100 pb-safe w-full">
                    <SuperAdminBottomNav />
                </div>
            </div>
        </div>
    );
}
