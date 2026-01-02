import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Lock, Unlock, Users, ChevronRight, X, Clock, DollarSign, CheckCircle2, History, TrendingUp, AlertCircle, Send } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

export default function TeamList() {
    const [activeTab, setActiveTab] = useState('team'); // Default to Team to show Collectors
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [agents, setAgents] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // --- Safe Parse ---
    const safeParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error(e);
            return fallback;
        }
    };

    // --- Load Real Data ---
    useEffect(() => {
        const loadRealData = () => {
            const user = safeParse('beco_current_user', null);
            setCurrentUser(user);

            const branches = safeParse('beco_branches', []);
            const allUsers = safeParse('beco_users', []);
            const blockedMap = safeParse('beco_blocked_agents', {});

            let myStaff = [];

            // Find staff from supervisor's branch
            if (user) {
                // Method 1: Direct DB lookup (Best for new signups)
                if (user.branchId) {
                    myStaff = allUsers.filter(u => u.branchId === user.branchId && u.role === 'Collector');
                }

                // Method 2: Fallback to Branch Staff Array if users not found in direct DB check
                // This ensures we catch legacy data or if branchId isn't on user object for some reason
                if (myStaff.length === 0) {
                    const branch = branches.find(b => b.id === user.branchId) ||
                        branches.find(b => Array.isArray(b.staff) && b.staff.some(s => s.name === user.name));

                    if (branch && Array.isArray(branch.staff)) {
                        myStaff = branch.staff.filter(s => s.role === 'Collector');
                    }
                }
            }

            // Map to Agent Interface
            // Map to Agent Interface (REAL DATA NOW)
            const metricsMap = safeParse('beco_daily_metrics', {});
            const todayKey = new Date().toDateString();

            const mappedAgents = myStaff.map((staff, index) => {
                const isBlocked = blockedMap[staff.name]?.blocked || false;
                const blockReason = blockedMap[staff.name]?.reason || '';

                // Get metrics for this user today
                const userKey = `${staff.name}_${todayKey}`;
                const userMetrics = metricsMap[userKey] || {};

                // Calculate Active Time (Difference between first and last)
                let activeTimeStr = '0h 0m';
                if (userMetrics.firstActive && userMetrics.lastActive) {
                    const diffMs = userMetrics.lastActive - userMetrics.firstActive;
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    activeTimeStr = `${hours}h ${minutes}m`;
                }

                return {
                    id: index + 1, // Simple ID for UI map
                    name: staff.name,
                    role: staff.role,
                    status: 'Online', // Could be inferred from lastActive < 5min ago
                    paid: 0, // Still placeholder until payment module
                    target: 100, // Still placeholder
                    calls: userMetrics.calls || 0,
                    activeTime: activeTimeStr,
                    blocked: isBlocked,
                    blockReason: blockReason,
                    location: 'Mogadishu', // Default
                    collected: '$0',
                    activity: [] // Empty chart for now
                };
            });

            setAgents(mappedAgents);
        };

        loadRealData();
    }, []);

    // --- BLOCK MODAL LOGIC ---
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [agentToBlock, setAgentToBlock] = useState(null); // The full agent object

    const [blockReasonText, setBlockReasonText] = useState('');

    // --- NOTIFICATION MODAL LOGIC ---
    const [notifyModalOpen, setNotifyModalOpen] = useState(false);
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyRecipients, setNotifyRecipients] = useState([]); // Array of agent names

    const openNotifyModal = (agent) => {
        setNotifyRecipients([agent]);
        setNotifyMessage('');
        setNotifyModalOpen(true);
    };

    const handleSendNotification = () => {
        if (!notifyMessage.trim()) return alert("Message cannot be empty");

        const allNotifications = safeParse('beco_notifications', []);
        const newNotifs = notifyRecipients.map(agent => ({
            id: Date.now() + Math.random(),
            recipient: agent.name,
            message: notifyMessage,
            sender: currentUser?.name || 'Supervisor',
            timestamp: new Date().toISOString(),
            read: false
        }));

        localStorage.setItem('beco_notifications', JSON.stringify([...allNotifications, ...newNotifs]));
        alert(notifyRecipients.length > 1 ? `Notification sent to ${notifyRecipients.length} team members.` : `Notification sent to ${notifyRecipients[0].name}`);
        setNotifyModalOpen(false);
    };

    const toggleBlock = (agentId) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;

        if (agent.blocked) {
            // UNBLOCKING (Directly)
            if (confirm(`Unblock ${agent.name}?`)) {
                performBlockUpdate(agent, false, '');
            }
        } else {
            // BLOCKING (Open Modal)
            setAgentToBlock(agent);
            setBlockReasonText(''); // Reset text
            setBlockModalOpen(true);
        }
    };

    const confirmBlock = () => {
        if (!agentToBlock) return;
        if (!blockReasonText.trim()) {
            alert("Please enter a reason for blocking.");
            return;
        }
        performBlockUpdate(agentToBlock, true, blockReasonText);
        setBlockModalOpen(false);
        setAgentToBlock(null);
    };

    const performBlockUpdate = (agent, isBlocking, note) => {
        if (isBlocking && !note) note = "No reason provided";

        // Update UI State
        const updatedAgents = agents.map(a => a.id === agent.id ? { ...a, blocked: isBlocking, blockReason: note } : a);
        setAgents(updatedAgents);

        if (selectedAgent && selectedAgent.id === agent.id) {
            setSelectedAgent(prev => ({ ...prev, blocked: isBlocking, blockReason: note }));
        }

        // Persist to LocalStorage
        const blockedMap = safeParse('beco_blocked_agents', {});
        if (isBlocking) {
            blockedMap[agent.name] = { blocked: true, reason: note, date: new Date().toISOString() };
        } else {
            delete blockedMap[agent.name];
        }
        localStorage.setItem('beco_blocked_agents', JSON.stringify(blockedMap));
        if (!isBlocking) alert(`Agent ${agent.name} unblocked.`);
    };

    return (
        <div className="p-4 pb-24 min-h-screen bg-stone-100 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Users size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 leading-tight">My Team</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Staff Management</p>
                    </div>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-2">
                    <button
                        onClick={() => {
                            if (agents.length === 0) return alert("No agents to notify");
                            setNotifyRecipients(agents);
                            setNotifyMessage('');
                            setNotifyModalOpen(true);
                        }}
                        className="p-1 hover:bg-gray-50 rounded-lg text-indigo-600 transition-colors"
                        title="Notify All Team"
                    >
                        <Send size={20} />
                    </button>
                    <div className="w-px h-4 bg-gray-200"></div>
                    <Search size={20} className="text-gray-400" />
                </div>
            </div>

            {/* Content Switcher (Simplified if we don't have Zone data for real users yet) */}
            <div className="flex p-1 bg-white border border-gray-100 rounded-xl mb-6 mx-2 shadow-sm">
                <button
                    onClick={() => setActiveTab('team')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'team' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Collectors List
                </button>
            </div>

            {/* Agents List */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mx-1">
                {agents.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-400 font-bold text-sm">No collectors found in your branch.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-50">
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider">Collector</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-center">Active</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-center">Calls</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {agents.map((agent) => (
                                    <tr
                                        key={agent.id}
                                        onClick={() => setSelectedAgent(agent)}
                                        className={`hover:bg-gray-50 transition-colors cursor-pointer group ${agent.blocked ? 'bg-red-50/30' : ''}`}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ${agent.blocked ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                        {agent.name.charAt(0)}
                                                    </div>
                                                    {!agent.blocked && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full bg-green-500"></div>}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm leading-tight truncate max-w-[100px]">{agent.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">{agent.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-bold text-gray-700">{agent.activeTime}</span>
                                                <span className="text-[8px] text-gray-400 font-medium">On Config</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                                <Phone size={10} className="text-green-600" />
                                                <span className="text-xs font-bold text-green-700">{agent.calls}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                                <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Agent Detail Modal */}
            {selectedAgent && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedAgent(null)}
                    ></div>
                    <div className="fixed bottom-0 left-0 w-full bg-white z-50 rounded-t-[2.5rem] p-6 shadow-2xl transform transition-transform duration-300 ease-out animate-in slide-in-from-bottom max-w-[480px] mx-auto right-0 h-[80vh] overflow-y-auto">
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center space-x-4">
                                <div className={`h-16 w-16 rounded-full flex items-center justify-center font-black text-2xl ${selectedAgent.blocked ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                                    {selectedAgent.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-none mb-1">{selectedAgent.name}</h2>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <div className="flex items-center space-x-1 bg-gray-100 px-2 py-0.5 rounded-md">
                                            <Clock size={12} className="text-gray-500" />
                                            <span className="text-xs font-bold text-gray-700">{selectedAgent.activeTime} Today</span>
                                        </div>
                                        <div className="flex items-center space-x-1 bg-gray-100 px-2 py-0.5 rounded-md">
                                            <Phone size={12} className="text-gray-500" />
                                            <span className="text-xs font-bold text-gray-700">{selectedAgent.calls} Calls</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAgent(null)}
                                className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {selectedAgent.blocked && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Block Reason</p>
                                <p className="text-sm font-bold text-gray-800 italic">"{selectedAgent.blockReason || 'No reason provided'}"</p>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 mb-8">
                            <button className="flex flex-col items-center justify-center py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors">
                                <MapPin size={18} className="mb-1" />
                                <span>Location</span>
                            </button>
                            <button className="flex flex-col items-center justify-center py-3 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors">
                                <Phone size={18} className="mb-1" />
                                <span>Call</span>
                            </button>
                            <button
                                onClick={() => openNotifyModal(selectedAgent)}
                                className="flex flex-col items-center justify-center py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                                <span>Notify</span>
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={() => toggleBlock(selectedAgent.id)}
                                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${selectedAgent.blocked ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                            >
                                {selectedAgent.blocked ? <Unlock size={18} /> : <Lock size={18} />}
                                <span>{selectedAgent.blocked ? 'Unblock Agent Access' : 'Block Agent Access'}</span>
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4 font-medium px-4">
                                {selectedAgent.blocked
                                    ? "Unblocking will restore app access for this collector immediately."
                                    : "Blocking will immediately prevent this collector from accessing the app."}
                            </p>
                        </div>
                        <div className="h-safe w-full"></div>
                    </div>
                </>
            )}
            {/* NOTIFY MODAL */}
            {notifyModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900">Send Notification</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                                To: {notifyRecipients.length > 1 ? 'All Team Members' : notifyRecipients.map(r => r.name).join(', ')}
                            </p>
                        </div>

                        <div className="mb-6">
                            <textarea
                                value={notifyMessage}
                                onChange={(e) => setNotifyMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                autoFocus
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setNotifyModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendNotification}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors"
                            >
                                Send <Send size={14} className="inline ml-1 mb-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* BLOCK REASON MODAL */}
            {blockModalOpen && agentToBlock && (
                <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900">Block Access</h3>
                            <p className="text-sm text-gray-500 text-center mt-1">
                                You are blocking <strong>{agentToBlock.name}</strong> from accessing the app.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason for blocking (Required)</label>
                            <textarea
                                value={blockReasonText}
                                onChange={(e) => setBlockReasonText(e.target.value)}
                                placeholder="E.g. Under investigation, Shift ended, Disciplinary action..."
                                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                                autoFocus
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setBlockModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBlock}
                                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
                            >
                                Confirm Block
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
