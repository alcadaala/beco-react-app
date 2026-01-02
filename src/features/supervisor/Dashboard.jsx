import { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard,
    Users,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Clock,
    Phone,
    MoreHorizontal,
    MapPin,
    ShieldAlert,
    Gift,
    X,
    Battery,
    Wifi,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { MOCK_TEAM } from '../../lib/mockData';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * SUPERVISOR DASHBOARD
 * Command Center for managing team performance and live status.
 */

// --- Safely Load Data Helper ---
const safeLoad = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        const parsed = JSON.parse(item);
        return parsed || fallback;
    } catch (err) {
        console.warn(`Failed to load ${key}`, err);
        return fallback;
    }
};

export default function SupervisorDashboard() {
    // --- State ---
    const [currentUser, setCurrentUser] = useState(null);
    const [myBranch, setMyBranch] = useState(null);
    const [team, setTeam] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    // --- Data Loading ---
    // Imports moved to top of file


    // ... inside component ...

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. User
                const user = safeLoad('beco_current_user', null);
                setCurrentUser(user);

                // Initialize cache
                const cachedTeam = safeLoad('supervisor_team_cache', []);
                if (cachedTeam.length > 0) setTeam(cachedTeam);

                // 2. Fetch My Branch
                const allBranches = safeLoad('beco_branches', []); // Keep using local for quick branch name lookup first
                let branch = null;
                if (user && user.branchId) {
                    branch = allBranches.find(b => b.id === user.branchId);
                }
                setMyBranch(branch || { name: user?.branch || 'My Team' });

                // 3. FETCH REAL TEAM (Collectors in my branch)
                // Filter by branch_id if available, or if "Supervisor", maybe fetch all attached?
                // Assuming profiles have 'branch_id' or 'branch'.
                if (!user) return;

                const branchId = user.branchId || user.branch; // Adjust field name as per your DB
                if (!branchId) {
                    // Fallback to MOCK if no branch assigned
                    if (cachedTeam.length === 0) setTeam(MOCK_TEAM);
                    return;
                }

                // Query Firestore
                const teamQuery = query(
                    collection(db, 'profiles'),
                    where('role', '==', 'Collector'),
                    where('branch_id', '==', branchId) // Ensure this field exists in 'profiles'
                );

                // Note: If 'branch_id' is missing in profiles, you might need to query by string 'branch'
                // For robustness, try mapped fetching if this returns empty?

                const teamSnap = await getDocs(teamQuery);
                const teamDocs = teamSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // 4. Fetch Live Stats for Team
                const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

                const enrichedTeam = await Promise.all(teamDocs.map(async (member) => {
                    // Count Calls
                    let calls = 0;
                    try {
                        const q = query(
                            collection(db, 'activity_logs'),
                            where('user_id', '==', member.id),
                            where('action_type', '==', 'call'),
                            where('created_at', '>=', startOfDay.toISOString())
                        );
                        const snaps = await getCountFromServer(q);
                        calls = snaps.data().count;
                    } catch (e) { }

                    // Count Paid (Approximation or use 'payment' logs)
                    // You might need a more complex query or sum aggregation here.
                    // For now, let's use a random placeholder or sum from logs if available.
                    let collected = 0;
                    // TODO: Implement actual revenue sum query
                    // collected = ... 

                    return {
                        ...member,
                        status: member.status || 'Offline',
                        battery: member.battery || 100, // Placeholder
                        target: member.target || 200, // Default Target
                        paid: collected + calls, // Temporary logic: calls * 1 just to show movement
                        lastActive: 'Today'
                    };
                }));

                if (enrichedTeam.length > 0) {
                    setTeam(enrichedTeam);
                    localStorage.setItem('supervisor_team_cache', JSON.stringify(enrichedTeam)); // Cache it
                } else if (cachedTeam.length === 0) {
                    // Only mock if absolutely nothing found
                    setTeam(MOCK_TEAM);
                }

            } catch (error) {
                console.error("Dashboard Critical Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        const totalTeam = team.length;
        const activeTeam = team.filter(m => m.status === 'Active' || m.status === 'Online').length;
        const totalTarget = team.reduce((acc, curr) => acc + (curr.target || 0), 0);
        const totalPaid = team.reduce((acc, curr) => acc + (curr.paid || 0), 0);
        const overallProgress = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;

        return {
            teamCount: totalTeam,
            activeCount: activeTeam,
            totalTarget,
            totalPaid,
            overallProgress
        };
    }, [team]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-24 font-sans">
            {/* --- Top Bar --- */}
            <div className="bg-white px-6 py-5 border-b border-gray-200 sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">
                            Command Center
                        </h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {myBranch?.name || 'Overview'}
                        </p>
                    </div>
                    <div onClick={() => navigate('/supervisor/team')} className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 cursor-pointer hover:bg-indigo-700 transition">
                        <Users size={20} />
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">

                {/* --- Live Operations Status --- */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="relative">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Live Agents</span>
                        </div>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-3xl font-black text-gray-900">{stats.activeCount}</span>
                            <span className="text-sm font-bold text-gray-400">/ {stats.teamCount}</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="flex items-center space-x-2 mb-2">
                            <BarChart3 size={14} className="text-blue-500" />
                            <span className="text-xs font-bold text-gray-400 uppercase">Daily Goal</span>
                        </div>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-3xl font-black text-blue-600">{stats.overallProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.overallProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* --- LEADERBOARD (Target Tracking) --- */}
                <div>
                    <div className="flex justify-between items-end mb-4 px-2">
                        <h3 className="font-bold text-gray-900 text-lg">Live Targets</h3>
                        <span className="text-xs font-bold text-gray-400 uppercase">Paid vs Goal</span>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        {team
                            .sort((a, b) => ((b.paid / b.target) - (a.paid / a.target))) // Sort by % complete
                            .map((member, i) => {
                                const percent = Math.min(100, Math.round((member.paid / member.target) * 100));
                                return (
                                    <div
                                        key={i}
                                        onClick={() => navigate('/supervisor/baafiye', { state: { collectorName: member.name } })}
                                        className="p-4 border-b border-gray-50 last:border-0 relative group cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Progress Background */}
                                        <div
                                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ width: `${percent}%` }}
                                        ></div>

                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 border-2 border-white shadow-sm overflow-hidden">
                                                        {member.image ? <img src={member.image} alt="" className="w-full h-full object-cover" /> : member.name.charAt(0)}
                                                    </div>
                                                    {/* Status Dot */}
                                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${member.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-gray-900 text-sm">{member.name}</h4>
                                                        {percent >= 100 && <CheckCircle2 size={12} className="text-green-500 fill-green-100" />}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 mt-0.5">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={10} /> {member.zone}
                                                        </span>
                                                        <span className={`flex items-center gap-1 ${member.battery < 20 ? 'text-red-400' : 'text-gray-400'}`}>
                                                            <Battery size={10} className={member.battery < 20 ? 'animate-pulse' : ''} /> {member.battery}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-gray-900">
                                                    {percent}<span className="text-xs text-gray-400 ml-0.5">%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar Visual */}
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1.5 px-0.5">
                                            <span>${member.paid} collected</span>
                                            <span>Goal: ${member.target}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* --- RECENT ALERTS --- */}
                <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-4 px-2">Live Feed</h3>
                    <div className="space-y-3">
                        {/* Mock Alerts */}
                        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Phone size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-900 font-bold"><span className="text-gray-600">Ahmed Yasin</span> made a call to <span className="text-blue-600">Customer #492</span>.</p>
                                <p className="text-[10px] text-gray-400 mt-1">2 minutes ago</p>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                                <ShieldAlert size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-900 font-bold"><span className="text-gray-600">Fatima Ali</span> reported an issue in <span className="text-gray-900">Hodan Zone</span>.</p>
                                <p className="text-[10px] text-gray-400 mt-1">15 minutes ago</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
