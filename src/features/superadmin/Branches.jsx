import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Plus, MoreVertical, Building2, Users, ShieldCheck, UserCheck, Lock, Unlock, StopCircle, RefreshCw, X, ChevronRight, Activity, Clock, FileText, Edit, Loader2, AlertCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Branches() {
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [detailTab, setDetailTab] = useState('staff'); // 'staff' or 'activity'

    // Staff Management State
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffFormData, setStaffFormData] = useState({ email: '' }); // Only email needed to find/assign
    const [assignError, setAssignError] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    const [newBranchData, setNewBranchData] = useState({ name: '', location: '', managerName: '', managerPhone: '' });
    const [createLoading, setCreateLoading] = useState(false);

    // Initial Data Load
    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Branches
            let branchesData = [];
            try {
                const q = query(collection(db, 'branches'), orderBy('created_at', 'desc'));
                const snap = await getDocs(q);
                branchesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (e) {
                const snap = await getDocs(collection(db, 'branches'));
                branchesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Client sort if needed
            }

            // 2. Fetch Staff (Profiles with branch_id)
            // Querying where branch_id is not null/empty
            const staffQ = query(collection(db, 'profiles'), where('branch_id', '!=', ''));
            // Note: Firestore != null or != '' depends on how we save it. 
            // Safest is to fetch all profiles if not too many, or just try to fetch where branch_id > ''

            // Let's just fetch all profiles for simplicity in this prototype to ensure we don't miss any due to null vs undefined vs empty string
            const staffSnap = await getDocs(collection(db, 'profiles'));
            const allStaff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 3. Join
            const enriched = branchesData.map(branch => ({
                ...branch,
                staff: allStaff.filter(p => p.branch_id === branch.id)
            }));

            setBranches(enriched || []);

            // Update selected branch reference if open
            if (selectedBranch) {
                const refreshed = enriched.find(b => b.id === selectedBranch.id);
                if (refreshed) setSelectedBranch(refreshed);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBranch = async () => {
        if (!newBranchData.name || !newBranchData.managerName) return;
        setCreateLoading(true);

        try {
            // 1. Create Branch
            await addDoc(collection(db, 'branches'), {
                name: newBranchData.name,
                location: newBranchData.location || 'Mogadishu',
                manager_name: newBranchData.managerName,
                manager_phone: newBranchData.managerPhone,
                status: 'Active',
                created_at: new Date().toISOString()
            });

            await fetchBranches();
            setShowCreateModal(false);
            setNewBranchData({ name: '', location: '', managerName: '', managerPhone: '' });

        } catch (error) {
            alert("Error creating branch: " + error.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleAssignStaff = async () => {
        if (!selectedBranch || !staffFormData.email) return;
        setAssignLoading(true);
        setAssignError('');

        try {
            // 1. Find User by Email
            const q = query(collection(db, 'profiles'), where('email', '==', staffFormData.email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("User not found. Please ask them to Sign Up on the app first.");
            }

            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;
            const userData = userDoc.data();

            // 2. Update their branch_id
            const userRef = doc(db, 'profiles', userId);
            await updateDoc(userRef, { branch_id: selectedBranch.id });

            // Also update local state or re-fetch
            await fetchBranches();
            setShowStaffModal(false);
            setStaffFormData({ email: '' });
            alert(`Success! ${userData.full_name || 'User'} assigned to ${selectedBranch.name}.`);

        } catch (error) {
            setAssignError(error.message);
        } finally {
            setAssignLoading(false);
        }
    };

    // Suspend Logic
    const toggleBranchStatus = async (branch, e) => {
        e.stopPropagation();
        const newStatus = branch.status === 'Active' ? 'Suspended' : 'Active';

        try {
            const branchRef = doc(db, 'branches', branch.id);
            await updateDoc(branchRef, { status: newStatus });
            fetchBranches();
        } catch (err) {
            console.error("Status update failed:", err);
        }
    };

    const handleDeleteBranch = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'branches', id));
            fetchBranches();
            if (selectedBranch?.id === id) setSelectedBranch(null);
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    if (isLoading && branches.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50">
                <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-stone-50 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-900 leading-tight">Branches</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Database Integrated</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {branches.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold">No branches found</p>
                    </div>
                ) : (
                    branches.map(branch => (
                        <div
                            key={branch.id}
                            onClick={() => { setSelectedBranch(branch); setDetailTab('staff'); }}
                            className={`bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer ${branch.status === 'Suspended' ? 'opacity-70 grayscale-[0.5]' : ''}`}
                        >
                            {/* Status & Actions */}
                            <div className="absolute top-4 right-4 flex items-center space-x-2">
                                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${branch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {branch.status}
                                </div>
                                <button
                                    onClick={(e) => toggleBranchStatus(branch, e)}
                                    className={`p-1.5 rounded-full ${branch.status === 'Active' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                                >
                                    {branch.status === 'Active' ? <StopCircle size={14} /> : <Activity size={14} />}
                                </button>
                                {(!branch.staff || branch.staff.length === 0) && (
                                    <button onClick={(e) => handleDeleteBranch(branch.id, e)} className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-start mb-4">
                                <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 shadow-inner mr-4">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 leading-tight">{branch.name}</h3>
                                    <div className="flex items-center text-xs font-bold text-gray-400 mt-1">
                                        <MapPin size={12} className="mr-1" />
                                        {branch.location || 'Mogadishu'}
                                    </div>
                                </div>
                            </div>

                            {/* Mini Stats */}
                            <div className="flex items-center space-x-4 mt-2 pl-16">
                                <div className="flex items-center text-xs font-bold text-gray-600">
                                    <Users size={12} className="mr-1" />
                                    {branch.staff?.length || 0} Staff
                                </div>
                                <div className="flex items-center text-xs font-bold text-emerald-600">
                                    <UserCheck size={12} className="mr-1" />
                                    Manager: {branch.manager_name || 'N/A'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Sheet */}
            {selectedBranch && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedBranch(null)}></div>
                    <div className="fixed bottom-0 left-0 w-full bg-white z-50 rounded-t-[2.5rem] shadow-2xl h-[85vh] overflow-y-auto flex flex-col max-w-[480px] mx-auto right-0 animate-in slide-in-from-bottom">
                        <div className="p-6 pb-0">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-none mb-1">{selectedBranch.name}</h2>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${selectedBranch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedBranch.status}</span>
                                </div>
                                <button onClick={() => setSelectedBranch(null)} className="p-2 bg-gray-50 rounded-full text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                                <button onClick={() => setDetailTab('staff')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${detailTab === 'staff' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>Staff List</button>
                                <button onClick={() => setDetailTab('activity')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${detailTab === 'activity' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>Daily Activity</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6">
                            {detailTab === 'staff' ? (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Branch Staff</h3>
                                        <button onClick={() => setShowStaffModal(true)} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <Plus size={12} /> Assign Staff
                                        </button>
                                    </div>

                                    <div className="space-y-2 pb-6">
                                        {selectedBranch.staff && selectedBranch.staff.length > 0 ? selectedBranch.staff.map((member, i) => (
                                            <div key={i} className="flex items-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-gray-900 border border-gray-100 shadow-sm mr-3">
                                                    {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 text-sm">{member.full_name || 'Unnamed'}</h4>
                                                    <p className="text-xs text-gray-400">{member.role} • {member.phone || member.email}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">Active</span>
                                            </div>
                                        )) : (
                                            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400">No staff assigned yet</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <Activity size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-xs font-bold text-gray-400">Activity Logs Coming Soon</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black">New Branch</h3>
                            <button onClick={() => setShowCreateModal(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Branch Name</label>
                                <input
                                    value={newBranchData.name}
                                    onChange={e => setNewBranchData({ ...newBranchData, name: e.target.value })}
                                    className="w-full p-3 bg-gray-50 rounded-xl font-bold mt-1 outline-none focus:ring-2 focus:ring-gray-900"
                                    placeholder="e.g. Hodan Branch"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Location</label>
                                <input
                                    value={newBranchData.location}
                                    onChange={e => setNewBranchData({ ...newBranchData, location: e.target.value })}
                                    className="w-full p-3 bg-gray-50 rounded-xl font-bold mt-1 outline-none focus:ring-2 focus:ring-gray-900"
                                    placeholder="e.g. Mogadishu"
                                />
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <h4 className="text-xs font-black text-indigo-900 uppercase mb-2">Manager Info</h4>
                                <div className="space-y-3">
                                    <input
                                        value={newBranchData.managerName}
                                        onChange={e => setNewBranchData({ ...newBranchData, managerName: e.target.value })}
                                        className="w-full p-2.5 bg-white rounded-lg font-bold text-sm outline-none border border-indigo-100 placeholder:text-indigo-300"
                                        placeholder="Full Name"
                                    />
                                    <input
                                        value={newBranchData.managerPhone}
                                        onChange={e => setNewBranchData({ ...newBranchData, managerPhone: e.target.value })}
                                        className="w-full p-2.5 bg-white rounded-lg font-bold text-sm outline-none border border-indigo-100 placeholder:text-indigo-300"
                                        placeholder="Phone Number"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleCreateBranch}
                                disabled={createLoading}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold mt-2 hover:bg-black transition-colors disabled:opacity-50"
                            >
                                {createLoading ? 'Creating...' : 'Create Branch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSIGN STAFF MODAL */}
            {showStaffModal && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black">Assign Staff</h3>
                            <button onClick={() => setShowStaffModal(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                            <p className="text-xs font-medium text-blue-800 leading-relaxed">
                                Enter the email address of the staff member you want to assign to <b>{selectedBranch?.name}</b>.
                            </p>
                            <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase">Note: They must already be signed up.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">User Email</label>
                                <input
                                    value={staffFormData.email}
                                    onChange={e => setStaffFormData({ ...staffFormData, email: e.target.value })}
                                    className="w-full p-3 bg-gray-50 rounded-xl font-bold mt-1 outline-none focus:ring-2 focus:ring-gray-900"
                                    placeholder="user@example.com"
                                />
                            </div>

                            {assignError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 items-start text-xs font-bold text-red-600">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                    <span>{assignError}</span>
                                </div>
                            )}

                            <button
                                onClick={handleAssignStaff}
                                disabled={assignLoading}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold mt-2 hover:bg-black transition-colors disabled:opacity-50"
                            >
                                {assignLoading ? 'Assigning...' : 'Assign User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
