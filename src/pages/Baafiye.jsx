import React, { useState } from 'react';
import { Search, Filter, Phone, MapPin, ChevronRight, User } from 'lucide-react';

const mockDebtors = [
    { id: 1, name: 'Faarax Cali', location: 'Waaberi', amount: '$450', status: 'Pending', phone: '615-123456', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Faarax' },
    { id: 2, name: 'Caasho Muuse', location: 'Hodan', amount: '$1,200', status: 'Paid', phone: '615-654321', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caasho' },
    { id: 3, name: 'Jaamac Nuur', location: 'Warta Nabada', amount: '$300', status: 'Pending', phone: '615-987654', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jaamac' },
    { id: 4, name: 'Xaliimo Yarey', location: 'Xamar Weyne', amount: '$850', status: 'Overdue', phone: '615-555555', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xaliimo' },
    { id: 5, name: 'Maxamed Deeq', location: 'Kaaraan', amount: '$2,100', status: 'Pending', phone: '615-111222', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maxamed' },
];

export function Baafiye() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);

    const toggleRow = (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

    const filteredDebtors = mockDebtors.filter(debtor =>
        debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debtor.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24 space-y-6">
            <header className="pt-2">
                <h1 className="text-2xl font-bold text-gray-900">Baafiye 🔍</h1>
                <p className="text-gray-500 text-sm">Raadi oo maamul macaamiisha.</p>
            </header>

            <div className="flex gap-3">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Raadi magac..."
                        className="block w-full pl-10 pr-3 py-3.5 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="p-3.5 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3">
                {filteredDebtors.map((debtor) => (
                    <div
                        key={debtor.id}
                        className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedRow === debtor.id ? 'border-blue-500 shadow-md ring-4 ring-blue-500/10' : 'border-gray-100 shadow-sm hover:border-blue-200'
                            }`}
                    >
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => toggleRow(debtor.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full bg-gray-100 p-0.5 border border-gray-200">
                                    <img src={debtor.avatar} alt={debtor.name} className="w-full h-full rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{debtor.name}</h3>
                                    <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {debtor.location}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{debtor.amount}</p>
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${debtor.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                    debtor.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {debtor.status}
                                </div>
                            </div>
                        </div>

                        {expandedRow === debtor.id && (
                            <div className="bg-gray-50/50 p-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center text-gray-700 bg-white border border-gray-200 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                    Wac
                                </button>
                                <button className="flex items-center justify-center text-white bg-blue-600 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors">
                                    Diiwaangeli
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
