import { Search, MapPin, ArrowLeft, Tag, Sparkles, Percent, Phone, Info, Stethoscope, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { createPortal } from 'react-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const FILTERS = [
    { label: 'All', value: 'all', icon: Sparkles },
    { label: '50% Off', value: 50, icon: Percent },
    { label: '40% Off', value: 40, icon: Tag },
    { label: '30% Off', value: 30, icon: Tag },
];

function HospitalDetailsModal({ hospital, onClose }) {
    if (!hospital) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Content */}
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300">
                {/* Handle Bar (Mobile) */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-start space-x-4 mb-6">
                    <div className={cn(
                        "h-16 w-16 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg",
                        hospital.discount >= 50 ? "bg-gradient-to-br from-rose-500 to-red-600" :
                            hospital.discount >= 40 ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                                "bg-gradient-to-br from-blue-400 to-indigo-600"
                    )}>
                        <span className="text-xl font-black">{hospital.discount}%</span>
                        <span className="text-[10px] font-bold uppercase opacity-90">Off</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight pr-8">{hospital.name}</h2>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                            <MapPin size={14} className="mr-1" />
                            {hospital.location}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <a href={`tel:${hospital.phone}`} className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                        <Phone size={18} className="mr-2" />
                        Call Now
                    </a>
                    <button className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-transform">
                        <MapPin size={18} className="mr-2" />
                        Directions
                    </button>
                </div>

                {/* Details */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                            <Info size={16} className="mr-2 text-blue-500" />
                            About
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                            {hospital.description || "Partner hospital providing quality healthcare services."}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                            <Stethoscope size={16} className="mr-2 text-blue-500" />
                            Services
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {hospital.services?.map((service, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">
                                    {service}
                                </span>
                            )) || <span className="text-sm text-gray-500">General Medical Services</span>}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                        <Clock size={14} />
                        <span>Open 24 Hours • Emergency Services Available</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function HospitalDiscounts() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [hospitalsList, setHospitalsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load Data
    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                setLoading(true);
                const q = query(
                    collection(db, 'hospitals'),
                    where('status', '==', 'Active')
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (data.length > 0) {
                    setHospitalsList(data);
                } else {
                    // Dummy data fallback for demo
                    setHospitalsList([
                        { id: '1', name: 'Mogadishu City Hospital', location: 'Maka Al Mukarama Rd', discount: 50, phone: '858392', services: ['General', 'Dental', 'Optics'], description: 'Leading private hospital with advanced diagnostics.' },
                        { id: '2', name: 'Somali Red Crescent', location: 'Wadajir District', discount: 30, phone: '445566', services: ['Emergency', 'Maternity'], description: 'Humanitarian organization providing subsidized care.' },
                        { id: '3', name: 'Digfer Hospital (Training)', location: 'Hodan', discount: 40, phone: '112233', services: ['Surgery', 'Cardiology', 'Pediatrics'], description: 'University teaching hospital with specialists.' }
                    ]);
                }
            } catch (err) {
                console.error("Error loading hospitals:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHospitals();
    }, []);

    const filteredHospitals = hospitalsList.filter(h => {
        const matchesSearch = (h.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'all' || h.discount == activeFilter; // Loose eq for number/string diffs
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header with Search */}
            <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <div className="p-4 flex items-center space-x-3 pb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search partner hospitals..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none text-sm font-medium text-gray-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Fancy Filter Tabs */}
                <div className="flex px-4 pb-4 space-x-3 overflow-x-auto scrollbar-hide">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value)}
                            className={cn(
                                "flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 border",
                                activeFilter === filter.value
                                    ? "bg-black text-white border-black shadow-lg shadow-black/20"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}
                        >
                            <filter.icon size={14} className={activeFilter === filter.value ? "text-yellow-400" : "text-gray-400"} />
                            <span>{filter.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {/* Helper text if showing specific category */}
                {activeFilter !== 'all' && (
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 animate-in fade-in slide-in-from-left-2">
                        Showing {activeFilter}% Discount Partners
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-400">Loading partners...</p>
                    </div>
                )}

                {!loading && filteredHospitals.map((hospital, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedHospital(hospital)}
                        className="group bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-all hover:shadow-md cursor-pointer animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-both"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-center space-x-4">
                            {/* Graphical Badge */}
                            <div className={cn(
                                "relative h-14 w-14 rounded-2xl flex flex-col items-center justify-center shadow-inner overflow-hidden",
                                hospital.discount >= 50 ? "bg-gradient-to-br from-rose-500 to-red-600 text-white" :
                                    hospital.discount >= 40 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" :
                                        "bg-gradient-to-br from-blue-400 to-indigo-600 text-white"
                            )}>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xl font-black tracking-tighter shadow-black/10 drop-shadow-md">{hospital.discount}%</span>
                                <span className="text-[9px] font-bold uppercase opacity-80">Off</span>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{hospital.name}</h3>
                                <div className="flex items-center text-xs text-gray-400 mt-1">
                                    <MapPin size={12} className="mr-1 text-gray-300" />
                                    {hospital.location}
                                </div>
                            </div>
                        </div>

                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <ArrowLeft size={16} className="rotate-180" />
                        </div>
                    </div>
                ))}

                {!loading && filteredHospitals.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                        <Search size={48} className="text-gray-200" />
                        <p>No hospitals found</p>
                        <button
                            onClick={() => { setSearchTerm(''); setActiveFilter('all'); }}
                            className="text-sm text-blue-600 font-bold hover:underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* DETAILS MODAL */}
            <HospitalDetailsModal
                hospital={selectedHospital}
                onClose={() => setSelectedHospital(null)}
            />
        </div>
    );
}
