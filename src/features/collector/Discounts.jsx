import { useState, useEffect } from 'react';
import { BadgePercent, Phone, Calendar, Search, Tag, AlertCircle, Share2, CheckCircle2, Copy } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../../lib/mockData';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Discounts() {
    const [customers, setCustomers] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // AUTH CONTEXT
    const currentUser = JSON.parse(localStorage.getItem('beco_current_user') || 'null');

    useEffect(() => {
        if (!currentUser || !currentUser.id) return;

        let unsubscribe = () => { };

        const setupRealtimeListener = async () => {
            try {
                // 1. ISOLATION: Fetch only this collector's 'Discount' customers from Firestore
                const zone = currentUser.branch || 'General';
                const q = query(
                    collection(db, 'zones', zone, 'customers'),
                    where('collector_id', '==', currentUser.id),
                    where('status', '==', 'Discount')
                );

                // REAL-TIME LISTENER
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const dbDiscounts = snapshot.docs.map(doc => ({
                        id: doc.id,
                        sqn: doc.id,
                        ...doc.data()
                    }));

                    if (dbDiscounts.length > 0) {
                        setCustomers(dbDiscounts);
                    } else {
                        // Fallback to local if DB is empty
                        const localData = JSON.parse(localStorage.getItem('baafiye_local_data') || '[]');
                        const localDiscounts = localData.filter(c => c.status === 'Discount');
                        setCustomers(localDiscounts);
                    }
                }, (error) => {
                    console.error("Error in discount listener:", error);
                    // Fallback to local on error
                    const localData = JSON.parse(localStorage.getItem('baafiye_local_data') || '[]');
                    const localDiscounts = localData.filter(c => c.status === 'Discount');
                    setCustomers(localDiscounts);
                });

            } catch (e) {
                console.error("Error setting up listener", e);
            }
        };

        setupRealtimeListener();

        // Cleanup
        return () => unsubscribe();
    }, [currentUser?.id]);

    const toggleSelection = (sqn) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(sqn)) {
            newSet.delete(sqn);
        } else {
            newSet.add(sqn);
        }
        setSelectedIds(newSet);
    };

    const handleShare = async () => {
        const selectedCustomers = customers.filter(c => selectedIds.has(c.sqn));
        if (selectedCustomers.length === 0) return;

        // Custom "Beautiful" Formatter - SOMALI VERSION
        let text = "📋 *Warbixinta Discount-ka (Discount Requests)*\n\n";

        selectedCustomers.forEach((c, idx) => {
            const discount = parseFloat(c.discountAmount || 0);
            const paid = parseFloat(c.paidAmount || 0);
            const balance = parseFloat(c.balance || 0);

            text += `${idx + 1}. *${c.name}*\n`;
            text += `   🆔 SQN: ${c.sqn}\n`;
            text += `   💰 Balance: $${balance}\n`;
            text += `   💵 Laga Hayo: $${paid}\n`;
            text += `   🏷️ Discount: $${discount}\n`;
            text += "\n";
        });

        const totalPaid = selectedCustomers.reduce((sum, c) => sum + parseFloat(c.paidAmount || 0), 0);
        const totalDiscount = selectedCustomers.reduce((sum, c) => sum + parseFloat(c.discountAmount || 0), 0);

        text += "------------------\n";
        text += `📉 Total Laga Hayo: $${totalPaid.toFixed(2)}\n`;
        text += `🏷️ Total Discount: $${totalDiscount.toFixed(2)}`;

        // Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Discount Requests',
                    text: text,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            // Fallback to Clipboard
            try {
                await navigator.clipboard.writeText(text);
                alert("Copied to clipboard!\n\n" + text);
            } catch (err) {
                alert("Feature not supported on this browser.");
            }
        }
    };

    const selectAll = () => {
        if (selectedIds.size === customers.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(customers.map(c => c.sqn));
            setSelectedIds(allIds);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 pb-24 relative font-sans">
            {/* Header - PREMIUM GRADIENT THEME */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-5 border-b border-indigo-500/30 shadow-lg sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Active Discounts</h1>
                        <p className="text-xs text-indigo-100 font-bold mt-1">
                            {customers.length} request{customers.length !== 1 ? 's' : ''} pending approval
                        </p>
                    </div>
                    <button
                        onClick={selectAll}
                        className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl active:scale-95 transition-all backdrop-blur-sm border border-white/10 shadow-sm"
                    >
                        {selectedIds.size === customers.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
            </div>

            {/* TOTAL SUMMARY CARD */}
            {customers.length > 0 && (
                <div className="mx-6 mt-4 p-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-xl text-white relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Tag size={80} />
                    </div>
                    <div className="flex justify-between items-end relative z-10">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Laga Hayo</p>
                            <h2 className="text-2xl font-black text-emerald-400">
                                ${customers.reduce((sum, c) => sum + parseFloat(c.paidAmount || 0), 0).toFixed(2)}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Discount</p>
                            <h2 className="text-xl font-black text-white">
                                ${customers.reduce((sum, c) => sum + parseFloat(c.discountAmount || 0), 0).toFixed(2)}
                            </h2>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3 overflow-y-auto px-6 pt-4 pb-24">
                {customers.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center text-gray-400">
                        <Tag size={48} className="mb-3 opacity-20" />
                        <p>No active discounts found.</p>
                        <p className="text-xs mt-1">Mark a customer as 'Discount' in Baafiye to see them here.</p>
                    </div>
                ) : (
                    customers.map((customer, i) => {
                        const isSelected = selectedIds.has(customer.sqn);
                        return (
                            <div
                                key={`${customer.sqn}-${i}`}
                                onClick={() => toggleSelection(customer.sqn)}
                                className={`rounded-3xl p-5 shadow-sm border relative overflow-hidden group transition-all cursor-pointer active:scale-95 ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500' : 'bg-white border-gray-100 hover:shadow-md'}`}
                            >
                                {/* Selection Indicator */}
                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200 bg-white'}`}>
                                    {isSelected && <CheckCircle2 size={14} className="text-white" />}
                                </div>

                                <div className="pr-8">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                            %
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{customer.name}</h3>
                                            <p className="text-[10px] text-gray-400 font-mono font-bold bg-gray-50 px-1.5 py-0.5 rounded inline-block">SQN: {customer.sqn}</p>
                                        </div>
                                    </div>

                                    {/* DATA GRID */}
                                    <div className="grid grid-cols-3 gap-2 mt-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-50">

                                        {/* BALANCE */}
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Balance</span>
                                            <span className="text-xs font-black text-gray-800">${customer.balance}</span>
                                        </div>

                                        {/* LAGA HAYO */}
                                        <div className="flex flex-col border-l border-gray-200 pl-3">
                                            <span className="text-[9px] font-bold text-emerald-600 uppercase">Laga Hayo</span>
                                            <span className="text-xs font-black text-emerald-600">${customer.paidAmount || '0'}</span>
                                        </div>

                                        {/* DISCOUNT */}
                                        <div className="flex flex-col border-l border-gray-200 pl-3">
                                            <span className="text-[9px] font-bold text-red-500 uppercase">Discount</span>
                                            <span className="text-xs font-black text-red-500">-${customer.discountAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* FLOATING ACTION BUTTON */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-24 left-0 right-0 px-6 z-40 flex justify-center pointer-events-none">
                    <button
                        onClick={handleShare}
                        className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl shadow-xl font-bold flex items-center space-x-3 pointer-events-auto transform transition-all active:scale-95 animate-in slide-in-from-bottom-5"
                    >
                        <Share2 size={18} />
                        <span>Share ({selectedIds.size}) Requests</span>
                    </button>
                </div>
            )}
        </div>
    );
}
