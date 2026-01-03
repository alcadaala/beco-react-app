import { useState, useEffect } from 'react';
import { MoreHorizontal, Search, Filter, CheckCircle2, Clock, AlertTriangle, FileText, Activity, X, ChevronRight, ChevronDown, Plus, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { collection, query, where, getDocs, orderBy, limit, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Helper for safe time display
const safeTime = (dateStr) => {
    try {
        const d = new Date(dateStr || Date.now());
        if (isNaN(d.getTime())) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '00:00';
    }
};

export default function Tasks() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskData, setNewTaskData] = useState({ name: '', sqn: '', note: '', status: 'Pending', issue: 'Process', kwt: '', assignedSupervisor: '' });

    // Customer Search State
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [availableCustomers, setAvailableCustomers] = useState([]); // Loaded for search

    // Tasks State
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Context Data
    const currentUser = JSON.parse(localStorage.getItem('beco_current_user') || 'null');

    // FETCH TASKS
    const fetchTasks = async () => {
        if (!currentUser || !currentUser.id) return;

        try {
            setLoading(true);
            // 1. ISOLATION: Filter by user_id
            // 2. SORTING: Sort client-side to avoid complex index requirements on 'user_id' + 'created_at'
            const q = query(
                collection(db, 'tickets'),
                where('user_id', '==', currentUser.id)
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Sort by Created At Descending (Newest First)
            data.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });

            setTasks(data);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            // Redundant fallback removed as the main query is now simple enough
        } finally {
            setLoading(false);
        }
    };

    // SEARCH CUSTOMERS (Local Context + Zone Fallback)
    // SEARCH CUSTOMERS (Strict Local Baafiye Data Only)
    const searchCustomers = async (term) => {
        if (!term) return;
        const lowerTerm = term.toLowerCase();
        let results = [];

        // STRICT: Only search LOCAL BAAFIYE DATA (active list) to avoid "old data" from server
        try {
            const localData = localStorage.getItem('baafiye_local_data');
            if (localData) {
                const parsed = JSON.parse(localData);
                const matches = parsed.filter(c =>
                    (c.name && c.name.toLowerCase().includes(lowerTerm)) ||
                    (c.sqn && String(c.sqn).includes(lowerTerm))
                ).slice(0, 10);

                results = [...matches];
            }
        } catch (e) {
            console.error("Local search error", e);
        }

        setAvailableCustomers(results);
    };



    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (customerSearch.length > 2) searchCustomers(customerSearch);
            else if (customerSearch.length > 0 && !isNaN(customerSearch)) searchCustomers(customerSearch); // Allow short SQN search
            else setAvailableCustomers([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [customerSearch]);

    useEffect(() => {
        fetchTasks();
    }, [currentUser?.id]);

    const updateTask = async (taskId, updates) => {
        // Optimistic Update
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
        );
        setTasks(updatedTasks);

        try {
            const taskRef = doc(db, 'tickets', taskId);
            await updateDoc(taskRef, {
                ...updates,
                updated_at: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error updating task:", e);
            // Revert? fetchTasks();
        }
    };

    const handleAddTask = async () => {
        if (!newTaskData.name || !newTaskData.sqn) return;

        try {
            const userStr = localStorage.getItem('beco_current_user');
            const user = userStr ? JSON.parse(userStr) : null;

            const newTicket = {
                user_id: user ? user.id : null,
                customer_sqn: newTaskData.sqn,
                customer_name: newTaskData.name,
                status: newTaskData.status,
                issue: newTaskData.issue,
                note: newTaskData.note,
                kwt: newTaskData.kwt,
                assigned_supervisor: newTaskData.assignedSupervisor,
                created_at: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'tickets'), newTicket);
            const savedTicket = { id: docRef.id, ...newTicket };

            setTasks([savedTicket, ...tasks]);

            setShowAddTask(false);
            setNewTaskData({ name: '', sqn: '', note: '', status: 'Pending', issue: 'Process', kwt: '', assignedSupervisor: '' });
        } catch (e) {
            console.error("Error creating task:", e);
            alert("Failed to create ticket");
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (!task) return false;
        const cName = task.customer_name || '';
        const cSqn = task.customer_sqn || '';
        const tName = task.name || ''; // Legacy fallback

        const term = searchTerm.toLowerCase();
        const matchesSearch = cName.toLowerCase().includes(term) || cSqn.includes(term) || tName.toLowerCase().includes(term);

        if (activeTab === 'All') return matchesSearch;
        if (activeTab === 'Pending') return matchesSearch && (!task.issue || task.issue === 'Process');
        if (activeTab === 'Solving') return matchesSearch && task.issue === 'Solve';
        if (activeTab === 'Done') return matchesSearch && task.issue === 'Done';

        return matchesSearch;
    });

    const allSupervisors = ['Supervisor 1', 'Supervisor 2'];

    return (
        <div className="flex flex-col h-full bg-gray-50/50 pb-24 min-h-screen font-sans">
            {/* Header Area */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-4 border-b border-indigo-500/30 sticky top-0 z-10 shadow-lg">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Task Board</h1>
                        <div className="flex items-center space-x-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <p className="text-xs text-indigo-100 font-bold uppercase tracking-wide">
                                {filteredTasks.length} Issues Active
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddTask(true)}
                        className="h-11 w-11 bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/20 active:scale-90 transition-all hover:bg-white/20 backdrop-blur-sm border border-white/10"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex space-x-3 mb-5">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-200 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Name or SQN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/10 hover:bg-white/20 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/20 transition-all shadow-inner border border-white/5 backdrop-blur-sm"
                        />
                    </div>
                    <button onClick={fetchTasks} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-white transition-colors border border-white/10 active:scale-95 backdrop-blur-sm">
                        <Filter size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-black/20 rounded-2xl overflow-x-auto no-scrollbar border border-white/5 backdrop-blur-md">
                    {['All', 'Pending', 'Solving', 'Done'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 text-xs font-black rounded-xl transition-all duration-300 relative z-0",
                                activeTab === tab
                                    ? "bg-white text-blue-600 shadow-lg scale-[1.02]"
                                    : "text-indigo-200 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab === 'All' ? 'All Tasks' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List */}
            <div className="p-5 space-y-4">
                {loading ? (
                    <div className="text-center py-10"><div className="animate-spin h-8 w-8 border-2 border-indigo-600 rounded-full border-t-transparent mx-auto"></div></div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center justify-center opacity-60">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900">No Tickets Found</h3>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onUpdate={(updates) => updateTask(task.id, updates)}
                            // Passing mock list for now to keep UI working without full branch context
                            branchSupervisors={[{ id: 'sup1', name: 'Supervisor 1' }, { id: 'sup2', name: 'Supervisor 2' }]}
                        />
                    ))
                )}
            </div>

            {/* Add Task Modal */}
            {showAddTask && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddTask(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 relative z-10 animate-in slide-in-from-bottom-5 duration-300 shadow-2xl ring-1 ring-black/5">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">New Issue</h2>
                                <p className="text-xs font-bold text-gray-400">Create a ticket for a customer</p>
                            </div>
                            <button onClick={() => setShowAddTask(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div className="relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Find Customer</label>
                                <div className="relative group">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by Name or SQN..."
                                        value={customerSearch}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerList(true);
                                        }}
                                        className="w-full pl-11 pr-10 py-4 bg-gray-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                    {newTaskData.name && customerSearch && (
                                        <button
                                            onClick={() => {
                                                setNewTaskData({ ...newTaskData, name: '', sqn: '' });
                                                setCustomerSearch('');
                                                setAvailableCustomers([]);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                {showCustomerList && availableCustomers.length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto animate-in slide-in-from-top-2">
                                        {availableCustomers.map(c => (
                                            <button
                                                key={c.sqn}
                                                onClick={() => {
                                                    setNewTaskData({ ...newTaskData, name: c.name, sqn: String(c.sqn) });
                                                    setCustomerSearch(`${c.name} (${c.sqn})`);
                                                    setShowCustomerList(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center group transition-colors"
                                            >
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">{c.name}</p>
                                                    <p className="text-xs text-gray-400 font-mono">SQN: {c.sqn}</p>
                                                </div>
                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Manual Name Fallback */}
                            {!newTaskData.sqn && (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Or Manual Name</label>
                                    <input
                                        type="text"
                                        value={newTaskData.name}
                                        onChange={(e) => setNewTaskData({ ...newTaskData, name: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
                                        placeholder="e.g. Faadumo Cali"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Issue Type</label>
                                <div className="relative">
                                    <select
                                        value={newTaskData.status}
                                        onChange={(e) => setNewTaskData({ ...newTaskData, status: e.target.value })}
                                        className="w-full p-4 pl-4 pr-10 bg-gray-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none transition-all"
                                    >
                                        <option value="Pending">Pending (Generic)</option>
                                        <option value="Kiro Suge">Kiro Suge (Tenant Wait)</option>
                                        <option value="Unpaid">Unpaid / Refused</option>
                                        <option value="Cabasho Farsamo">Technical Complaint</option>
                                        <option value="Cabasho Lacag">Billing Complaint</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={16} strokeWidth={2.5} />
                                    </div>
                                </div>
                            </div>

                            {newTaskData.status === 'Kiro Suge' && (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-wider ml-1 mb-1 block">KWT Reading</label>
                                    <input
                                        type="number"
                                        value={newTaskData.kwt}
                                        onChange={(e) => setNewTaskData({ ...newTaskData, kwt: e.target.value })}
                                        className="w-full p-4 bg-red-50 text-red-900 border border-red-100 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-red-100"
                                        placeholder="0"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Details</label>
                                <textarea
                                    value={newTaskData.note}
                                    onChange={(e) => setNewTaskData({ ...newTaskData, note: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl font-medium text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100 min-h-[100px] resize-none transition-all"
                                    placeholder="Describe the issue concisely..."
                                />
                            </div>

                            <button
                                onClick={handleAddTask}
                                className="w-full py-4 bg-black text-white font-black text-sm uppercase tracking-wide rounded-2xl shadow-xl shadow-gray-200 active:scale-95 transition-all hover:bg-gray-800 flex items-center justify-center space-x-2"
                            >
                                <Plus size={18} />
                                <span>Create Ticket</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskCard({ task, onUpdate, branchSupervisors = [] }) {
    const assignedSup = task.assigned_supervisor || '';
    const status = task.status || 'Pending';
    const issue = task.issue || 'Process';
    const name = task.customer_name || task.name || 'Unknown';
    const sqn = task.customer_sqn || task.sqn || '---';

    const isCritical = status === 'Unpaid' || status.includes('Cabasho');
    const isDone = issue === 'Done';

    // Status Colors (Premium Palette)
    const getStatusStyle = (s) => {
        if (s === 'Unpaid') return 'bg-red-50 text-red-600 border-red-100';
        if (s === 'Kiro Suge') return 'bg-purple-50 text-purple-600 border-purple-100';
        if (s.includes('Cabasho')) return 'bg-orange-50 text-orange-600 border-orange-100';
        return 'bg-blue-50 text-blue-600 border-blue-100'; // Default / Pending
    };

    const getIssueStyle = (i) => {
        if (i === 'Done') return 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-200 shadow-md';
        if (i === 'Solve') return 'bg-blue-500 text-white border-blue-500 shadow-blue-200 shadow-md';
        return 'bg-gray-100 text-gray-500 border-gray-200';
    };

    return (
        <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 relative overflow-visible group transition-all hover:shadow-md">
            {/* Header: Avatar & Info */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3.5 max-w-[70%]">
                    {/* AVATAR */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm border-2 shrink-0 ${isDone ? 'bg-emerald-50 text-emerald-500 border-emerald-200' :
                        isCritical ? 'bg-red-50 text-red-500 border-red-200' :
                            'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                        {name.charAt(0).toUpperCase()}
                        <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${isDone ? 'bg-emerald-500' : isCritical ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    </div>

                    <div className="min-w-0">
                        <h3 className={`font-black text-gray-900 text-[15px] truncate leading-tight ${isDone ? 'line-through text-gray-400' : ''}`}>{name}</h3>
                        <div className="flex items-center space-x-1.5 mt-1">
                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                SQN: {sqn}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Date & KWT Badge */}
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 flex items-center mb-1">
                        <Clock size={10} className="mr-1" />
                        {safeTime(task.created_at || task.date)}
                    </span>
                    {task.kwt && (
                        <span className="px-2 py-0.5 bg-gray-900 text-white text-[9px] font-bold rounded-lg uppercase tracking-wider">
                            {task.kwt} KWT
                        </span>
                    )}
                </div>
            </div>

            {/* Note Area */}
            {task.note && (
                <div className="bg-gray-50/80 rounded-xl p-3 mb-4 border border-gray-100/50">
                    <p className="text-xs text-gray-600 font-medium italic leading-relaxed line-clamp-2">
                        "{task.note}"
                    </p>
                </div>
            )}

            {/* ACTIONS & CONTROLS */}
            <div className="flex flex-col gap-3 pt-2 border-t border-gray-50">
                <div className="flex gap-2">
                    {/* Status Select */}
                    <div className="relative flex-1">
                        <select
                            value={status}
                            onChange={(e) => onUpdate({ status: e.target.value })}
                            className={cn(
                                "w-full text-[10px] font-black uppercase tracking-wide py-2.5 pl-3 pr-8 rounded-xl appearance-none border focus:outline-none transition-all cursor-pointer",
                                getStatusStyle(status)
                            )}
                        >
                            <option>Pending</option>
                            <option>Kiro Suge</option>
                            <option>Unpaid</option>
                            <option>Cabasho Farsamo</option>
                            <option>Cabasho Lacag</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <ChevronDown size={12} strokeWidth={3} />
                        </div>
                    </div>

                    {/* Issue State Select */}
                    <div className="relative w-28">
                        <select
                            value={issue}
                            onChange={(e) => onUpdate({ issue: e.target.value })}
                            className={cn(
                                "w-full text-[10px] font-black uppercase tracking-wide py-2.5 pl-9 pr-2 rounded-xl appearance-none border focus:outline-none transition-all cursor-pointer text-center",
                                getIssueStyle(issue)
                            )}
                        >
                            <option>Process</option>
                            <option>Solve</option>
                            <option>Done</option>
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/90">
                            {issue === 'Done' ? <CheckCircle2 size={12} strokeWidth={3} /> : <Activity size={12} strokeWidth={3} />}
                        </div>
                    </div>
                </div>

                {/* Supervisor Escalation - Visible if Critical */}
                {isCritical && (
                    <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100 animate-in slide-in-from-top-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                            <AlertTriangle size={14} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 relative">
                            <select
                                value={assignedSup}
                                onChange={(e) => onUpdate({ assigned_supervisor: e.target.value })}
                                className="w-full bg-transparent text-xs font-bold text-red-700 py-1 pr-6 focus:outline-none appearance-none"
                            >
                                <option value="">Escalate to...</option>
                                {branchSupervisors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-red-300 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
