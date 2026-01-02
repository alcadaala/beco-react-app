import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, PieChart, Search, List, Download, Target, Trophy, Award, Medal, Crown, Clock, Phone, ShieldCheck, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Billing() {
    const navigate = useNavigate();
    const [analysis, setAnalysis] = useState([]);
    const [loading, setLoading] = useState(true);

    // Data
    const [allCustomers, setAllCustomers] = useState([]);

    // Query Engine State
    const [queryAmount, setQueryAmount] = useState(100);
    const [queryType, setQueryType] = useState('more'); // 'more', 'less', 'equal'
    const [queryCategory, setQueryCategory] = useState('active'); // 'all', 'active', 'balan', 'paid'
    const [queryField, setQueryField] = useState('balance'); // 'balance', 'prev', 'total'
    const [queryResults, setQueryResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Daily Stats
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyStats, setDailyStats] = useState({
        timeSpent: '0h 0m',
        calls: 0,
        paidCount: 0,
        revenue: 0
    });

    // LOAD DATA
    const fetchData = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('beco_current_user');
            const user = userStr ? JSON.parse(userStr) : null;

            let rawCustomers = [];

            // 1. Try Local Storage (Primary Source of Truth from Baafiye)
            const localData = localStorage.getItem('baafiye_local_data');
            if (localData) {
                rawCustomers = JSON.parse(localData);
            }
            // 2. Fallback to Firestore (Same logic as Baafiye)
            else if (user) {
                const zone = user.branch || 'General';
                // Query Zone Data
                const q = query(
                    collection(db, 'zones', zone, 'customers'),
                    where('collector_id', '==', user.id)
                );
                const snapshot = await getDocs(q);
                rawCustomers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Legacy Fallback if Zone is empty & General
                if (rawCustomers.length === 0 && zone === 'General') {
                    const legacyQ = query(collection(db, 'customers'), where('collector_id', '==', user.id));
                    const legacySnap = await getDocs(legacyQ);
                    if (!legacySnap.empty) {
                        rawCustomers = legacySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    }
                }
            }

            if (rawCustomers) {
                // Process Data (Convert potential strings to numbers if needed)
                const processed = rawCustomers.map(c => {
                    const valClean = String(c.balance || '0').replace(/[^0-9.-]+/g, "");
                    const prevClean = String(c.prev || c.prev_balance || '0').replace(/[^0-9.-]+/g, "");
                    const totalClean = String(c.total || '0').replace(/[^0-9.-]+/g, "");

                    return {
                        ...c,
                        numericBalance: parseFloat(valClean || 0),
                        numericPrev: parseFloat(prevClean || 0),
                        numericTotal: parseFloat(totalClean || 0)
                    };
                });
                setAllCustomers(processed);

                // --- CHART ANALYSIS ---
                const activeDebt = processed.filter(c => c.status !== 'Paid');
                let base = 0, standard = 0, high = 0, critical = 0;
                activeDebt.forEach(c => {
                    const bal = c.numericBalance;
                    if (bal < 4.5) base++;
                    else if (bal >= 4.5 && bal < 50) standard++;
                    else if (bal >= 50 && bal <= 100) high++;
                    else if (bal > 100) critical++;
                });

                setAnalysis([
                    { name: 'Base (<$4.5)', count: base, fill: '#9ca3af' },
                    { name: 'Standard ($4.5-$50)', count: standard, fill: '#60a5fa' },
                    { name: 'High ($50-$100)', count: high, fill: '#6366f1' },
                    { name: 'Critical (>$100)', count: critical, fill: '#f43f5e' }
                ]);
            }

            // Fetch Daily Stats (Logs)
            if (user) {
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);

                const logsQuery = query(
                    collection(db, 'activity_logs'),
                    where('user_id', '==', user.id),
                    where('created_at', '>=', startOfDay.toISOString()),
                    where('created_at', '<=', endOfDay.toISOString())
                );

                const logsSnapshot = await getDocs(logsQuery);
                const logs = logsSnapshot.docs.map(d => d.data());

                const calls = logs.filter(l => l.action_type === 'call').length || 0;

                // Revenue Calculation (Client-side from customers list for now)
                const dateQuery = new Date(selectedDate).toDateString();
                const paidCustomers = (rawCustomers || []).filter(c => {
                    if (c.status !== 'Paid') return false;
                    const pDate = c.paidDate || c.date;
                    if (!pDate) return false;
                    const d = new Date(pDate);
                    return !isNaN(d.getTime()) && d.toDateString() === dateQuery;
                });

                const revenue = paidCustomers.reduce((acc, c) => {
                    const val = parseFloat(String(c.balance).replace(/[^0-9.-]+/g, "") || 0);
                    return acc + val;
                }, 0);

                setDailyStats(prev => ({
                    ...prev,
                    calls,
                    paidCount: paidCustomers.length,
                    revenue
                }));
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    // Local Storage for Time Spent (Session based)
    useEffect(() => {
        const userStr = localStorage.getItem('beco_current_user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user) {
            const dateQuery = new Date(selectedDate).toDateString();
            const storageKey = `activeSeconds_${user.id}_${dateQuery}`;
            const totalSecs = parseInt(localStorage.getItem(storageKey) || '0');
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            setDailyStats(prev => ({ ...prev, timeSpent: `${hrs}h ${mins}m` }));
        }
    }, [selectedDate]);

    const runAnalysis = () => {
        if (!allCustomers.length) return;

        const results = allCustomers.filter(c => {
            // 1. Filter by Category
            if (queryCategory === 'active' && c.status === 'Paid') return false;
            if (queryCategory === 'paid' && c.status !== 'Paid') return false;
            if (queryCategory === 'balan' && c.status !== 'Balan') return false;

            // 2. Filter by Amount on Selected Field
            let valueToCheck = c.numericBalance;
            if (queryField === 'prev') valueToCheck = c.numericPrev;
            if (queryField === 'total') valueToCheck = c.numericTotal;

            const target = parseFloat(queryAmount);

            if (queryType === 'more') return valueToCheck > target;
            if (queryType === 'less') return valueToCheck < target;
            if (queryType === 'equal') return Math.abs(valueToCheck - target) < 0.01;
            return false;
        });

        // Sort results by selected field desc
        results.sort((a, b) => {
            let valA = a.numericBalance;
            let valB = b.numericBalance;
            if (queryField === 'prev') { valA = a.numericPrev; valB = b.numericPrev; }
            if (queryField === 'total') { valA = a.numericTotal; valB = b.numericTotal; }
            return valB - valA;
        });

        setQueryResults(results);
        setShowResults(true);
    };

    const exportData = () => {
        const dataToExport = showResults && queryResults.length > 0 ? queryResults : allCustomers;
        if (dataToExport.length === 0) return;

        const headers = ["SQN", "Name", "Phone", "Status", "Balance", "Date"];
        const csvRows = [];
        csvRows.push(headers.join(","));

        dataToExport.forEach(c => {
            const row = [
                `"${c.sqn || ''}"`,
                `"${c.name || ''}"`,
                `"${c.tell || ''}"`,
                `"${c.status || ''}"`,
                `"${c.numericBalance.toFixed(2)}"`,
                `"${c.date || ''}"`
            ];
            csvRows.push(row.join(","));
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-100 sticky top-0 z-10 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => navigate('/services')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Analysis Tool</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
                    <button
                        onClick={exportData}
                        className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform"
                    >
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto space-y-6">

                {/* DAILY SUMMARY CARD */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-white mb-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 opacity-20 rounded-full translate-y-1/3 -translate-x-1/3 blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-black mb-1 flex items-center">
                                    <Crown className="mr-2 text-yellow-300" size={20} />
                                    Daily Summary
                                </h2>
                                <p className="text-indigo-200 text-xs font-medium">Warbixinta shaqada maanta</p>
                            </div>
                            <input
                                type="date"
                                value={selectedDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-white/50 shadow-sm cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex flex-col items-center text-center">
                                <Clock size={16} className="text-indigo-200 mb-2" />
                                <h3 className="font-black text-xl mb-0.5">{dailyStats.timeSpent}</h3>
                                <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Shaqeeyay</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex flex-col items-center text-center">
                                <Phone size={16} className="text-blue-200 mb-2" />
                                <h3 className="font-black text-xl mb-0.5">{dailyStats.calls}</h3>
                                <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Wacay</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex flex-col items-center text-center">
                                <ShieldCheck size={16} className="text-emerald-200 mb-2" />
                                <h3 className="font-black text-xl mb-0.5">{dailyStats.paidCount}</h3>
                                <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Bixiyay</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs font-medium text-indigo-200">Total Revenue Collected</span>
                            <span className="text-2xl font-black text-white tracking-tight">${dailyStats.revenue?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>

                {/* QUERY ENGINE */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <Search size={20} className="mr-2 text-indigo-600" /> Data Explorer
                        </h2>
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                            Analyze
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1.5 block">1. Select Segment & Field</label>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <select
                                        value={queryCategory}
                                        onChange={(e) => setQueryCategory(e.target.value)}
                                        className="w-full bg-white border text-sm font-bold border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="active">Active</option>
                                        <option value="balan">Balan</option>
                                        <option value="paid">Paid</option>
                                    </select>

                                    <select
                                        value={queryField}
                                        onChange={(e) => setQueryField(e.target.value)}
                                        className="w-full bg-white border text-sm font-bold border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                    >
                                        <option value="balance">Balance</option>
                                        <option value="prev">Prev</option>
                                        <option value="total">Total</option>
                                    </select>
                                </div>

                                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1.5 block">2. Filter by Amount</label>
                                <div className="flex gap-2">
                                    <select
                                        value={queryType}
                                        onChange={(e) => setQueryType(e.target.value)}
                                        className="bg-white border text-sm font-bold border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                    >
                                        <option value="more">More than (&gt;)</option>
                                        <option value="less">Less than (&lt;)</option>
                                        <option value="equal">Exactly (=)</option>
                                    </select>
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={queryAmount}
                                            onChange={(e) => setQueryAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={runAnalysis}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center"
                            >
                                <List size={18} className="mr-2" />
                                Show Matching Customers
                            </button>
                        </div>

                        {showResults && (
                            <div className="animate-in fade-in slide-in-from-top-4">
                                <div className="flex justify-between items-center mb-3 mt-6 border-b border-gray-100 pb-2">
                                    <h3 className="font-bold text-gray-900">Results</h3>
                                    <span className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-md">
                                        {queryResults.length} Found
                                    </span>
                                </div>

                                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {queryResults.length > 0 ? (
                                        queryResults.map((c, i) => (
                                            <div key={i} className={`flex justify-between items-center p-3 bg-white border rounded-xl transition-colors shadow-sm ${c.numericPrev >= 3 ? 'border-red-200 bg-red-50/50' : 'border-gray-100 hover:border-indigo-200'}`}>
                                                <div>
                                                    <div className="flex items-center">
                                                        <p className="text-sm font-bold text-gray-900 leading-tight mr-2">{c.name}</p>
                                                        {c.numericPrev >= 3 && (
                                                            <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse"></span>
                                                                High Risk
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{c.sqn}</span>
                                                        <span className="text-[10px] text-gray-400">{c.tell || c.phone}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-sm font-black text-indigo-600">${c.numericBalance.toFixed(2)}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1 rounded">{c.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 text-sm italic">
                                            No customers found matching this criteria.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* OVERVIEW */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                        <PieChart size={18} className="mr-2 text-blue-500" /> Balance Distribution
                    </h3>
                    <div className="h-48 w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analysis} barSize={40}>
                                <XAxis dataKey="name" tick={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6', radius: 6 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" radius={[6, 6, 6, 6]}>
                                    {analysis.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {analysis.map((item) => (
                            <div key={item.name} className="bg-gray-50 rounded-xl p-3 border border-gray-100 group hover:border-blue-200 transition-colors">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 truncate">{item.name.split(' (')[0]}</span>
                                <div className="flex items-center space-x-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                    <span className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
