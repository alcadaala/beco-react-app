import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, User, Phone, Mail, MapPin, Building2, Lock, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Signup = () => {
    const navigate = useNavigate();
    const { signIn, signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        branch_name: '',
        zone: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Validate Branch Existence in Firestore
            const branchesRef = collection(db, 'branches');
            const q = query(branchesRef, where('name', '==', formData.branch_name.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('Laantan ma jirto database-ka. Fadlan hubi magaca ama la xiriir maamulka.');
            }

            const branchData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };

            // 2. Sign Up with Firebase
            const result = await signUp(formData.email, formData.password, {
                full_name: formData.full_name,
                phone: formData.phone,
                zone: formData.zone,
                branch_id: branchData.id,
                role: 'Collector'
            });

            if (result.error) throw result.error;

            // 3. Auto-Login
            await signIn(formData.email, formData.password);

            // 4. Success Redirect
            navigate('/dashboard');

        } catch (err) {
            console.error('Signup Error:', err);
            setError(err.message || 'Khalad ayaa dhacay.');
        } finally {
            setLoading(false);
        }
    };


    const inputClasses = "block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all placeholder-gray-400";
    const iconClasses = "absolute inset-y-0 left-0 pl-4 h-full text-gray-300 group-focus-within:text-indigo-600 transition-colors flex items-center";

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[40%] -left-[20%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-br from-violet-400/30 to-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute -bottom-[40%] -right-[20%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-[30%] right-[15%] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-gradient-to-br from-pink-400/20 to-rose-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Glass Card */}
            <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/40 p-6 sm:p-8 md:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                {/* Logo Section */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center mb-5 sm:mb-6 hover:scale-105 transition-transform duration-300">
                        <img src="/beco_full_logo.png" alt="Beco Logo" className="h-16 sm:h-20 w-auto drop-shadow-lg" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight mb-2">
                        Diiwaan Gelin
                    </h1>
                    <p className="text-gray-600 font-semibold text-xs sm:text-sm px-2">
                        Ka mid noqo kooxda Beco Energy
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-3.5 sm:space-y-4">
                    <div className="space-y-3 sm:space-y-3.5 animate-in slide-in-from-right-4 duration-300">

                        {/* Full Name */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                <User size={16} className="sm:hidden" />
                                <User size={18} className="hidden sm:block" />
                            </div>
                            <input
                                name="full_name"
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={handleChange}
                                className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-xl sm:rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm"
                                placeholder="Magaca oo Saddexan"
                            />
                        </div>

                        {/* Phone */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                <Phone size={18} />
                            </div>
                            <input
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm"
                                placeholder="Telefoonka (e.g. 61xxxxxxx)"
                            />
                        </div>

                        {/* Email */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                <Mail size={18} />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm"
                                placeholder="Email Address"
                            />
                        </div>

                        {/* Zone */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                <MapPin size={18} />
                            </div>
                            <input
                                name="zone"
                                type="text"
                                required
                                value={formData.zone}
                                onChange={handleChange}
                                className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm"
                                placeholder="Aaga (Zone)"
                            />
                        </div>

                        {/* Branch (Dropdown) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                <Building2 size={18} />
                            </div>
                            <select
                                name="branch_name"
                                required
                                value={formData.branch_name}
                                onChange={handleChange}
                                className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Dooro Laanta</option>
                                <option value="WSH">WSH</option>
                                <option value="DRS">DRS</option>
                                <option value="DKL">DKL</option>
                                <option value="MDN">MDN</option>
                                <option value="KPP">KPP</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                <Lock size={18} />
                            </div>
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm"
                                placeholder="Abuur Password"
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-100/60 backdrop-blur-xl border border-red-200/60 rounded-2xl flex items-start gap-2 text-xs font-bold text-red-700 animate-in fade-in slide-in-from-top-2 shadow-sm">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-1 sm:pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl sm:rounded-2xl font-bold text-sm shadow-[0_8px_20px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                <>
                                    <span>Is Diiwaan Geli</span>
                                    <ArrowRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="relative my-6 sm:my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white/60 backdrop-blur-xl px-4 py-2 rounded-full text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400 shadow-sm border border-white/60">
                                AMA
                            </span>
                        </div>
                    </div>

                    <Link to="/login"
                        className="group w-full py-3.5 sm:py-4 bg-gradient-to-r from-white/70 via-white/60 to-white/70 backdrop-blur-xl border-2 border-white/80 rounded-xl sm:rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95 shadow-[0_4px_20px_rgba(99,102,241,0.15)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <UserPlus size={18} className="text-indigo-600 group-hover:text-purple-600 transition-colors relative z-10 sm:w-5 sm:h-5" />
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative z-10">Gal haddii aad akoon leedahay</span>
                    </Link>
                </form>
            </div>

            <p className="fixed bottom-4 sm:bottom-6 text-[10px] sm:text-xs font-bold text-indigo-600/40 uppercase tracking-wider sm:tracking-widest px-4 text-center">
                Powered by Abdullahi Ibrahim Barre
            </p>
        </div>
    );
};

export default Signup;
