import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';

const AdminSetup = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [adminData, setAdminData] = useState({
        email: 'admin@beco.com',
        password: '',
        full_name: 'Super Admin'
    });

    const createSuperAdmin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // 1. Create admin user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                adminData.email,
                adminData.password
            );

            const userId = userCredential.user.uid;

            // 2. Create admin profile in Firestore with SuperAdmin role
            await setDoc(doc(db, 'profiles', userId), {
                id: userId,
                email: adminData.email,
                full_name: adminData.full_name,
                role: 'SuperAdmin',
                status: 'Active',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            setSuccess(`✅ Super Admin created successfully! UID: ${userId}`);
            console.log('Super Admin created:', userId);

        } catch (err) {
            console.error('Admin creation error:', err);
            setError(err.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl mb-4">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                        Super Admin Setup
                    </h1>
                    <p className="text-gray-600 text-sm font-semibold">
                        Create the first Super Admin account
                    </p>
                </div>

                <form onSubmit={createSuperAdmin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Admin Email
                        </label>
                        <input
                            type="email"
                            value={adminData.email}
                            onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="admin@beco.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Admin Password
                        </label>
                        <input
                            type="password"
                            value={adminData.password}
                            onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Admin Name
                        </label>
                        <input
                            type="text"
                            value={adminData.full_name}
                            onChange={(e) => setAdminData({ ...adminData, full_name: e.target.value })}
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Super Admin"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-100/80 backdrop-blur-xl border border-red-200 rounded-2xl flex items-start gap-2 text-xs font-bold text-red-700">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-100/80 backdrop-blur-xl border border-green-200 rounded-2xl flex items-start gap-2 text-xs font-bold text-green-700">
                            <CheckCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{success}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Creating Admin...' : 'Create Super Admin'}
                    </button>
                </form>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-xs font-bold text-yellow-800">
                        ⚠️ <strong>IMPORTANT:</strong> Delete this page after creating admin!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminSetup;
