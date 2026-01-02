import { useNavigate } from 'react-router-dom';
import { FileText, Wifi, Heart, BookOpen, ArrowRight, Grid, CheckCircle2, Search, LogOut } from 'lucide-react';

export default function SupervisorServices() {
    const navigate = useNavigate();

    return (
        <div className="min-h-full bg-gray-50 pb-24">
            {/* Header with Graphics */}
            <div className="bg-gray-900 pt-8 pb-12 px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white shadow-lg mb-4 backdrop-blur-sm border border-white/10">
                        <Grid size={20} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Services</h1>
                    <p className="text-gray-400 font-medium">Tools & Shared Resources</p>
                </div>
            </div>

            {/* Cards Container */}
            <div className="px-5 -mt-8 pb-24 grid grid-cols-2 gap-4">

                {/* Approvals Card */}
                <ServiceCard
                    title="Approvals"
                    subtitle="Discounts"
                    icon={CheckCircle2}
                    gradient="bg-gradient-to-br from-green-500 to-emerald-700"
                    onClick={() => navigate('/supervisor/services/approvals')}
                />

                {/* Data Bundles Card */}
                <ServiceCard
                    title="Data Bundles"
                    subtitle="Internet"
                    icon={Wifi}
                    gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    onClick={() => navigate('/supervisor/services/data-bundles')}
                />

                {/* Hospitals Card */}
                <ServiceCard
                    title="Hospitals"
                    subtitle="Discounts"
                    icon={Heart}
                    gradient="bg-gradient-to-br from-pink-500 to-rose-600"
                    onClick={() => navigate('/supervisor/services/hospital-discounts')}
                />

                {/* Team Baafiye Card */}
                <ServiceCard
                    title="Baafiye"
                    subtitle="Team Analysis"
                    icon={Search}
                    gradient="bg-gradient-to-br from-violet-600 to-fuchsia-700"
                    onClick={() => navigate('/supervisor/services/baafiye')}
                />

                {/* Quran Card */}
                <ServiceCard
                    title="Quran"
                    subtitle="Holy Book"
                    icon={BookOpen}
                    gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
                    onClick={() => navigate('/supervisor/services/quran')}
                />

                {/* Logout Card - Red */}
                <ServiceCard
                    title="Sign Out"
                    subtitle="End Session"
                    icon={LogOut}
                    gradient="bg-gradient-to-br from-red-500 to-red-700"
                    onClick={() => {
                        if (confirm('Ma hubtaa inaad ka baxdo?')) {
                            localStorage.removeItem('beco_current_user');
                            window.location.href = '/';
                        }
                    }}
                />

            </div>
        </div>
    );
}

function ServiceCard({ title, subtitle, icon: Icon, gradient, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`${gradient} rounded-[2rem] p-5 text-white shadow-lg shadow-gray-200/50 relative overflow-hidden group cursor-pointer active:scale-95 transition-all duration-300 h-44 flex flex-col justify-between`}
        >
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/30 transition-colors"></div>

            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/20">
                    <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-black leading-tight">{title}</h3>
            </div>

            <div className="relative z-10 flex items-end justify-between">
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider">{subtitle}</p>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <ArrowRight size={14} />
                </div>
            </div>
        </div>
    );
}
