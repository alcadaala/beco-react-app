import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Clock } from 'lucide-react';

const PendingApproval = () => {
    const { signOut, user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-yellow-100 p-4 rounded-full">
                        <Clock className="w-12 h-12 text-yellow-600" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-gray-900">Sugitaanka Ogolaanshaha</h2>

                <div className="bg-blue-50 p-4 rounded-xl text-left text-sm text-blue-800 space-y-2">
                    <p><strong>Magaca:</strong> {user?.user_metadata?.full_name}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p>Waan helnay codsigaaga. Fadlan sug inta maamulka (Super Admin) uu ka eegayo oo ogolaanayo.</p>
                </div>

                <button
                    onClick={() => signOut()}
                    className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                    <LogOut size={20} /> Ka Bax (Logout)
                </button>
            </div>
        </div>
    );
};

export default PendingApproval;
