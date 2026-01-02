import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Search, Filter, ChevronDown, User, FileText,
    BarChart3, PieChart, TrendingUp, DollarSign, Users
} from 'lucide-react';
import { MOCK_TEAM, MOCK_BAAFIYE_DATA } from '../../lib/mockData';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart as RePie, Pie } from 'recharts';

export default function SupervisorBaafiye() {
    const location = useLocation();
    const [team, setTeam] = useState([]);
    const [selectedCollector, setSelectedCollector] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analysis'
    const [customerData, setCustomerData] = useState([]);

    // --- Load Team Data ---
    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('beco_current_user') || 'null');
            const allBranches = JSON.parse(localStorage.getItem('beco_branches') || '[]');
            const allUsers = JSON.parse(localStorage.getItem('beco_users') || '[]');

            let branchId = user?.branchId;
            // Fallback: Find branch by staff name if ID missing
            if (!branchId && user) {
                const b = allBranches.find(br => br.staff?.some(s => s.name === user.name));
                if (b) branchId = b.id;
            }

            let realTeam = [];
            if (branchId) {
                realTeam = allUsers.filter(u => u.branchId === branchId && u.role === 'Collector');
            }

            // Use Real Team or Fallback to Mock
            if (realTeam.length > 0) {
                setTeam(realTeam);
                if (!selectedCollector) setSelectedCollector(realTeam[0].name);
            } else {
                setTeam(MOCK_TEAM);
                if (!selectedCollector) setSelectedCollector(MOCK_TEAM[0].name);
            }
        } catch (e) {
            console.error("Error loading team:", e);
            setTeam(MOCK_TEAM);
            if (!selectedCollector) setSelectedCollector(MOCK_TEAM[0].name);
        }
    }, []);

    // --- Auto Select from Dashboard ---
    useEffect(() => {
        if (location.state?.collectorName) {
            setSelectedCollector(location.state.collectorName);
        }
    }, [location.state]);

    // --- Load Real Mock Data ---
    useEffect(() => {
        if (!selectedCollector) return;
        const data = MOCK_BAAFIYE_DATA[selectedCollector] || [];
        setCustomerData(data);
    }, [selectedCollector]);

    // --- Analytics Calculations ---
    const stats = {
        totalDue: customerData.reduce((sum, c) => c.status !== 'Paid' ? sum + parseFloat(c.balance) : sum, 0),
        totalCollected: customerData.reduce((sum, c) => c.status === 'Paid' ? sum + parseFloat(c.balance) : sum, 0),
        customersCount: customerData.length,
        balanCount: customerData.filter(c => c.status === 'Balan').length
    };

    const statusDist = [
        { name: 'Paid', value: customerData.filter(c => c.status === 'Paid').length, color: '#10b981' },
        { name: 'Pending', value: customerData.filter(c => c.status === 'Pending').length, color: '#f59e0b' },
        { name: 'Balan', value: customerData.filter(c => c.status === 'Balan').length, color: '#3b82f6' }
    ];

    // --- Filtering ---
    const filteredList = customerData.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sqn.includes(searchTerm)
    );

    return (
        <div className="flex flex-col min-h-screen bg-stone-50 pb-24 font-sans">
            {/* Header */}
            <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100 px-4 py-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Baafiye Analysis</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase">Team Insights</p>
                    </div>
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`p-2 rounded-lg transition-all ${activeTab === 'list' ? 'bg-white shadow text-black' : 'text-gray-400'}`}
                        >
                            <FileText size={18} />
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`p-2 rounded-lg transition-all ${activeTab === 'analysis' ? 'bg-white shadow text-black' : 'text-gray-400'}`}
                        >
                            <BarChart3 size={18} />
                        </button>
                    </div>
                </div>

                {/* Collector Selector */}
                <div className="relative mb-3">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                        value={selectedCollector}
                        onChange={(e) => setSelectedCollector(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-black appearance-none"
                    >
                        {team.map(m => (
                            <option key={m.id || m.name} value={m.name}>{m.name} - {m.zone || 'No Zone'}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                {/* Search (List Mode Only) */}
                {activeTab === 'list' && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search SQN or Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                )}
            </div>

            <div className="p-4 space-y-4">
                {/* --- ANALYSIS VIEW --- */}
                {activeTab === 'analysis' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                                    <DollarSign size={14} />
                                    <span className="text-[10px] font-bold uppercase">Collected</span>
                                </div>
                                <p className="text-2xl font-black text-green-600">${stats.totalCollected.toFixed(0)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                                    <TrendingUp size={14} />
                                    <span className="text-[10px] font-bold uppercase">Pending</span>
                                </div>
                                <p className="text-2xl font-black text-orange-500">${stats.totalDue.toFixed(0)}</p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-6">Status Distribution</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePie>
                                        <Pie
                                            data={statusDist}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusDist.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RePie>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                {statusDist.map((item) => (
                                    <div key={item.name} className="flex items-center text-xs font-bold text-gray-500">
                                        <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color }}></div>
                                        {item.name} ({item.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- LIST VIEW --- */
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-gray-400">{filteredList.length} Customers</span>
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-1 rounded">Zone: {team.find(m => m.name === selectedCollector)?.zone || 'N/A'}</span>
                        </div>

                        {filteredList.map((c) => (
                            <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm border-2 ${c.status === 'Paid' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                                        c.status === 'Balan' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                        {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{c.name}</h3>
                                        <div className="flex items-center space-x-1">
                                            <p className="text-[10px] font-mono text-gray-400">SQN: {c.sqn}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${c.status === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                        ${c.balance}
                                    </p>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${c.status === 'Paid' ? 'bg-green-50 text-green-600' :
                                        c.status === 'Balan' ? 'bg-blue-50 text-blue-600' :
                                            'bg-gray-100 text-gray-400'
                                        }`}>
                                        {c.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
