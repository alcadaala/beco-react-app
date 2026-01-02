import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Check, X, Loader2, User } from 'lucide-react';

const UserApprovals = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const q = query(
                collection(db, 'profiles'),
                where('status', '==', 'pending')
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPendingUsers(data || []);
        } catch (err) {
            console.error('Error fetching pending users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (userId, approve) => {
        setActionLoading(userId);
        try {
            const status = approve ? 'active' : 'blocked';
            const userRef = doc(db, 'profiles', userId);

            await updateDoc(userRef, { status });

            // Remove from list
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            // Optional: Email notification could go here if using Edge Functions
        } catch (err) {
            alert('Khalad ayaa dhacay: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-black mb-6">User Approvals ({pendingUsers.length})</h2>

            {pendingUsers.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm text-center text-gray-400">
                    <User className="mx-auto w-12 h-12 mb-4 opacity-20" />
                    <p>No pending users found.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingUsers.map(user => (
                        <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col animate-in zoom-in-95">
                            <div className="flex-1 mb-4">
                                <h3 className="font-bold text-lg">{user.full_name}</h3>
                                <p className="text-gray-500 text-sm">{user.email}</p>
                                <div className="mt-3 space-y-1 text-xs font-mono bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between"><span>Phone:</span> <strong>{user.phone}</strong></div>
                                    <div className="flex justify-between"><span>Zone:</span> <strong>{user.district}</strong></div>
                                    <div className="flex justify-between"><span>Branch ID:</span> <strong>{user.branch_id}</strong></div>
                                    <div className="flex justify-between"><span>Role:</span> <strong>{user.role}</strong></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleApproval(user.id, false)}
                                    disabled={!!actionLoading}
                                    className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 disabled:opacity-50"
                                >
                                    <X size={18} /> Reject
                                </button>
                                <button
                                    onClick={() => handleApproval(user.id, true)}
                                    disabled={!!actionLoading}
                                    className="flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-md shadow-green-200 disabled:opacity-50"
                                >
                                    {actionLoading === user.id ? <Loader2 className="animate-spin" size={18} /> : (
                                        <> <Check size={18} /> Approve </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserApprovals;
