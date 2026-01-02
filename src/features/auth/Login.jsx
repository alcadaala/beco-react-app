import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, Fingerprint, Loader2, User, UserPlus, MapPin, Building2, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { signIn, signUp } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'

    // Login State
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    // Signup State
    const [signupData, setSignupData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        zone: '',
        branch: ''
    });

    // Forgot Password State
    const [forgotStage, setForgotStage] = useState(1);
    const [forgotData, setForgotData] = useState({ email: '' });

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (authMode === 'forgot') {
                // --- FORGOT PASSWORD (Supabase) ---
                setError("Password reset requires email configuration. Please contact Admin.");
            } else {
                // --- LOGIN LOGIC (Supabase) ---
                console.log('Attempting login...');
                const result = await signIn(credentials.email, credentials.password);

                if (result.error) {
                    throw result.error;
                }

                console.log('Login successful, navigating...');
                // Navigate immediately - signIn handles state update and profile fetch
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[40%] -left-[20%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-br from-violet-400/30 to-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute -bottom-[40%] -right-[20%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-[20%] right-[10%] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-gradient-to-br from-pink-400/20 to-rose-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Glass Card */}
            <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/40 p-6 sm:p-8 md:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                {/* Logo Section */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center p-3 sm:p-4 md:p-5 mb-4 sm:mb-5 bg-white/60 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-white/60 hover:scale-105 transition-transform duration-300">
                        <img src="/logo.png" alt="Beco Logo" className="h-10 sm:h-12 w-auto" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight mb-2">
                        {authMode === 'signup' ? 'Create Account' : authMode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
                    </h1>
                    <p className="text-gray-600 font-semibold text-xs sm:text-sm px-2">
                        {authMode === 'signup' ? 'Join the Beco Energy team' : authMode === 'forgot' ? 'Recover your account access' : 'Sign in to manage your account'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {authMode === 'signup' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            {[
                                { icon: User, ph: "Full Name", val: signupData.name, key: 'name', type: 'text' },
                                { icon: Phone, ph: "Phone Number", val: signupData.phone, key: 'phone', type: 'tel' },
                                { icon: Mail, ph: "Email / User ID", val: signupData.email, key: 'email', type: 'text' },
                                { icon: MapPin, ph: "Zone Name", val: signupData.zone, key: 'zone', type: 'text' },
                                { icon: Building2, ph: "Branch Name", val: signupData.branch, key: 'branch', type: 'text' },
                                { icon: Lock, ph: "Create Password", val: signupData.password, key: 'password', type: 'password' }
                            ].map((field, i) => (
                                <div key={i} className="relative group">
                                    <field.icon size={18} className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                                    <input type={field.type} placeholder={field.ph} value={field.val}
                                        onChange={e => setSignupData({ ...signupData, [field.key]: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm" />
                                </div>
                            ))}
                        </div>
                    )}

                    {authMode === 'forgot' && (
                        <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                            {forgotStage === 1 && (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                        <Mail size={18} />
                                    </div>
                                    <input type="text" placeholder="Enter your email" value={forgotData.email}
                                        onChange={e => setForgotData({ ...forgotData, email: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm" />
                                </div>
                            )}
                            {forgotStage === 2 && (
                                <div className="space-y-2">
                                    <div className="p-3 bg-blue-100/60 backdrop-blur-xl text-blue-700 text-xs rounded-xl mb-2 font-semibold border border-blue-200/50">Code sent to {forgotData.email}</div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                            <Lock size={18} />
                                        </div>
                                        <input type="text" placeholder="Enter 6-digit code" value={forgotData.code}
                                            onChange={e => setForgotData({ ...forgotData, code: e.target.value })}
                                            className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm" />
                                    </div>
                                </div>
                            )}
                            {forgotStage === 3 && (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                        <Lock size={18} />
                                    </div>
                                    <input type="password" placeholder="New Password" value={forgotData.newPassword}
                                        onChange={e => setForgotData({ ...forgotData, newPassword: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm" />
                                </div>
                            )}
                        </div>
                    )}

                    {authMode === 'login' && (
                        <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-left-4 duration-300">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                    <Mail size={16} className="sm:hidden" />
                                    <Mail size={18} className="hidden sm:block" />
                                </div>
                                <input type="text" placeholder="Email or Agent ID" value={credentials.email}
                                    onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                    className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/50 backdrop-blur-xl border border-white/60 rounded-xl sm:rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm hover:shadow-md" />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 h-full text-indigo-400 group-focus-within:text-indigo-600 transition-colors flex items-center z-10">
                                    <Lock size={16} className="sm:hidden" />
                                    <Lock size={18} className="hidden sm:block" />
                                </div>
                                <input type="password" placeholder="Password" value={credentials.password}
                                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                    className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/50 backdrop-blur-xl border border-white/60 rounded-xl sm:rounded-2xl text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white/70 transition-all placeholder-gray-500 shadow-sm hover:shadow-md" />
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => { setAuthMode('forgot'); setError(''); setSuccessMsg(''); }} className="text-xs font-bold text-indigo-600 hover:text-purple-600 transition-colors">
                                    Forgot Password?
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-100/60 backdrop-blur-xl border border-red-200/60 rounded-2xl flex items-start gap-2 text-xs font-bold text-red-700 animate-in fade-in slide-in-from-top-2 shadow-sm">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-4 bg-green-100/60 backdrop-blur-xl border border-green-200/60 rounded-2xl flex items-start gap-2 text-xs font-bold text-green-700 animate-in fade-in slide-in-from-top-2 shadow-sm">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{successMsg}</span>
                        </div>
                    )}

                    <div className="pt-1 sm:pt-2">
                        <button type="submit" disabled={isLoading}
                            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl sm:rounded-2xl font-bold text-sm shadow-[0_8px_20px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70">
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                                <>
                                    <span>
                                        {authMode === 'signup' ? 'Register' :
                                            authMode === 'forgot' ? (forgotStage === 1 ? 'Send Code' : forgotStage === 2 ? 'Verify Code' : 'Reset Password') :
                                                'Sign In'}
                                    </span>
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
                                OR
                            </span>
                        </div>
                    </div>

                    <Link to="/signup"
                        className="group w-full py-3.5 sm:py-4 bg-gradient-to-r from-white/70 via-white/60 to-white/70 backdrop-blur-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 border-2 border-white/80 rounded-xl sm:rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95 shadow-[0_4px_20px_rgba(99,102,241,0.15)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <UserPlus size={18} className="text-indigo-600 group-hover:text-purple-600 transition-colors relative z-10 sm:w-5 sm:h-5" />
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative z-10">Create New Account</span>
                    </Link>
                </form>
            </div>

            <p className="fixed bottom-4 sm:bottom-6 text-[10px] sm:text-xs font-bold text-indigo-600/40 uppercase tracking-wider sm:tracking-widest px-4 text-center">
                Powered by Abdullahi Ibrahim Barre
            </p>
        </div>
    );
}
