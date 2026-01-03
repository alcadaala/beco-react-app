import React, { useState } from 'react';
import { MapPin, Phone, Search, Building2, ArrowLeft, X, Clock, Stethoscope, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// HARDCODED HOSPITAL DATA WITH DETAILS
const HOSPITALS_DATA = [
    // 50% DISCOUNT
    {
        id: 'h1', name: 'Horyaal Hospital', location: 'Tarabuunka Road, Hodan', phone: '+252 614 269 444', discount: 50,
        about: 'Leading specialist hospital known for advanced surgery and emergency care.',
        services: ['General Surgery', 'Orthopedics', 'Emergency 24/7', 'Internal Medicine']
    },
    {
        id: 'h2', name: 'Hodan Hospital', location: 'Hodan District', phone: '', discount: 50,
        about: 'Community hospital providing accessible healthcare services to Hodan residents.',
        services: ['Maternity', 'Pediatrics', 'General Checkup', 'Pharmacy']
    },
    {
        id: 'h3', name: 'Somali Sudanese Hospital', location: 'Hodan, Soona key', phone: '+252 61 323 3333', discount: 50,
        about: 'International collaboration providing specialized treatments and diagnostics.',
        services: ['Cardiology', 'Neurology', 'Advanced Lab', 'Radiology']
    },
    { id: 'h4', name: 'Wadajir Hospital', location: 'Wadajir', phone: '', discount: 50, about: 'General hospital serving Wadajir district.', services: ['General Medicine', 'Emergency'] },
    { id: 'h5', name: 'Somali Syrian Hospital', location: 'Mogadishu', phone: '', discount: 50, about: 'Expert medical care with Syrian medical specialists.', services: ['Surgery', 'Eye Clinic', 'Dental'] },
    { id: 'h6', name: 'Somali Egyptian Hospital', location: 'Mogadishu', phone: '', discount: 50, about: 'Joint medical facility offering varied specialization.', services: ['Gynecology', 'Urology', 'General Surgery'] },

    // 40% DISCOUNT
    {
        id: 'h7', name: 'Kalkaal Specialty Hospital', location: 'Digfer Road, Hodan', phone: '+252 617 633 661', discount: 40,
        about: 'Premium specialty hospital with state-of-the-art facilities.',
        services: ['Neurosurgery', 'Cardiac Center', 'ICU/NICU', 'Dialysis']
    },
    { id: 'h8', name: 'Ibnu Sinaa Hospital', location: 'Mogadishu', phone: '', discount: 40, about: 'Named after the father of medicine, providing holistic care.', services: ['General Medicine', 'Pediatrics'] },
    { id: 'h9', name: 'Dalmar Specialist Hospital', location: 'Agagaarka KM5', phone: '+252 61 391 7070', discount: 40, about: 'Specialist center focused on advanced medical procedures.', services: ['Ophthalmology', 'Dental', 'ENT'] },
    { id: 'h10', name: 'Adan Cade Hospital', location: 'Mogadishu', phone: '', discount: 40, about: 'Modern facility dedicated to quality patient care.', services: ['Emergency', 'Maternity', 'Surgery'] },
    { id: 'h11', name: 'Horseed Hospital', location: 'Agagaarka KM5, Zoobe', phone: '+252 610 405 080', discount: 40, about: 'Central hospital with a wide range of medical services.', services: ['General Checkup', 'Lab Services'] },
    { id: 'h12', name: 'Macaani Hospital', location: 'KM13, Mogadishu', phone: '+252 61 502 4277', discount: 40, about: 'Serving the outskirts with essential medical care.', services: ['General Medicine', 'First Aid'] },
    { id: 'h13', name: 'Darul Shifaa Hospital', location: 'Mogadishu', phone: '', discount: 40, about: 'Center of healing with compassionate staff.', services: ['General Medicine', 'Pharmacy'] },
    { id: 'h14', name: 'Samakaal Hospital', location: 'Mogadishu', phone: '', discount: 40, about: 'Trusted healthcare provider in the region.', services: ['Outpatient', 'Diagnostics'] },
    { id: 'h15', name: 'Androcare Hospital', location: 'Mogadishu', phone: '', discount: 40, about: 'Specialized care for men\'s health and general medicine.', services: ['Urology', 'General Medicine'] },
    { id: 'h16', name: 'Al Casima Hospital', location: 'Mogadishu', phone: '', discount: 40, about: 'Capital city hospital with diverse medical departments.', services: ['Emergency', 'Surgery'] },

    // 30% DISCOUNT
    { id: 'h17', name: 'Horjoog Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Dedicated to community health and wellness.', services: ['General Checkup'] },
    { id: 'h18', name: 'Jazeera Specialist Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Specialist services near the airport road.', services: ['General Medicine', 'Travel Medicine'] },
    { id: 'h19', name: 'Duco Community Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Community-focused healthcare center.', services: ['MCH', 'General Medicine'] },
    { id: 'h20', name: 'Abuu Bashiir Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Private hospital offering personalized care.', services: ['Consultation', 'Lab'] },
    { id: 'h21', name: 'Daarusalaam Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Peaceful environment for recovery and treatment.', services: ['General Medicine', 'Inpatient'] },
    { id: 'h22', name: 'Welcare Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Quality care with a focus on patient welfare.', services: ['General Checkup', 'Emergency'] },
    { id: 'h23', name: 'Kaafi Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Sufficient care for all your family needs.', services: ['Family Medicine', 'Pediatrics'] },
    { id: 'h24', name: 'Darajaat Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Standard medical services.', services: ['General Medicine'] },
    { id: 'h25', name: 'Somali Pakistani Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Collaboration offering specialized Asian medical expertise.', services: ['Surgery', 'Internal Medicine'] },
    { id: 'h26', name: 'Eye Community Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Dedicated eye care center.', services: ['Ophthalmology', 'Optometry'] },
    { id: 'h27', name: 'Al Zahra Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Women and children specialized services.', services: ['Gynecology', 'Pediatrics'] },
    { id: 'h28', name: 'Royal Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Premium healthcare services.', services: ['VIP Ward', 'Specialist Consultation'] },
    { id: 'h29', name: 'Somali Specialist Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Expert specialists in various fields.', services: ['Cardiology', 'Neurology'] },
    { id: 'h30', name: 'Muqdisho Specialist Hospital', location: 'Yaaqshiid', phone: '+252 61 187 8787', discount: 30, about: 'Top-tier specialist hospital in Yaaqshiid.', services: ['Advanced Surgery', 'Diagnostics'] },
    { id: 'h31', name: 'Amoore Hospital', location: 'Mogadishu', phone: '', discount: 30, about: 'Accessible healthcare for the local community.', services: ['General Medicine'] },
    {
        id: 'h32', name: 'Shaafi Hospital', location: 'Hodon District, Mogadishu', phone: '+252 61 287 7778', discount: 30,
        about: 'Established by Somali doctors offering comprehensive specialized care and diagnostics.',
        services: ['Primary Care', 'Surgery', 'Emergency 24/7', 'Maternity']
    },
];

export default function HospitalDiscounts() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [activeTab, setActiveTab] = useState(50); // Default to 50% discount

    // Filter by Tab AND Search
    const filtered = HOSPITALS_DATA.filter(h => {
        const matchesTab = h.discount === activeTab;
        const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (h.location && h.location.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesTab && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="bg-white px-6 pt-8 pb-4 shadow-sm rounded-b-[2.5rem] sticky top-0 z-20">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center -ml-2 active:scale-95 transition-transform">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Hospital Discounts</h1>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Healthcare Benefits</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search hospitals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm text-sm"
                    />
                </div>

                {/* TABS (3 SECTIONS SIDE-BY-SIDE) */}
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                    <button
                        onClick={() => setActiveTab(50)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 50 ? 'bg-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className={`text-xl font-black ${activeTab === 50 ? 'text-red-500' : 'text-gray-400'}`}>50%</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide">Discount</span>
                    </button>

                    <button
                        onClick={() => setActiveTab(40)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 40 ? 'bg-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className={`text-xl font-black ${activeTab === 40 ? 'text-orange-500' : 'text-gray-400'}`}>40%</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide">Discount</span>
                    </button>

                    <button
                        onClick={() => setActiveTab(30)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 30 ? 'bg-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className={`text-xl font-black ${activeTab === 30 ? 'text-blue-500' : 'text-gray-400'}`}>30%</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide">Discount</span>
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="p-6">
                {/* List Header Info */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Showing {activeTab}% Off Hospitals
                    </span>
                    <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-md">
                        {filtered.length}
                    </span>
                </div>

                <div className="space-y-3 min-h-[50vh]">
                    {filtered.length === 0 ? (
                        <div className="text-center py-10">
                            <Building2 size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold text-sm">No hospitals found in this category.</p>
                        </div>
                    ) : (
                        filtered.map(hospital => (
                            <div
                                key={hospital.id}
                                onClick={() => setSelectedHospital(hospital)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md hover:border-gray-200 animate-in slide-in-from-bottom-2 fade-in"
                            >
                                {/* Icon Box */}
                                <div className="h-12 w-12 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 shrink-0 border border-stone-100 relative">
                                    <Building2 size={20} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-extrabold text-gray-900 text-sm leading-tight mb-0.5 truncate">{hospital.name}</h3>
                                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase">
                                        <MapPin size={10} className="mr-1" />
                                        {hospital.location || 'Mogadishu'}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="text-gray-300">
                                    <ArrowLeft size={18} className="rotate-180" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="h-24"></div>

            {/* DETAIL MODAL (Unchanged Logic, just re-included) */}
            {selectedHospital && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedHospital(null)}></div>
                    <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 relative z-10 animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black text-white mb-2 shadow-sm
                                     ${selectedHospital.discount >= 50 ? 'bg-red-500' : selectedHospital.discount >= 40 ? 'bg-orange-500' : 'bg-blue-500'}
                                `}>
                                    <CheckCircle2 size={12} />
                                    {selectedHospital.discount}% COVERED
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">{selectedHospital.name}</h2>
                            </div>
                            <button onClick={() => setSelectedHospital(null)} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="bg-white p-2.5 rounded-xl text-blue-500 shadow-sm">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-0.5">Location</h3>
                                    <p className="font-bold text-gray-900 text-sm">{selectedHospital.location || 'Mogadishu'}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={16} className="text-gray-400" />
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">About Hospital</h3>
                                </div>
                                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                    {selectedHospital.about || "This hospital is a verified Beco partner."}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <Stethoscope size={16} className="text-indigo-500" />
                                    <h3 className="text-xs font-black text-indigo-900 uppercase">Available Services</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedHospital.services && selectedHospital.services.length > 0 ? (
                                        selectedHospital.services.map((svc, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100/50">
                                                {svc}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">General services available.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            {selectedHospital.phone ? (
                                <a href={`tel:${selectedHospital.phone}`} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-center flex items-center justify-center gap-2 shadow-xl shadow-gray-200 active:scale-95 transition-transform">
                                    <Phone size={20} />
                                    Call Hospital Now
                                </a>
                            ) : (
                                <button disabled className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold text-center cursor-not-allowed">
                                    Phone Number Unavailable
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
