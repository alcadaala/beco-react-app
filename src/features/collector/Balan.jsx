import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, User, CheckCircle2, Pencil, RefreshCw } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import CustomerEditModal from '../../components/CustomerEditModal';

export default function Balan() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'customers'),
                where('status', '==', 'Balan')
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                sqn: doc.id, // Ensure sqn/id is captured, assuming doc ID is sqn or use doc.data().sqn
                ...doc.data()
            }));

            if (data) {
                // Client-side sort if needed, e.g. by name or date field
                // Assuming date is string D/M/Y or Y-M-D. 
                // Just keeping raw order or simple sort.
                setAppointments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleSaveCustomer = async (updatedCustomer) => {
        // Optimistic update
        setAppointments(prev => prev.map(c => c.sqn === updatedCustomer.sqn ? updatedCustomer : c));
        if (updatedCustomer.status !== 'Balan') {
            setAppointments(prev => prev.filter(c => c.sqn !== updatedCustomer.sqn));
        }
        setSelectedCustomer(null);

        try {
            // Assume SQN is the ID based on previous Baafiye logic
            const docId = updatedCustomer.sqn;
            if (!docId) throw new Error("No ID found");

            const customerRef = doc(db, 'customers', String(docId));

            await updateDoc(customerRef, updatedCustomer);

        } catch (e) {
            console.error("Update failed", e);
            fetchAppointments(); // Revert on failure
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-4 space-y-4 pb-24 relarive font-sans">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-xs text-gray-500">Scheduled collections & callbacks</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAppointments} className="bg-gray-200 p-2 rounded-full text-gray-600 active:scale-90 transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <Calendar size={20} />
                    </div>
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto pb-20 no-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div></div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center text-gray-400">
                        <Clock size={48} className="mb-3 opacity-20" />
                        <p className="font-bold">No active appointments.</p>
                        <p className="text-xs mt-1">Set status to 'Balan' in Baafiye to schedule.</p>
                    </div>
                ) : (
                    appointments.map((apt, i) => (
                        <div
                            key={`${apt.sqn}-${i}`}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden active:scale-[0.99] transition-transform animate-in slide-in-from-bottom-2"
                            style={{ animationDelay: `${i * 0.05}s` }}
                            onClick={() => setSelectedCustomer(apt)}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shadow-inner">
                                        {apt.date ? apt.date.split('/')[0] : 'TD'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{apt.name}</h3>
                                        <div className="flex gap-1 mt-0.5">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                                                {apt.fahfahin || 'General'}
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200">
                                                {apt.sqn}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Due Amount</span>
                                    <span className="font-black text-gray-900 text-lg">${apt.balance}</span>
                                </div>
                            </div>

                            <div className="flex space-x-2 mt-auto">
                                <a
                                    href={`tel:${apt.tell}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 bg-gray-50 hover:bg-gray-100 py-2.5 rounded-xl flex items-center justify-center text-gray-700 text-xs font-bold transition-colors border border-gray-200/50"
                                >
                                    <Phone size={14} className="mr-2" />
                                    Call
                                </a>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCustomer(apt);
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl flex items-center justify-center text-white text-xs font-bold transition-colors shadow-lg shadow-blue-200"
                                >
                                    <Pencil size={14} className="mr-2" />
                                    Manage
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedCustomer && (
                <CustomerEditModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    onSave={handleSaveCustomer}
                />
            )}
        </div>
    );
}
