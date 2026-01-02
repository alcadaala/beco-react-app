import { useState, useEffect } from 'react';
import {
    AlertTriangle, UserX, ChevronDown, Phone, CheckCircle,
    AlertCircle, Clock, Search, Filter, Calendar,
    MessageCircle, ArrowRight, MoreHorizontal, Plus, UserPlus, X, Send
} from 'lucide-react';

import { MOCK_TEAM } from '../../lib/mockData';

const safeTime = (dateStr) => {
    try {
        const d = new Date(dateStr || Date.now());
        if (isNaN(d.getTime())) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '00:00';
    }
};

export default function SupervisorTasks() {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [team, setTeam] = useState([]);
    const [selectedZone, setSelectedZone] = useState('All');
    const [activeActionId, setActiveActionId] = useState(null);

    // Modal State
    const [isCreateModalOpen, setIsCreateModal] = useState(false);
    const [newTask, setNewTask] = useState({
        assignedTo: '',
        name: '', // Customer Name
        sqn: '',
        zone: '',
        type: 'Visit', // Visit, Collect, Check
        note: '',
        priority: 'Normal'
    });

    // --- Safe Parse Helper ---
    const safeParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    // --- Load Data ---
    const loadData = () => {
        const user = safeParse('beco_current_user', { name: 'Supervisor' });
        setCurrentUser(user);

        // Load Task List (Show ALL tasks for the branch/supervisor context for now)
        const allTasks = safeParse('beco_tasks', []);

        // Load Team for Dropdown
        // Load Team for Dropdown
        const allBranches = safeParse('beco_branches', []);
        const allUsers = safeParse('beco_users', []);
        let myTeam = [];

        // Find my branch staff
        const myBranch = allBranches.find(b => b.id === user.branchId) ||
            allBranches.find(b => Array.isArray(b.staff) && b.staff.some(s => s.name === user.name));

        // 1. Get Real Users first (Dynamic Signups)
        const realTeam = user.branchId
            ? allUsers.filter(u => u.branchId === user.branchId && u.role === 'Collector')
            : [];

        if (realTeam.length > 0) {
            myTeam = realTeam;
        } else if (myBranch && Array.isArray(myBranch.staff) && myBranch.staff.length > 0) {
            // Fallback to static staff if no real users found
            myTeam = myBranch.staff.filter(s => s.role === 'Collector');
        } else {
            // Use MOCK_TEAM from shared source
            myTeam = MOCK_TEAM;
        }
        setTeam(myTeam);

        // For this view, maybe we want to see tasks *I created* or tasks *Assigned to Me*?
        // Let's show "Tasks Assigned by Me" + "Escalations to Me"
        // For simplicity: Show All Tasks for now.
        setTasks(allTasks.reverse()); // Newest first
        setFilteredTasks(allTasks);
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedZone === 'All') {
            setFilteredTasks(tasks);
        } else {
            setFilteredTasks(tasks.filter(t => t.zone === selectedZone));
        }
    }, [selectedZone, tasks]);

    // --- Create Task Logic ---
    const handleCreateTask = (e) => {
        e.preventDefault();
        if (!newTask.assignedTo || !newTask.name) {
            alert("Please assign a collector and enter a customer name.");
            return;
        }

        const taskEntry = {
            ...newTask,
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'Pending',
            issue: 'Open', // Internal tracking
            assignedSupervisor: currentUser?.name || 'Supervisor',
            createdBy: currentUser?.name || 'Supervisor'
        };

        const existingTasks = safeParse('beco_tasks', []);
        const updatedTasks = [taskEntry, ...existingTasks];
        localStorage.setItem('beco_tasks', JSON.stringify(updatedTasks));

        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
        setIsCreateModal(false);
        setNewTask({
            assignedTo: '', name: '', sqn: '', zone: '', type: 'Visit', note: '', priority: 'Normal'
        });
        alert(`Task assigned to ${newTask.assignedTo}`);
    };

    // Auto-set Zone when Collector is selected
    const handleCollectorChange = (e) => {
        const collectorName = e.target.value;
        const collector = team.find(m => m.name === collectorName);

        setNewTask(prev => ({
            ...prev,
            assignedTo: collectorName,
            zone: collector ? collector.zone : '' // Auto-set zone
        }));
    };

    return (
        <div className="flex flex-col min-h-screen bg-stone-50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100 flex justify-between items-center px-4 py-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Tasks</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase">Assign & Monitor</p>
                </div>

                <button
                    onClick={() => setIsCreateModal(true)}
                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-lg active:scale-95 transition-transform"
                >
                    <Plus size={16} className="mr-1" />
                    New Task
                </button>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-2 flex items-center space-x-2 overflow-x-auto scrollbar-hide">
                <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-600 text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-sm focus:outline-none"
                >
                    <option value="All">All Zones</option>
                    <option value="Waberi">Waberi</option>
                    <option value="Hodan">Hodan</option>
                    <option value="Karaan">Karaan</option>
                </select>
            </div>

            {/* Task List */}
            <div className="p-3 space-y-3">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <CheckCircle size={48} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-bold text-gray-400">No tasks active.</p>
                    </div>
                ) : (
                    filteredTasks.map((task, index) => (
                        <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">
                                        {task.type || 'Generic'}
                                    </span>
                                    <h3 className="font-bold text-gray-900">{task.name}</h3>
                                    <p className="text-xs text-gray-400 font-medium">Assigned to: <span className="text-gray-900">{task.assignedTo || 'Unassigned'}</span></p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${task.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {task.status}
                                </span>
                            </div>

                            {task.note && (
                                <div className="bg-gray-50 p-2 rounded-lg mb-2">
                                    <p className="text-xs text-gray-500 italic">"{task.note}"</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mt-2 border-t border-gray-50 pt-2">
                                <span className="flex items-center"><Clock size={10} className="mr-1" /> {safeTime(task.date)}</span>
                                <span className="uppercase">{task.zone || 'No Zone'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* CREATE TASK MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-gray-900">Assign New Task</h2>
                            <button onClick={() => setIsCreateModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Assign To</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black appearance-none"
                                        value={newTask.assignedTo}
                                        onChange={handleCollectorChange}
                                    >
                                        <option value="">Select Collector...</option>
                                        {team.map((member, i) => (
                                            <option key={i} value={member.name}>{member.name} ({member.zone})</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Type</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black"
                                        value={newTask.type}
                                        onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                                    >
                                        <option value="Visit">Visit</option>
                                        <option value="Collect">Collect Payment</option>
                                        <option value="Check Meter">Check Meter</option>
                                        <option value="Disconnect">Disconnect</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Priority</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black"
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="High">High (Urgent)</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Customer Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Halimo Yarey"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black"
                                    value={newTask.name}
                                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">SQN (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="12345"
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black"
                                        value={newTask.sqn}
                                        onChange={(e) => setNewTask({ ...newTask, sqn: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Zone (Auto-Set)</label>
                                    <input
                                        readOnly
                                        disabled
                                        type="text"
                                        className="w-full bg-gray-100 border border-gray-200 text-gray-500 text-sm font-bold rounded-xl p-3 cursor-not-allowed"
                                        value={newTask.zone}
                                        placeholder="Select collector first..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Note / Instructions</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black resize-none h-24"
                                    placeholder="Detailed instructions..."
                                    value={newTask.note}
                                    onChange={(e) => setNewTask({ ...newTask, note: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                <Send size={18} />
                                <span>Assign Task</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
