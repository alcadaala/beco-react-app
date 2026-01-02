import { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Clock, BadgePercent,
    AlertCircle, Search, Filter, Check, X
} from 'lucide-react';

export default function SupervisorDiscounts() {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Pending'); // Pending, Approved, Rejected

    // --- Safe Parse Helper ---
    const safeParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    // --- Load Data ---
    const loadRequests = () => {
        // In a real app, this comes from API. Here we maintain a separate list in LocalStorage.
        // If empty, we mock some for the demo.
        let loaded = safeParse('beco_discount_requests', []);

        if (loaded.length === 0) {
            const mockRequests = [
                { id: 1, customer: 'Halimo Yarey', sqn: '10234', amount: 50, discount: 5, reason: 'Loyal customer, always pays on time.', requester: 'Ahmed Yasin', date: new Date().toISOString(), status: 'Pending' },
                { id: 2, customer: 'Bakaro Shop A1', sqn: '55210', amount: 120, discount: 15, reason: 'Bulk payment negotiation.', requester: 'Fatima Ali', date: new Date(Date.now() - 3600000).toISOString(), status: 'Pending' },
                { id: 3, customer: 'Muno Hotel', sqn: '99100', amount: 300, discount: 50, reason: 'Owner complaint about outage.', requester: 'Mohamed Nur', date: new Date(Date.now() - 86400000).toISOString(), status: 'Approved' },
            ];
            loaded = mockRequests;
            localStorage.setItem('beco_discount_requests', JSON.stringify(loaded));
        }

        setRequests(loaded);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    // --- Filtering ---
    useEffect(() => {
        if (statusFilter === 'All') {
            setFilteredRequests(requests);
        } else {
            setFilteredRequests(requests.filter(r => r.status === statusFilter));
        }
    }, [statusFilter, requests]);

    // --- Actions ---
    const handleAction = (id, action) => {
        const updated = requests.map(req => {
            if (req.id === id) {
                return { ...req, status: action === 'approve' ? 'Approved' : 'Rejected' };
            }
            return req;
        });

        setRequests(updated);
        localStorage.setItem('beco_discount_requests', JSON.stringify(updated));
    };

    return (
        <div className="flex flex-col min-h-screen bg-stone-50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100 px-4 py-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Approvals</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase">Discount Requests</p>
                    </div>
                    <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-xs font-bold flex items-center">
                        <BadgePercent size={14} className="mr-1" />
                        {requests.filter(r => r.status === 'Pending').length} Pending
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
                    {['Pending', 'Approved', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === status
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="p-3 space-y-3">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <CheckCircle2 size={48} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-bold text-gray-400">No {statusFilter.toLowerCase()} requests.</p>
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            {/* Status Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${req.status === 'Approved' ? 'bg-green-500' :
                                    req.status === 'Rejected' ? 'bg-red-500' :
                                        'bg-orange-400'
                                }`}></div>

                            <div className="pl-3">
                                {/* Header Row */}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base">{req.customer}</h3>
                                        <p className="text-[10px] font-mono font-bold text-gray-400">SQN: {req.sqn}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-gray-900">
                                            <span className="text-xs font-medium text-gray-400 mr-0.5">$</span>
                                            {req.discount}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Off</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 line-through">${req.amount}</p>
                                    </div>
                                </div>

                                {/* Reason & Requester */}
                                <div className="bg-gray-50 p-2 rounded-xl mb-3">
                                    <p className="text-xs text-gray-600 italic mb-1">"{req.reason}"</p>
                                    <div className="flex justify-between items-center border-t border-gray-200 pt-1 mt-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                                            Req by: <span className="text-gray-600">{req.requester}</span>
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 flex items-center">
                                            <Clock size={10} className="mr-1" />
                                            {new Date(req.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons (Only for Pending) */}
                                {req.status === 'Pending' && (
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <button
                                            onClick={() => handleAction(req.id, 'reject')}
                                            className="flex items-center justify-center py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors"
                                        >
                                            <X size={16} className="mr-1.5" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'approve')}
                                            className="flex items-center justify-center py-2.5 rounded-xl bg-green-900 text-white font-bold text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <Check size={16} className="mr-1.5" />
                                            Approve
                                        </button>
                                    </div>
                                )}

                                {req.status !== 'Pending' && (
                                    <div className={`mt-2 text-center py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${req.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {req.status}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
