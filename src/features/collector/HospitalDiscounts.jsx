import React, { useState } from 'react';
import { MapPin, Phone, Search, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// HARDCODED HOSPITAL DATA (As requested)
const HOSPITALS_DATA = [
    // 50% DISCOUNT
    { id: 'h1', name: 'Horyaal Hospital', location: 'Tarabuunka Road, Hodan', phone: '+252 614 269 444', discount: 50 },
    { id: 'h2', name: 'Hodan Hospital', location: 'Hodan District', phone: '', discount: 50 },
    { id: 'h3', name: 'Somali Sudanese Hospital', location: 'Hodan, Soona key', phone: '+252 61 323 3333', discount: 50 },
    { id: 'h4', name: 'Wadajir Hospital', location: 'Wadajir', phone: '', discount: 50 },
    { id: 'h5', name: 'Somali Syrian Hospital', location: 'Mogadishu', phone: '', discount: 50 },
    { id: 'h6', name: 'Somali Egyptian Hospital', location: 'Mogadishu', phone: '', discount: 50 },

    // 40% DISCOUNT
    { id: 'h7', name: 'Kalkaal Specialty Hospital', location: 'Digfer Road, Hodan', phone: '+252 617 633 661', discount: 40 },
    { id: 'h8', name: 'Ibnu Sinaa Hospital', location: 'Mogadishu', phone: '', discount: 40 },
    { id: 'h9', name: 'Dalmar Specialist Hospital', location: 'Agagaarka KM5', phone: '+252 61 391 7070', discount: 40 },
    { id: 'h10', name: 'Adan Cade Hospital', location: 'Mogadishu', phone: '', discount: 40 },
    { id: 'h11', name: 'Horseed Hospital', location: 'Agagaarka KM5, Zoobe', phone: '+252 610 405 080', discount: 40 },
    { id: 'h12', name: 'Macaani Hospital', location: 'KM13, Mogadishu', phone: '+252 61 502 4277', discount: 40 },
    { id: 'h13', name: 'Darul Shifaa Hospital', location: 'Mogadishu', phone: '', discount: 40 },
    { id: 'h14', name: 'Samakaal Hospital', location: 'Mogadishu', phone: '', discount: 40 },
    { id: 'h15', name: 'Androcare Hospital', location: 'Mogadishu', phone: '', discount: 40 },
    { id: 'h16', name: 'Al Casima Hospital', location: 'Mogadishu', phone: '', discount: 40 },

    // 30% DISCOUNT
    { id: 'h17', name: 'Horjoog Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h18', name: 'Jazeera Specialist Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h19', name: 'Duco Community Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h20', name: 'Abuu Bashiir Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h21', name: 'Daarusalaam Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h22', name: 'Welcare Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h23', name: 'Kaafi Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h24', name: 'Darajaat Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h25', name: 'Somali Pakistani Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h26', name: 'Eye Community Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h27', name: 'Al Zahra Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h28', name: 'Royal Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h29', name: 'Somali Specialist Hospital', location: 'Mogadishu', phone: '', discount: 30 },
    { id: 'h30', name: 'Muqdisho Specialist Hospital', location: 'Yaaqshiid', phone: '+252 61 187 8787', discount: 30 },
    { id: 'h31', name: 'Amoore Hospital', location: 'Mogadishu', phone: '', discount: 30 },
];

export default function HospitalDiscounts() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // Removed DB Fetching Logic. Using static data.

    const filtered = HOSPITALS_DATA.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.location && h.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Group by Discount
    const grouped = filtered.reduce((acc, h) => {
        const disc = h.discount || 0;
        if (!acc[disc]) acc[disc] = [];
        acc[disc].push(h);
        return acc;
    }, {});

    const discounts = Object.keys(grouped).sort((a, b) => b - a); // 50, 40, 30...

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="bg-white px-6 pt-8 pb-6 shadow-sm rounded-b-[2.5rem] sticky top-0 z-20">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center -ml-2">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Hospital Discounts</h1>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Healthcare Benefits</p>
                        </div>
                    </div>
                    <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                        <Building2 size={24} />
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search hospitals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
                {filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-400 font-bold">No hospitals found.</p>
                    </div>
                ) : (
                    discounts.map(disc => (
                        <div key={disc} className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`font-black text-xs px-3 py-1.5 rounded-lg shadow-md transform -skew-x-12 text-white
                                    ${disc >= 50 ? 'bg-red-600' : disc >= 40 ? 'bg-orange-500' : 'bg-blue-500'}
                                `}>
                                    {disc}% OFF
                                </div>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <div className="grid gap-3">
                                {grouped[disc].map(hospital => (
                                    <div key={hospital.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-all">
                                        <div className="h-14 w-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 shrink-0 border border-stone-100 overflow-hidden relative">
                                            <Building2 size={24} />
                                            <div className={`absolute top-0 right-0 px-1.5 py-0.5 text-[8px] font-black text-white rounded-bl-lg
                                                ${disc >= 50 ? 'bg-red-600' : disc >= 40 ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                                {disc}%
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-extrabold text-gray-900 text-sm leading-tight mb-1 truncate pr-2">{hospital.name}</h3>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase">
                                                    <MapPin size={10} className="mr-1" />
                                                    {hospital.location || 'Mogadishu'}
                                                </div>
                                            </div>
                                        </div>
                                        {hospital.phone && (
                                            <a href={`tel:${hospital.phone}`} className="h-10 w-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm">
                                                <Phone size={18} fill="currentColor" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="h-24"></div>
        </div>
    );
}
