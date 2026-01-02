import { useState, useEffect } from 'react';
import { Calendar, CreditCard, Search, User, CheckCircle, AlertCircle, Clock, Filter, MessageSquare, Send, X, Settings, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Subscriptions() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired

    // Messaging State
    const [msgModalOpen, setMsgModalOpen] = useState(false);
    const [msgTarget, setMsgTarget] = useState(null); // null = bulk, or userId
    const [messageText, setMessageText] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    // Notification Settings State
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('renewal'); // renewal, warning
    const [notifSettings, setNotifSettings] = useState({
        renewal: {
            title: 'Rusuush Cusub',
            template: 'Mudane, rusuushkaaga waa la kordhiyay ilaa {date}. Mahadsanid!',
            color: 'emerald'
        },
        warning: {
            title: 'Digniin!',
            template: 'Rusuushka wuu dhacayaa {days} maalin kadib.',
            color: 'orange',
            daysTrigger: 3,
            targetMode: 'all', // 'all' or 'specific'
            targetIds: '' // Comma separated IDs
        }
    });

    useEffect(() => {
        loadData();
        loadSettings();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Fetch Collectors only, join with branches if possible or just get Branch ID
            // Assuming branch_id links to branches(id), we can fetch name
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    branches:branch_id (name)
                `)
                .eq('role', 'Collector')
                .neq('status', 'blocked');

            if (error) throw error;

            const sorted = (data || []).sort((a, b) => {
                const aExp = a.subscription_expiry ? new Date(a.subscription_expiry).getTime() : 0;
                const bExp = b.subscription_expiry ? new Date(b.subscription_expiry).getTime() : 0;
                if (aExp === bExp) return (a.full_name || '').localeCompare(b.full_name || '');
                return aExp - bExp;
            });

            setUsers(sorted);
        } catch (error) {
            console.error("Error loading subscriptions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'subscription_notif_settings')
                .single();

            if (data?.value) {
                setNotifSettings(prev => ({ ...prev, ...data.value }));
            }
        } catch (err) {
            // No settings found is fine, use defaults
        }
    };

    const handleSaveSettings = async () => {
        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'subscription_notif_settings',
                    value: notifSettings
                });

            if (error) throw error;
            setSettingsModalOpen(false);
            alert('Settings saved!');
        } catch (error) {
            alert("Error saving settings: " + error.message);
        }
    };

    const handleRenew = async (userId, currentExpiry) => {
        try {
            const now = new Date();
            const curr = currentExpiry ? new Date(currentExpiry) : now;
            // If expired, start from now. If active, add to existing.
            const startDate = curr > now ? curr : now;
            const newExpiry = new Date(startDate);
            newExpiry.setDate(newExpiry.getDate() + 30); // Add 30 Days

            const { error } = await supabase
                .from('profiles')
                .update({ subscription_expiry: newExpiry.toISOString() })
                .eq('id', userId);

            if (error) throw error;

            // Add Notification
            await supabase.from('notifications').insert([{
                user_id: userId,
                title: notifSettings.renewal.title,
                message: notifSettings.renewal.template.replace('{date}', newExpiry.toLocaleDateString()),
                type: 'success', // or use color logic mapped to type
                read: false
            }]);

            // Refresh local state optimization
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_expiry: newExpiry.toISOString() } : u));

        } catch (error) {
            alert("Error renewing: " + error.message);
        }
    };

    const handleDeactivate = async (userId) => {
        if (!confirm('Are you sure you want to deactivate this user? They will be blocked/expired immediately.')) return;
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { error } = await supabase
                .from('profiles')
                .update({ subscription_expiry: yesterday.toISOString() })
                .eq('id', userId);

            if (error) throw error;
            loadData(); // Re-fetch to sort correctly
        } catch (error) {
            alert("Error deactivating: " + error.message);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        setSendingMsg(true);

        try {
            let targets = [];
            if (msgTarget === 'bulk') {
                // Target expired or warning users
                // Client-side filtering of current loaded users is easier for now
                targets = users.filter(u => getStatus(u.subscription_expiry).label !== 'Active').map(u => u.id);
            } else {
                targets = [msgTarget];
            }

            if (targets.length === 0) return alert("No users to send to.");

            const notifs = targets.map(uid => ({
                user_id: uid,
                title: 'Admin Message',
                message: messageText,
                type: 'info',
                read: false
            }));

            const { error } = await supabase.from('notifications').insert(notifs);
            if (error) throw error;

            setMsgModalOpen(false);
            setMessageText('');
            setMsgTarget(null);
            alert('Message sent successfully!');
        } catch (error) {
            alert("Error sending message: " + error.message);
        } finally {
            setSendingMsg(false);
        }
    };

    const openMessageModal = (userId = 'bulk') => {
        setMsgTarget(userId);
        setMsgModalOpen(true);
    };

    const getStatus = (expiryDate) => {
        if (!expiryDate) return { label: 'No Sub', color: 'bg-gray-100 text-gray-500', icon: AlertCircle };
        const now = new Date();
        const exp = new Date(expiryDate);
        const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) return { label: 'Expired', color: 'bg-red-100 text-red-600', icon: AlertCircle };
        if (daysLeft <= 3) return { label: `${daysLeft} Days Left`, color: 'bg-orange-100 text-orange-600', icon: Clock };
        return { label: 'Active', color: 'bg-green-100 text-green-600', icon: CheckCircle };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Set';
        return new Date(dateString).toLocaleDateString();
    };

    const filteredUsers = users.filter(user => {
        const nameMatch = (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const phoneMatch = (user.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSearch = nameMatch || phoneMatch;

        if (filterStatus === 'all') return matchesSearch;

        const status = getStatus(user.subscription_expiry);
        if (filterStatus === 'expired') return matchesSearch && (status.label === 'Expired' || status.label === 'No Sub');
        if (filterStatus === 'active') return matchesSearch && status.label !== 'Expired' && status.label !== 'No Sub';

        return matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-6 pb-24 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Subscriptions</h1>
                <div className="flex justify-between items-end">
                    <p className="text-sm font-medium text-gray-500">Manage collector monthly payments ($2/mo)</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSettingsModalOpen(true)}
                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform hover:bg-gray-200"
                            title="Notification Settings"
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            onClick={() => openMessageModal('bulk')}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform"
                        >
                            <MessageSquare size={16} />
                            Bulk Message
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-xl text-green-600"><CheckCircle size={20} /></div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Active</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">
                        {users.filter(u => getStatus(u.subscription_expiry).label === 'Active').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 rounded-xl text-red-600"><AlertCircle size={20} /></div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Expired</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">
                        {users.filter(u => {
                            const s = getStatus(u.subscription_expiry);
                            return s.label === 'Expired' || s.label === 'No Sub';
                        }).length}
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col gap-4 mb-6 sticky top-0 bg-gray-50/95 backdrop-blur-sm py-2 z-10">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-sm shadow-sm outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {['all', 'active', 'expired'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setFilterStatus(filter)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-colors ${filterStatus === filter
                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <User size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="font-bold text-gray-400">No users found</p>
                    </div>
                ) : (
                    filteredUsers.map(user => {
                        const status = getStatus(user.subscription_expiry);
                        const daysLeft = user.subscription_expiry ? Math.ceil((new Date(user.subscription_expiry) - new Date()) / (1000 * 60 * 60 * 24)) : -1;

                        return (
                            <div key={user.id} className="bg-white p-5 rounded-[2rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-gray-100/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 font-black text-lg border border-gray-100">
                                            {(user.full_name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{user.full_name || 'Unknown User'}</h3>
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-0.5">
                                                <span>{user.phone || 'No Phone'}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{user.branches?.name || 'No Branch'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${status.color}`}>
                                        <status.icon size={12} />
                                        {status.label}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mb-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Expires On</p>
                                        <p className="text-sm font-black text-gray-900 font-mono">{formatDate(user.subscription_expiry)}</p>
                                    </div>
                                    <div className="text-right">
                                        <button
                                            onClick={() => openMessageModal(user.id)}
                                            className="p-2 bg-gray-100/50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors mb-1"
                                            title="Send Message"
                                        >
                                            <MessageSquare size={16} />
                                        </button>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Cost</p>
                                        <p className="text-sm font-black text-gray-900">$2.00</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {(status.label === 'Active' || status.label.includes('Days Left')) && (
                                        <button
                                            onClick={() => handleDeactivate(user.id)}
                                            className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
                                        >
                                            Deactivate
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRenew(user.id, user.subscription_expiry)}
                                        className={`flex-[2] py-3 bg-[#0F172A] active:bg-black text-white rounded-xl font-bold text-xs shadow-lg shadow-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                                    >
                                        <CreditCard size={14} />
                                        <span>{daysLeft > 0 ? 'Extend 30 Days' : 'Activate Subscription'}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Message Modal */}
            {
                msgModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <MessageSquare size={20} className="text-indigo-600" />
                                    {msgTarget === 'bulk' ? 'Bulk Message (Expired)' : 'Send Message'}
                                </h3>
                                <button onClick={() => setMsgModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                            ></textarea>

                            <button
                                onClick={handleSendMessage}
                                disabled={sendingMsg}
                                className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-50"
                            >
                                <Send size={18} />
                                {sendingMsg ? 'Sending...' : 'Send Notification'}
                            </button>
                        </div>
                    </div>
                )}

            {/* Settings Modal */}
            {settingsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Settings size={20} className="text-gray-900" />
                                Notification Settings
                            </h3>
                            <button onClick={() => setSettingsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Title</label>
                                <input
                                    value={notifSettings.title}
                                    onChange={(e) => setNotifSettings({ ...notifSettings, title: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Message Template</label>
                                <textarea
                                    value={notifSettings.template}
                                    onChange={(e) => setNotifSettings({ ...notifSettings, template: e.target.value })}
                                    className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Use <span className="font-mono bg-gray-100 px-1 rounded">{'\{date\}'}</span> to insert expiry date.</p>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                                <button
                                    onClick={() => setActiveTab('renewal')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'renewal' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Renewal Success
                                </button>
                                <button
                                    onClick={() => setActiveTab('warning')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'warning' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Expiry Warning
                                </button>
                            </div>

                            {activeTab === 'renewal' ? (
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Title</label>
                                        <input
                                            value={notifSettings.renewal.title}
                                            onChange={(e) => setNotifSettings({ ...notifSettings, renewal: { ...notifSettings.renewal, title: e.target.value } })}
                                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Message Template</label>
                                        <textarea
                                            value={notifSettings.renewal.template}
                                            onChange={(e) => setNotifSettings({ ...notifSettings, renewal: { ...notifSettings.renewal, template: e.target.value } })}
                                            className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Use <span className="font-mono bg-gray-100 px-1 rounded">{'\{date\}'}</span> to insert expiry date.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Color Theme</label>
                                        <div className="flex gap-2">
                                            {['emerald', 'blue', 'orange', 'purple', 'rose'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setNotifSettings({ ...notifSettings, renewal: { ...notifSettings.renewal, color: c } })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${notifSettings.renewal.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: `var(--color-${c}-500, ${c})` }}
                                                >
                                                    <div className={`w-full h-full rounded-full bg-${c}-500 ${notifSettings.renewal.color === c ? 'ring-2 ring-white' : ''}`}></div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Title</label>
                                        <input
                                            value={notifSettings.warning.title}
                                            onChange={(e) => setNotifSettings({ ...notifSettings, warning: { ...notifSettings.warning, title: e.target.value } })}
                                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Message Template</label>
                                        <textarea
                                            value={notifSettings.warning.template}
                                            onChange={(e) => setNotifSettings({ ...notifSettings, warning: { ...notifSettings.warning, template: e.target.value } })}
                                            className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Use <span className="font-mono bg-gray-100 px-1 rounded">{'\{days\}'}</span> to insert days left and <span className="font-mono bg-gray-100 px-1 rounded">{'\{date\}'}</span> for expiry date.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Trigger (Days before expiry)</label>
                                        <input
                                            type="number"
                                            value={notifSettings.warning.daysTrigger}
                                            onChange={(e) => setNotifSettings({ ...notifSettings, warning: { ...notifSettings.warning, daysTrigger: parseInt(e.target.value) || 0 } })}
                                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Target Audience</label>
                                        <div className="flex bg-gray-100 p-1 rounded-xl mb-3">
                                            <button
                                                onClick={() => setNotifSettings({ ...notifSettings, warning: { ...notifSettings.warning, targetMode: 'all' } })}
                                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${notifSettings.warning.targetMode !== 'specific' ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400 hover:text-gray-900'}`}
                                            >
                                                All Collectors
                                            </button>
                                            <button
                                                onClick={() => setNotifSettings({ ...notifSettings, warning: { ...notifSettings.warning, targetMode: 'specific' } })}
                                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${notifSettings.warning.targetMode === 'specific' ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400 hover:text-gray-900'}`}
                                            >
                                                Specific Users
                                            </button>
                                        </div>
                                        {notifSettings.warning.targetMode === 'specific' && (
                                            <textarea
                                                value={notifSettings.warning.targetIds || ''}
                                                onChange={(e) => setNotifSettings({ ...notifSettings, warning: { ...notifSettings.warning, targetIds: e.target.value } })}
                                                placeholder="Enter User IDs separated by commas (e.g. 101, 102)..."
                                                className="w-full h-20 p-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none animate-in fade-in slide-in-from-top-1"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Color Theme</label>
                                        <div className="flex gap-2">
                                            {['orange', 'red', 'yellow', 'purple', 'blue'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setNotifSettings({ ...notifSettings, warning: { ...notifSettings.warning, color: c } })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${notifSettings.warning.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: `var(--color-${c}-500, ${c})` }}
                                                >
                                                    <div className={`w-full h-full rounded-full bg-${c}-500 ${notifSettings.warning.color === c ? 'ring-2 ring-white' : ''}`}></div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSaveSettings}
                                className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
