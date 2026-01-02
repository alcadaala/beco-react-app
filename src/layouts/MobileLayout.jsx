import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Moon, Sun, Clock, UserCheck, XCircle, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileLayout() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading } = useAuth();

    // States
    const [blockedState, setBlockedState] = useState(null);
    const [pendingState, setPendingState] = useState(false);
    const [rejectedState, setRejectedState] = useState(false);
    const [subscriptionExpired, setSubscriptionExpired] = useState(false);
    const [notification, setNotification] = useState(null);

    const location = useLocation();

    // 1. SECURITY & STATUS CHECK
    useEffect(() => {
        if (authLoading) return;
        if (!profile) return;

        const checkStatus = () => {
            // A. Check Approval Status
            // A. Check Approval Status
            if (profile.status === 'Pending') {
                // AUTO-APPROVE ON FRONTEND (Bypass modal)
                setPendingState(false);
                setRejectedState(false);
            } else if (profile.status === 'Rejected') {
                setRejectedState(true);
                setPendingState(false);
                if (location.pathname !== '/baafiye') {
                    navigate('/baafiye', { replace: true });
                }
            } else {
                // Active
                setPendingState(false);
                setRejectedState(false);
            }

            // B. Check Branch Status
            if (profile.branch) {
                const branches = JSON.parse(localStorage.getItem('beco_branches') || '[]');
                const branch = branches.find(b => b.name === profile.branch || b.id === profile.branchId);

                if (branch && branch.status === 'Suspended') {
                    setBlockedState({
                        name: branch.name,
                        reason: branch.suspendReason || 'Contact your administrator.'
                    });
                } else {
                    setBlockedState(null);
                }
            }
        };

        checkStatus();
    }, [profile, authLoading, location.pathname]);

    // 2. USAGE TRACKING (Background)
    useEffect(() => {
        const trackUsage = () => {
            if (blockedState || pendingState) return;
            const today = new Date().toISOString().split('T')[0];
            const storedLogs = localStorage.getItem('usage_logs');
            let logs = {};
            try { logs = JSON.parse(storedLogs || '{}'); } catch (e) { logs = {}; }
            logs[today] = (logs[today] || 0) + 1;
            localStorage.setItem('usage_logs', JSON.stringify(logs));
        };
        const intervalId = setInterval(trackUsage, 60 * 1000);
        return () => clearInterval(intervalId);
    }, [blockedState, pendingState]);

    // Handle Extension Logic (Legacy support for now)
    const handleExtendTwoDays = () => {
        // Implementation kept for compatibility but might need refactoring for Supabase
        const userStr = localStorage.getItem('beco_current_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const now = new Date();
            const newExpiry = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
            const updatedUser = { ...user, subscriptionExpiry: newExpiry.toISOString(), subscriptionExtended: true };
            localStorage.setItem('beco_current_user', JSON.stringify(updatedUser)); // Note: This doesn't update Supabase yet
            setSubscriptionExpired(false);
            setNotification('Extended (Local Only)!');
        }
    };

    if (authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

    if (blockedState) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center font-sans text-gray-900 p-4">
                <div className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95 border-b-8 border-red-500">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-pulse">
                        <XCircle size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Branch Suspended</h1>
                    <p className="text-sm font-bold text-red-600 uppercase tracking-wider mb-6">{blockedState.name}</p>
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-8">
                        <p className="text-xs text-red-400 font-bold uppercase mb-2">Message from Admin</p>
                        <p className="text-base text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">"{blockedState.reason}"</p>
                    </div>
                    <button onClick={() => window.location.href = '/login'} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">Back to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center font-sans text-gray-900">
            {notification && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl border-2 border-white/20 font-bold text-sm animate-in slide-in-from-top-10 fade-in zoom-in duration-300 flex items-center gap-2">
                    <UserCheck size={18} />
                    <span>{notification}</span>
                </div>
            )}

            <div className="w-full max-w-[480px] h-screen bg-gray-50 flex flex-col relative shadow-2xl overflow-hidden sm:rounded-[2rem] sm:h-[95vh] sm:border-[8px] sm:border-gray-900">
                <div className="hidden sm:block absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-xl z-[60]"></div>

                {/* Pending Approval Modal */}
                {pendingState && (
                    <div className="absolute inset-x-0 bottom-0 top-0 z-[60] bg-black/10 backdrop-blur-[1px] flex flex-col justify-end pointer-events-none">
                        <div className="bg-white m-4 mb-6 p-6 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 animate-in slide-in-from-bottom-20 duration-500 pointer-events-auto">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="bg-yellow-50 p-3.5 rounded-2xl text-yellow-600 shrink-0 animate-pulse"><Clock size={28} /></div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-xl mb-1">Approval Pending</h3>
                                    <p className="text-xs font-medium text-gray-500 leading-relaxed">Your account is currently under review. You have limited visibility until a Super Admin approves your request.</p>
                                </div>
                            </div>
                            <button onClick={() => window.location.href = '/login'} className="w-full py-4 bg-gray-100 active:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors">Logout / Back to Login</button>
                        </div>
                    </div>
                )}

                {/* Rejected Modal */}
                {rejectedState && (
                    <div className="absolute inset-x-0 bottom-0 top-0 z-[60] bg-black/10 backdrop-blur-[1px] flex flex-col justify-end pointer-events-none">
                        <div className="bg-white m-4 mb-6 p-6 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-red-100 animate-in slide-in-from-bottom-20 duration-500 pointer-events-auto">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="bg-red-50 p-3.5 rounded-2xl text-red-600 shrink-0 animate-pulse"><XCircle size={28} /></div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-xl mb-1">Codsiga waa la diiday</h3>
                                    <p className="text-xs font-medium text-gray-500 leading-relaxed mb-3">Waan ka xunahay, codsigaaga ku aadan Zone-kaas waa la diiday.</p>
                                </div>
                            </div>
                            <button onClick={() => window.location.href = '/login'} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl text-sm transition-colors shadow-lg">Back to Login</button>
                        </div>
                    </div>
                )}

                {/* Subscription Expired Modal */}
                {subscriptionExpired && (
                    <div className="absolute inset-x-0 bottom-0 top-0 z-[60] bg-black/10 backdrop-blur-[1px] flex flex-col justify-end pointer-events-none">
                        <div className="bg-white m-4 mb-6 p-6 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-blue-100 animate-in slide-in-from-bottom-20 duration-500 pointer-events-auto">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600 shrink-0 animate-pulse"><CreditCard size={28} /></div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-xl mb-1">Wakhtiga waa dhacay</h3>
                                    <p className="text-xs font-medium text-gray-500 leading-relaxed mb-3">Fadlan bixi <span className="text-gray-900 font-bold">$2</span>.</p>
                                </div>
                            </div>
                            <button onClick={handleExtendTwoDays} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg">Extend 2 Days</button>
                        </div>
                    </div>
                )}

                <main className={`flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar w-full ${(pendingState || rejectedState || subscriptionExpired) ? 'pointer-events-none opacity-60 grayscale-[0.5] transition-all duration-500' : ''}`}>
                    <Outlet />
                </main>

                {!pendingState && (
                    <div className="flex-none z-40 bg-white border-t border-gray-100 pb-safe w-full">
                        <BottomNav />
                    </div>
                )}
            </div>
        </div>
    );
}
