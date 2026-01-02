import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Wifi, Smartphone, CheckCircle, Settings, Megaphone, BarChart3, PieChart, MousePointer2, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Pie, Cell } from 'recharts';
import { collection, getDocs, query, orderBy, limit, addDoc, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function DataAdmin() {
    const [bundles, setBundles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', size: '', validity: '30 Days', type: '4G' });
    const [saving, setSaving] = useState(false);

    const [merchantNumber, setMerchantNumber] = useState('61xxxxxxx');

    // Promo State
    const [promo, setPromo] = useState({ active: false, title: '', message: '', gradient: 'from-blue-600 to-indigo-600' });
    const [showPromoConfig, setShowPromoConfig] = useState(false);

    // Analytics State
    const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'insights'
    const [stats, setStats] = useState({ totalClicks: 0, todayClicks: 0, topBranch: 'N/A' });
    const [chartData, setChartData] = useState({ byBranch: [], byRole: [], byHour: [] });

    useEffect(() => {
        fetchBundles();
        loadSettings();
    }, []);

    // Also fetch analytics when tab changes to insights
    useEffect(() => {
        if (activeTab === 'insights') {
            fetchAnalytics();
        }
    }, [activeTab]);

    const fetchBundles = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'data_bundles'), orderBy('price', 'asc'));

            let data = [];
            try {
                const querySnapshot = await getDocs(q);
                data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                // Fallback if sorting fails (index missing)
                const querySnapshot = await getDocs(collection(db, 'data_bundles'));
                data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => a.price - b.price);
            }

            setBundles(data || []);
        } catch (error) {
            console.error("Error fetching bundles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSettings = () => {
        const savedNum = localStorage.getItem('beco_merchant_number');
        if (savedNum) setMerchantNumber(savedNum);

        const savedPromo = localStorage.getItem('beco_data_promo');
        if (savedPromo) setPromo(JSON.parse(savedPromo));
    };

    const fetchAnalytics = async () => {
        try {
            // Fetch logs for 'data_bundle_click'
            // We limit to last 500
            const q = query(
                collection(db, 'activity_logs'),
                where('action_type', '==', 'data_bundle_click'),
                orderBy('created_at', 'desc'), // Assuming created_at vs timestamp based on migration consistency
                limit(500)
            );

            // Note: If 'timestamp' was used in Supabase, we should check what we used in DataBundles.jsx.
            // In DataBundles.jsx I used `created_at: new Date().toISOString()`.
            // So I should use 'created_at'.
            // If the query fails due to index, I might need to remove orderBy server-side.

            let logs = [];
            try {
                const querySnapshot = await getDocs(q);
                logs = querySnapshot.docs.map(doc => doc.data());
            } catch (err) {
                // Fallback without sort if index missing
                const q2 = query(
                    collection(db, 'activity_logs'),
                    where('action_type', '==', 'data_bundle_click'),
                    limit(500)
                );
                const querySnapshot = await getDocs(q2);
                logs = querySnapshot.docs.map(doc => doc.data());
                // Client side sort if needed, but not strictly required for aggregates except hour?
                // Actually aggregates need correct time.
            }

            processAnalytics(logs || []);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        }
    };

    const processAnalytics = (logs) => {
        if (!Array.isArray(logs)) return;

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();

        let total = logs.length;
        let today = 0;
        const branchCounts = {};
        const roleCounts = {};
        const hourCounts = {};

        logs.forEach(log => {
            // Check created_at or timestamp
            const timeField = log.created_at || log.timestamp;
            if (!timeField) return;

            const ts = new Date(timeField).getTime();
            if (ts >= startOfDay) today++;

            // Branch Stats
            const b = log.details?.branch || 'General';
            branchCounts[b] = (branchCounts[b] || 0) + 1;

            // Role Stats
            const r = log.details?.userRole || 'User';
            roleCounts[r] = (roleCounts[r] || 0) + 1;

            // Hour Stats
            const h = new Date(timeField).getHours();
            hourCounts[h] = (hourCounts[h] || 0) + 1;
        });

        // Top Branch
        let maxB = 0;
        let topB = 'N/A';
        Object.entries(branchCounts).forEach(([k, v]) => {
            if (v > maxB) { maxB = v; topB = k; }
        });

        // Chart Formats
        const byBranch = Object.entries(branchCounts).map(([name, value]) => ({ name, value }));
        const byRole = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
        const byHour = Object.entries(hourCounts).map(([name, value]) => ({ name: `${name}:00`, value })).sort((a, b) => parseInt(a.name) - parseInt(b.name));

        setStats({ totalClicks: total, todayClicks: today, topBranch: topB === 'unknown' ? 'General' : topB });
        setChartData({ byBranch, byRole, byHour });
    };

    const savePromo = () => {
        localStorage.setItem('beco_data_promo', JSON.stringify(promo));
        alert('Promo Updated!');
    };

    const updateMerchantNumber = () => {
        localStorage.setItem('beco_merchant_number', merchantNumber);
        alert("Merchant Number Updated!");
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.size) return alert("Please fill details");
        setSaving(true);

        try {
            const payload = {
                ...formData,
                price: Number(formData.price)
            };

            if (editingId) {
                const bundleRef = doc(db, 'data_bundles', editingId);
                await updateDoc(bundleRef, payload);
            } else {
                await addDoc(collection(db, 'data_bundles'), payload);
            }

            fetchBundles();
            closeModal();
        } catch (error) {
            alert("Error saving: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this bundle?")) {
            try {
                await deleteDoc(doc(db, 'data_bundles', id));
                fetchBundles();
            } catch (error) {
                alert("Error deleting: " + error.message);
            }
        }
    };

    const openEdit = (bundle) => {
        setEditingId(bundle.id);
        setFormData({ ...bundle });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', size: '', validity: '30 Days', type: '4G' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    if (isLoading && bundles.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50">
                <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-stone-50 relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-900 leading-tight">Data Plans</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Database Integrated</p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* TABS */}
            <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'plans' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'} `}
                >
                    Manage Plans
                </button>
                <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'insights' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'} `}
                >
                    Insights & Reports
                </button>
            </div>

            {activeTab === 'plans' ? (
                <>
                    {/* CONFIG SECTION */}
                    <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 mb-6 flex items-end justify-between">
                        <div className="flex-1 mr-4">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Merchant Phone Number</label>
                            <div className="flex items-center bg-gray-50 rounded-xl p-3 border border-gray-100 focus-within:ring-2 ring-gray-900 transition-all">
                                <Settings size={18} className="text-gray-400 mr-2" />
                                <input
                                    value={merchantNumber}
                                    onChange={(e) => setMerchantNumber(e.target.value)}
                                    className="bg-transparent font-bold text-gray-900 w-full outline-none"
                                    placeholder="61xxxxxxx"
                                />
                            </div>
                        </div>
                        <button
                            onClick={updateMerchantNumber}
                            className="bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
                        >
                            Update
                        </button>
                    </div>

                    {/* PROMO CONFIG SECTON */}
                    <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 mb-6">
                        <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => setShowPromoConfig(!showPromoConfig)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-xl ${promo.active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'} `}>
                                    <Megaphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">Bundle Promo Banner</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{promo.active ? 'Currently Active' : 'Disabled'}</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${promo.active ? 'bg-green-500' : 'bg-gray-200'} `}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${promo.active ? 'translate-x-6' : ''} `}></div>
                            </div>
                        </div>

                        {showPromoConfig && (
                            <div className="mt-6 space-y-4 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-1">Status</label>
                                        <button
                                            onClick={() => setPromo({ ...promo, active: !promo.active })}
                                            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${promo.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} `}
                                        >
                                            {promo.active ? 'Deactivate Banner' : 'Activate Banner'}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-1">Color Theme</label>
                                        <select
                                            value={promo.gradient}
                                            onChange={(e) => setPromo({ ...promo, gradient: e.target.value })}
                                            className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none"
                                        >
                                            <option value="from-blue-600 to-indigo-600">Blue & Indigo</option>
                                            <option value="from-purple-600 to-pink-600">Purple & Pink</option>
                                            <option value="from-orange-500 to-red-600">Orange & Red</option>
                                            <option value="from-emerald-500 to-teal-600">Emerald & Teal</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-1">Title</label>
                                    <input
                                        value={promo.title}
                                        onChange={(e) => setPromo({ ...promo, title: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-900 outline-none placeholder-gray-300"
                                        placeholder="e.g. 50% OFF TODAY!"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-1">Message Detail</label>
                                    <textarea
                                        value={promo.message}
                                        onChange={(e) => setPromo({ ...promo, message: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-900 outline-none placeholder-gray-300 min-h-[80px]"
                                        placeholder="e.g. Get double data on all weekly bundles..."
                                    />
                                </div>

                                <button
                                    onClick={savePromo}
                                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {bundles.map(bundle => (
                            <div key={bundle.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                        {bundle.type === '5G' ? <Wifi size={24} /> : <Smartphone size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{bundle.name}</h3>
                                        <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{bundle.size}</span>
                                            <span>•</span>
                                            <span>{bundle.validity}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="font-black text-gray-900 text-lg">${bundle.price}</span>
                                    <div className="flex space-x-1">
                                        <button onClick={() => openEdit(bundle)} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(bundle.id)} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* INSIGHTS TAB DASHBOARD */
                <div className="space-y-6 animate-in slide-in-from-right duration-300">

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Clicks</p>
                            <h3 className="text-2xl font-black text-blue-600">{stats.totalClicks}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Today</p>
                            <h3 className="text-2xl font-black text-green-600">{stats.todayClicks}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Top Branch</p>
                            <h3 className="text-xl font-black text-purple-600 truncate">{stats.topBranch}</h3>
                        </div>
                    </div>

                    {/* CHART 1: Branch Performance */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <BarChart3 size={18} className="mr-2 text-gray-400" /> Clicks by Branch
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.byBranch} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 4, 4]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CHART 2: User Types */}
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                <PieChart size={18} className="mr-2 text-gray-400" /> User Role Split
                            </h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.byRole} layout="vertical" barSize={20}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* CHART 3: Hourly Trend */}
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                <MousePointer2 size={18} className="mr-2 text-gray-400" /> Hourly Activity
                            </h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.byHour} barSize={10}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 4, 4]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">{editingId ? 'Edit Plan' : 'New Plan'}</h2>
                            <button onClick={closeModal}><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Plan Name</label>
                                <input
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 focus:ring-2 ring-gray-900 outline-none" placeholder="e.g. Super Weekly"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Price ($)</label>
                                    <input
                                        type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 focus:ring-2 ring-gray-900 outline-none" placeholder="10"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data Size</label>
                                    <input
                                        value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })}
                                        className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 focus:ring-2 ring-gray-900 outline-none" placeholder="10GB"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Validity</label>
                                    <select
                                        value={formData.validity} onChange={e => setFormData({ ...formData, validity: e.target.value })}
                                        className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 outline-none appearance-none"
                                    >
                                        <option>Daily</option>
                                        <option>7 Days</option>
                                        <option>30 Days</option>
                                        <option>Unlimited</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Type</label>
                                    <select
                                        value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 outline-none appearance-none"
                                    >
                                        <option>4G</option>
                                        <option>5G</option>
                                        <option>Home WiFi</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl mt-4 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
