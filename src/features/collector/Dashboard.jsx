import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, AlertCircle, CheckCircle2, LogOut, Clock, Calendar, ChevronRight, Moon, X, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

// --- COMPONENTS ---

function KPICard({ title, value, icon: Icon, color, trend }) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
            {/* Background Blob */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${color} group-hover:scale-110 transition-transform`}></div>

            <div className="flex justify-between items-start z-10">
                <div className={`h-10 w-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center text-${color.replace('bg-', '')}-600`}>
                    <Icon size={20} className={color.replace('bg-', 'text-')} />
                </div>
                {trend && (
                    <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>

            <div className="mt-4 z-10">
                <span className="text-2xl font-bold text-gray-900 block tracking-tight">{value}</span>
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</span>
            </div>
        </div>
    );
}

function TimeTrackerCard({ userName, userId }) {
    const [timeStr, setTimeStr] = useState('0h 0m');
    const [dateStr, setDateStr] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [prayerInfo, setPrayerInfo] = useState({ name: '', time: '', remaining: '' });

    useEffect(() => {
        // Date String
        const now = new Date();
        setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));

        // PRAYER TIMES
        const PRAYER_TIMES = [
            { name: 'Fajr', hour: 5, minute: 0 },
            { name: 'Duhur', hour: 12, minute: 0 },
            { name: 'Asr', hour: 15, minute: 15 },
            { name: 'Maghrib', hour: 18, minute: 0 },
            { name: 'Isha', hour: 19, minute: 15 }
        ];

        // TIME TRACKING LOGIC (Local Session Only)
        if (!userId) return;

        const todayKey = new Date().toDateString();
        const storageKey = `activeSeconds_${userId}_${todayKey}`;
        let interval = null;

        const updateDisplay = () => {
            const totalSecs = parseInt(localStorage.getItem(storageKey) || '0');
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;

            setTimeStr(`${hrs}h ${mins}m`);
            setSeconds(secs);
        };

        const updatePrayer = () => {
            const nowObj = new Date();
            const currentMinutes = nowObj.getHours() * 60 + nowObj.getMinutes();
            let nextPrayer = null;
            let minDiff = Infinity;

            for (let p of PRAYER_TIMES) {
                const pMinutes = p.hour * 60 + p.minute;
                let diffInMinutes = pMinutes - currentMinutes;
                if (diffInMinutes < 0) diffInMinutes += 24 * 60;

                if (diffInMinutes < minDiff) {
                    minDiff = diffInMinutes;
                    nextPrayer = p;
                }
            }

            if (nextPrayer) {
                const remHrs = Math.floor(minDiff / 60);
                const remMins = minDiff % 60;
                setPrayerInfo({
                    name: nextPrayer.name,
                    time: `${nextPrayer.hour}:${nextPrayer.minute.toString().padStart(2, '0')}`,
                    remaining: `- ${remHrs}h ${remMins}m`
                });
            }
        }

        const tick = () => {
            const current = parseInt(localStorage.getItem(storageKey) || '0');
            localStorage.setItem(storageKey, (current + 1).toString());
            updateDisplay();
            updatePrayer();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (interval) clearInterval(interval);
                interval = null;
            } else {
                if (!interval) {
                    updateDisplay();
                    interval = setInterval(tick, 1000);
                }
            }
        };

        updateDisplay();
        updatePrayer();
        if (!document.hidden) {
            interval = setInterval(tick, 1000);
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            if (interval) clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [userId]);

    return (
        <div className="relative overflow-hidden rounded-3xl shadow-xl shadow-indigo-200 mb-6 group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 animate-gradient-x"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-30 animate-pulse -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl opacity-30 animate-blob"></div>

            <div className="relative z-10 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                            </div>
                            <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest truncate max-w-[150px]">
                                {userName ? `Mudane ${userName.split(' ')[0]}` : dateStr}
                            </span>
                        </div>

                        <div className="flex items-baseline space-x-1">
                            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">{timeStr}</h2>
                            <span className="text-sm font-medium text-indigo-200 animate-pulse">
                                {seconds.toString().padStart(2, '0')}s
                            </span>
                        </div>

                        <p className="text-indigo-100/80 text-xs font-medium mt-1 flex items-center">
                            <Clock size={12} className="mr-1.5" /> Time Active Today
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 rounded-xl flex flex-col items-center min-w-[80px]">
                            <span className="text-[10px] text-indigo-200 font-bold uppercase mb-0.5">Next Solah</span>
                            <div className="flex items-center space-x-1">
                                <Moon size={12} className="text-yellow-300 fill-yellow-300" />
                                <span className="text-sm font-black text-white">{prayerInfo.name}</span>
                            </div>
                            <span className="text-xs font-medium text-white/80">{prayerInfo.remaining}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 w-full opacity-50"></div>
        </div>
    );
}

// --- MAIN DASHBOARD ---

export default function Dashboard() {
    const navigate = useNavigate();

    const DEFAULT_CHART_DATA = [
        { name: 'Caawa', value: 0, fill: '#3b82f6' },
        { name: 'Galabta', value: 0, fill: '#f59e0b' },
        { name: 'Duhur', value: 0, fill: '#ef4444' },
        { name: 'Balan', value: 0, fill: '#8b5cf6' },
        { name: 'Paid', value: 0, fill: '#10b981' }
    ];

    // Helper to calculate stats from a list of customers
    const calculateStats = (customerList) => {
        if (!customerList || customerList.length === 0) return {
            totalCustomers: 0, paidCount: 0, pending: '$0', target: '0', callsMade: 0, collected: 0, progress: 0
        };

        const total = customerList.length;
        const paidCustomers = customerList.filter(c => c.status === 'Paid');
        const paidCount = paidCustomers.length;

        const pendingCustomers = customerList.filter(c => c.status !== 'Paid');
        const pendingAmount = pendingCustomers.reduce((acc, c) => {
            // Check for both 'balance' and 'Balance' and ensure string
            const b = c.balance ?? c.Balance ?? 0;
            const val = parseFloat(String(b).replace(/[^0-9.-]+/g, "") || 0);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);

        // Calculate Target
        const eligibleForTarget = customerList.filter(c => {
            const b = c.balance ?? c.Balance ?? 0;
            const val = parseFloat(String(b).replace(/[^0-9.-]+/g, "") || 0);
            return c.status !== 'Paid' && val > 3;
        }).length;

        const today = new Date().getDate();
        let targetDivisor = today <= 15 ? 15 - today : 24 - today;
        if (targetDivisor <= 0) targetDivisor = 1;
        const dailyTarget = Math.ceil(eligibleForTarget / targetDivisor);

        const progressPercent = dailyTarget > 0 ? Math.min(100, Math.round((paidCount / dailyTarget) * 100)) : 0;

        return {
            totalCustomers: total - paidCount,
            paidCount: paidCount,
            pending: `$${Math.floor(pendingAmount).toLocaleString()}`,
            target: `${dailyTarget}`,
            callsMade: 0, // Will update from Firestore
            collected: paidCount,
            progress: progressPercent
        };
    };

    // Calculate initial state from local storage to show data immediately
    const getInitialStats = () => {
        const localData = localStorage.getItem('baafiye_local_data');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                return calculateStats(parsed);
            } catch (e) { console.error(e); }
        }
        return {
            totalCustomers: 0,
            paidCount: 0,
            pending: '$0',
            target: '0',
            callsMade: 0,
            collected: 0,
            progress: 0
        };
    };

    const [stats, setStats] = useState(getInitialStats());
    const [chartData, setChartData] = useState(DEFAULT_CHART_DATA);
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [promo, setPromo] = useState(null);
    const [showPromo, setShowPromo] = useState(false);
    const [viewingAssistant, setViewingAssistant] = useState(null);
    const [activeNotification, setActiveNotification] = useState(null);
    const [subExpiryWarning, setSubExpiryWarning] = useState(null);
    const [assistants, setAssistants] = useState([]);
    const [assistantStats, setAssistantStats] = useState({});

    // Fetch User & Notifications
    const loadUser = async () => {
        const localUser = JSON.parse(localStorage.getItem('beco_current_user') || 'null');
        if (!localUser) return;

        try {
            const userDoc = await getDoc(doc(db, 'profiles', localUser.id));

            if (userDoc.exists()) {
                const dbUser = { id: userDoc.id, ...userDoc.data() };

                // Fetch Notifications
                const notifsQuery = query(
                    collection(db, 'notifications'),
                    where('user_id', '==', dbUser.id),
                    where('read', '==', false)
                );
                const notifsSnapshot = await getDocs(notifsQuery);
                const notifs = notifsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                const fullUser = { ...dbUser, notifications: notifs || [] };

                setCurrentUser(fullUser);
                localStorage.setItem('beco_current_user', JSON.stringify(fullUser));

                // Check Expiry
                if (fullUser.subscription_expiry) {
                    const now = new Date();
                    const expiry = new Date(fullUser.subscription_expiry);
                    const diffTime = expiry - now;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays > 0 && diffDays <= 3) {
                        setSubExpiryWarning({
                            days: diffDays,
                            date: expiry.toLocaleDateString(),
                            settings: { title: 'Digniin!', template: 'Rusuushka wuu dhacayaa {days} maalin kadib.', color: 'orange' }
                        });
                    }
                }

                // Fetch Assistants
                if (fullUser.role === 'Collector') {
                    const asstsQuery = query(
                        collection(db, 'profiles'),
                        where('parent_id', '==', fullUser.id),
                        where('role', '==', 'Assistant')
                    );
                    const asstsSnapshot = await getDocs(asstsQuery);
                    const assts = asstsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                    if (assts.length > 0) setAssistants(assts);
                }
            }
        } catch (e) {
            console.error("User Load Error", e);
        }
    };

    // Load Dashboard Stats
    const loadStats = async () => {
        try {
            // Fetch User
            const userStr = localStorage.getItem('beco_current_user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user) return;

            // Determine Zone (Branch)
            const zone = user.branch || 'General';

            // 1. Fetch Customers from Zone-Specific Path
            let customers = [];
            try {
                // Query: zones/{zone}/customers WHERE collector_id == user.id
                const customersQuery = query(
                    collection(db, 'zones', zone, 'customers'),
                    where('collector_id', '==', user.id)
                );

                const customersSnapshot = await getDocs(customersQuery);
                customers = customersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                // Try generic 'customers' fallback for legacy data IF zone query empty
                // (Only if user is not brand new, but strictly following 'zone' request now)
                if (customers.length === 0 && zone === 'General') {
                    // Check legacy 'customers' root collection just in case
                    const legacyQ = query(collection(db, 'customers'), where('collector_id', '==', user.id));
                    const legacySnap = await getDocs(legacyQ);
                    if (!legacySnap.empty) {
                        customers = legacySnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    }
                }

            } catch (err) {
                console.warn("Dashboard Firestore fetch failed", err);
            }

            // Fallback to local storage
            if (!customers || customers.length === 0) {
                const localData = localStorage.getItem('baafiye_local_data');
                if (localData) customers = JSON.parse(localData);
            }

            if (!customers || customers.length === 0) {
                setStats({
                    totalCustomers: 0,
                    paidCount: 0,
                    pending: '$0',
                    target: '0',
                    callsMade: 0,
                    collected: 0,
                    progress: 0
                });
                return;
            }

            const calculated = calculateStats(customers);

            // Calls Made (Self)
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

            let callsMade = 0;
            if (user.id) {
                try {
                    const callsQuery = query(
                        collection(db, 'activity_logs'),
                        where('user_id', '==', user.id),
                        where('action_type', '==', 'call'),
                        where('created_at', '>=', startOfDay.toISOString()),
                        where('created_at', '<=', endOfDay.toISOString())
                    );
                    const callsSnapshot = await getCountFromServer(callsQuery);
                    callsMade = callsSnapshot.data().count || 0;
                } catch (e) { console.warn("Calls count failed", e); }
            }

            setStats({
                ...calculated,
                callsMade: callsMade
            });

            // Update Chart Data (Simple version)
            const paid = calculated.paidCount;
            const open = calculated.totalCustomers;
            setChartData([
                { name: 'Unpaid', value: open, fill: '#ef4444' }, // red
                { name: 'Paid', value: paid, fill: '#10b981' }   // green
            ]);


        } catch (e) {
            console.error(e);
        }
    };

    // Load Assistant Stats when assistants change
    useEffect(() => {
        if (assistants.length === 0) return;

        const fetchAsstStats = async () => {
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

            const statsMap = {};
            for (const asst of assistants) {
                const activityQuery = query(
                    collection(db, 'activity_logs'),
                    where('user_id', '==', asst.id),
                    where('action_type', '==', 'call'),
                    where('created_at', '>=', startOfDay.toISOString())
                );

                const countSnapshot = await getCountFromServer(activityQuery);
                statsMap[asst.id] = { calls: countSnapshot.data().count || 0 };
            }
            setAssistantStats(statsMap);
        };
        fetchAsstStats();
    }, [assistants]);


    useEffect(() => {
        loadUser();
        loadStats();

        // Polling for updates
        const interval = setInterval(() => {
            loadStats();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        localStorage.removeItem('beco_current_user');
        await signOut(auth);
        navigate('/login');
    };

    const handleBarClick = (data) => {
        if (data && data.name) {
            navigate('/baafiye', { state: { filter: data.name } });
        }
    };

    return (
        <div className="p-6 space-y-6 pb-24 min-h-screen bg-gray-50/50 font-sans">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center space-x-3">
                    <img src="/logo.png" alt="Beco Logo" className="h-8 w-auto object-contain animate-pulse" />
                    {currentUser && (
                        <div className="bg-gray-900 text-white px-2 py-1 rounded-md text-xs font-black uppercase tracking-wider shadow-md">
                            {currentUser.branch_id ? 'Branch Code' : 'Zone'} {currentUser.branch_id || currentUser.zone || 'N/A'}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut size={20} />
                </button>
            </div>

            {/* Time Tracker */}
            <TimeTrackerCard userName={currentUser?.full_name} userId={currentUser?.id} />

            {/* Subscription Warning */}
            {subExpiryWarning && (
                <div className="bg-orange-500 text-white p-5 rounded-[1.5rem] mb-6 shadow-xl shadow-orange-200 relative overflow-hidden animate-in zoom-in-95">
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <AlertCircle size={24} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg leading-none mb-1">Digniin!</h3>
                            <p className="text-xs font-medium text-orange-50 opacity-90 leading-tight">
                                Rusuushka wuu dhacayaa {subExpiryWarning.days} maalin kadib.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Header */}
            <div
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                className={`bg-white rounded-3xl shadow-sm border border-gray-100 mb-6 relative overflow-hidden transition-all duration-500 ease-in-out cursor-pointer group ${isHeaderExpanded ? 'p-5' : 'p-4 hover:shadow-md'}`}
            >
                <div className={`flex justify-between items-center ${isHeaderExpanded ? 'mb-4' : ''}`}>
                    <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isHeaderExpanded ? 'bg-indigo-50 text-indigo-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-200'}`}>
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h1 className="text-gray-900 font-bold text-lg leading-tight">Daily Goal</h1>
                            {!isHeaderExpanded && (
                                <p className="text-xs text-gray-500 font-medium fade-in">
                                    {stats.progress}% Complete <span className="text-gray-300 mx-1">•</span> Tap for details
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {!isHeaderExpanded && (
                            <div className="text-right hidden sm:block">
                                <span className="block text-lg font-black text-gray-900">{stats.paidCount}/{stats.target}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Paid Today</span>
                            </div>
                        )}
                        <div className={`transform transition-transform duration-500 ${isHeaderExpanded ? 'rotate-180 bg-gray-100 text-gray-600' : 'bg-white border border-gray-100 text-gray-400'} h-8 w-8 rounded-full flex items-center justify-center`}>
                            <ChevronRight size={16} className="rotate-90" />
                        </div>
                    </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isHeaderExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-gray-600">Progress Tracker</span>
                            <span className="text-blue-600">{stats.progress}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 relative"
                                style={{ width: `${stats.progress}%` }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-full bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium text-right flex justify-end items-center">
                            <span className="bg-white px-2 py-1 rounded border border-gray-100 shadow-sm text-gray-600">
                                {stats.paidCount} paid customers
                            </span>
                            <span className="mx-2 text-gray-300">/</span>
                            <span className="text-gray-900 font-bold">{stats.target} target</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-50">
                            <div className="flex items-center space-x-3">
                                <Clock size={16} className="text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Calls</span>
                            </div>
                            <span className="text-lg font-black text-indigo-700">{stats.callsMade}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                            <div className="flex items-center space-x-3">
                                <CheckCircle2 size={16} className="text-emerald-600" />
                                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Paid</span>
                            </div>
                            <span className="text-lg font-black text-emerald-700">{stats.paidCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TEAM ACTIVITY (Assistants) */}
            {assistants.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Team Activity</h3>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{assistants.length} Assistants</span>
                    </div>

                    <div className="space-y-3">
                        {assistants.map(ast => (
                            <div
                                key={ast.id}
                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-95"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold text-xs shadow-inner">
                                        {ast.full_name ? ast.full_name.substring(0, 2).toUpperCase() : 'AS'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{ast.full_name}</h4>
                                        <p className="text-[10px] font-medium text-gray-400">Assistant</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="flex items-center text-xs font-bold text-indigo-600 justify-end">
                                        <Clock size={10} className="mr-1" /> {assistantStats[ast.id]?.calls || 0} Calls
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium">Activity Today</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-4">
                <KPICard title="Total Due" value={stats.pending} icon={Users} color="bg-blue-500" />
                <KPICard title="Paid Count" value={stats.paidCount} icon={CheckCircle2} color="bg-emerald-500" trend="+12%" />
                <KPICard title="Target" value={stats.target} icon={TrendingUp} color="bg-purple-500" />
                <KPICard title="Calls" value={stats.callsMade} icon={AlertCircle} color="bg-orange-500" />
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">Customer Status</h3>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} onClick={handleBarClick}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px' }} />
                            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
