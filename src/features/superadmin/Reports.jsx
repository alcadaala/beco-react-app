import { useState, useEffect } from 'react';
import { FileBarChart, Download, Filter, Calendar, ChevronDown, Activity, AlertCircle, DollarSign, Users, Search, Sparkles, X, MessageSquare, Send, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';

export default function Reports() {
    const [selectedReportType, setSelectedReportType] = useState('All');
    const [isAiOpen, setIsAiOpen] = useState(false);

    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, uniqueUsers: 0, topBranch: 'N/A' });

    useEffect(() => {
        loadAnalytics();
        // Real-time subscription could be added here later
        const interval = setInterval(loadAnalytics, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, []);

    const loadAnalytics = async () => {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(500); // Limit for view

            if (error) throw error;

            setLogs(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error("Error loading reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (saved) => {
        const total = saved.length;
        const users = new Set(saved.map(l => l.user_id)); // DB column

        const branches = {};
        saved.forEach(l => {
            const b = l.details?.branch || 'General';
            branches[b] = (branches[b] || 0) + 1;
        });

        let topB = 'N/A';
        let maxB = 0;
        Object.entries(branches).forEach(([k, v]) => {
            if (v > maxB) { maxB = v; topB = k; }
        });

        setStats({ total, uniqueUsers: users.size, topBranch: topB === 'unknown' ? 'General' : topB });
    };

    const clearHistory = async () => {
        if (confirm("Clear all analytics history? This cannot be undone.")) {
            try {
                // DELETE logic - be careful, maybe just soft delete or only older than X
                // For now, allow admin to delete everything if requested
                const { error } = await supabase.from('activity_logs').delete().neq('id', 0); // Hack to delete all
                if (error) throw error;
                loadAnalytics();
            } catch (error) {
                alert("Error clearing history: " + error.message);
            }
        }
    };

    const filteredLogs = logs.filter(log => {
        if (selectedReportType === 'All') return true;
        if (selectedReportType === 'Operational') return log.action_type === 'data_bundle_click';
        return true;
    });

    if (isLoading && logs.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50">
                <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-stone-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-900 leading-tight">System Reports</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Audit & Analysis</p>
                </div>
                <button className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg shadow-gray-200">
                    <Download size={20} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setIsAiOpen(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 flex items-center space-x-2 animate-pulse"
                >
                    <Sparkles size={14} />
                    <span>Ask AI Insight</span>
                </button>
                {['All', 'Operational'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedReportType(type)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${selectedReportType === type ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-100'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle size={16} className="text-red-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Total Events</span>
                    </div>
                    <span className="text-2xl font-black text-gray-900">{stats.total}</span>
                    <span className="text-[10px] font-bold text-red-400 block mt-1">Live Tracking</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Activity size={16} className="text-green-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Unique Users</span>
                    </div>
                    <span className="text-2xl font-black text-gray-900">{stats.uniqueUsers}</span>
                    <span className="text-[10px] font-bold text-gray-400 block mt-1">Top Branch: {stats.topBranch}</span>
                </div>
            </div>

            {/* Detailed Log Table */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm">Action Log</h3>
                    <div className="flex items-center space-x-2 text-gray-400">
                        <Filter size={14} />
                        <span className="text-xs font-bold">Filter</span>
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-xs font-bold text-gray-400">No activity logs found for this filter.</div>
                    ) : (
                        filteredLogs.map((log, idx) => (
                            <div key={log.id || idx} className="p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-600">
                                        <Activity size={10} className="mr-1" />
                                        {log.action_type?.replace(/_/g, ' ') || 'Event'}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-xs font-bold text-gray-900 mb-1 leading-relaxed">
                                    {log.user_email || 'User'} performed {log.action_type}
                                    {log.details?.bundleName && ` on ${log.details.bundleName}`}
                                </p>
                                <div className="flex items-center text-[10px] font-medium text-gray-500">
                                    <Users size={12} className="mr-1" />
                                    Branch: {log.details?.branch || 'N/A'} • {log.details?.price ? `$${log.details.price}` : 'No Price'}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button onClick={clearHistory} className="text-xs font-black text-red-600 hover:text-red-700 transition-colors">
                        Delete All Logs
                    </button>
                </div>
            </div>

            {/* AI CHAT MODAL */}
            {isAiOpen && (
                <ReportAIChat
                    onClose={() => setIsAiOpen(false)}
                    stats={stats}
                    logs={logs}
                />
            )}
        </div>
    );
}

function ReportAIChat({ onClose, stats, logs }) {
    const [messages, setMessages] = useState([
        { role: 'ai', text: `Hello! I have analyzed the data. You have ${stats.total} total events recorded. How can I help you understand this data?` }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // ENHANCED SIMULATED AI LOGIC
        setTimeout(() => {
            let response = "";
            const lowerInput = input.toLowerCase();

            // Helper for robust analysis
            const getTopBundle = () => {
                const bundleCounts = {};
                logs.forEach(l => {
                    if (l.details?.bundleName) {
                        bundleCounts[l.details.bundleName] = (bundleCounts[l.details.bundleName] || 0) + 1;
                    }
                });
                const sorted = Object.entries(bundleCounts).sort((a, b) => b[1] - a[1]);
                return sorted.length > 0 ? `${sorted[0][0]} (${sorted[0][1]} sales)` : "No bundles yet";
            };

            const getBranchesStatus = () => {
                const branchCounts = {};
                logs.forEach(l => {
                    const b = l.details?.branch || 'Unknown';
                    branchCounts[b] = (branchCounts[b] || 0) + 1;
                });
                return Object.entries(branchCounts).map(([k, v]) => `${k}: ${v}`).join(', ');
            };

            // Logic Tree
            if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                response = "Hello! I am ready to analyze your data. You can ask about sales, branches, or top bundles.";
            }
            else if (lowerInput.includes('best') || lowerInput.includes('popular') || lowerInput.includes('top bundle')) {
                response = `The most popular data bundle is: ${getTopBundle()}.`;
            }
            else if (lowerInput.includes('branch') || lowerInput.includes('where')) {
                if (lowerInput.includes('list') || lowerInput.includes('all')) {
                    response = `Here is the activity breakdown by branch: ${getBranchesStatus() || "No data yet"}.`;
                } else {
                    response = `The top performing branch is ${stats.topBranch}. Use keywords like "all branches" to see a full list.`;
                }
            }
            else if (lowerInput.includes('revenue') || lowerInput.includes('money') || lowerInput.includes('total') || lowerInput.includes('sales')) {
                const totalRev = logs.reduce((sum, l) => sum + (l.details?.price || 0), 0);
                const avgPrice = logs.length > 0 ? (totalRev / logs.length).toFixed(2) : 0;
                response = `Total estimated revenue from recorded events is $${totalRev}. The average transaction value is $${avgPrice}.`;
            }
            else if (lowerInput.includes('summary') || lowerInput.includes('report') || lowerInput.includes('overview')) {
                response = `Executive Summary:\n- Total Events: ${stats.total}\n- Active Users: ${stats.uniqueUsers}\n- Top Branch: ${stats.topBranch}\n- Most Popular: ${getTopBundle()}`;
            }
            else if (lowerInput.includes('user') || lowerInput.includes('staff')) {
                response = `There are ${stats.uniqueUsers} unique users active recently.`;
            }
            else {
                response = "I can analyze the following for you:\n1. Top Selling Bundles\n2. Branch Performance\n3. Revenue Estimates\n4. Staff Activity\n5. General Summary";
            }

            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        }, 800);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="bg-white w-full max-w-md h-[500px] flex flex-col rounded-3xl shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Beco AI Analyst</h3>
                            <p className="text-[10px] text-green-600 font-bold flex items-center">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" /> Online
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} className="text-gray-400" /></button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${m.role === 'user'
                                ? 'bg-gray-900 text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-full border border-gray-200">
                        <input
                            className="flex-1 bg-transparent px-3 py-2 text-sm font-medium outline-none text-gray-800 placeholder-gray-400"
                            placeholder="Ask about your data..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={handleSend}
                            className="p-2 bg-blue-600 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
