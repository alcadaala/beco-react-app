import { useState, useEffect } from 'react';
import { BadgePercent, Phone, Calendar, Search, Tag, AlertCircle, Share2, CheckCircle2, Copy } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../../lib/mockData';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Discounts() {
    const [customers, setCustomers] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // AUTH CONTEXT
    const currentUser = JSON.parse(localStorage.getItem('beco_current_user') || 'null');

    useEffect(() => {
        const loadDiscounts = async () => {
            if (!currentUser || !currentUser.id) return;

            try {
                // 1. ISOLATION: Fetch only this collector's 'Discount' customers from Firestore
                // This ensures data persists on refresh and is private to them.
                const zone = currentUser.branch || 'General';
                const q = query(
                    collection(db, 'zones', zone, 'customers'),
                    where('collector_id', '==', currentUser.id),
                    where('status', '==', 'Discount')
                );

                const snapshot = await getDocs(q);
                const dbDiscounts = snapshot.docs.map(doc => ({
                    id: doc.id, // Ensure ID is captured
                    sqn: doc.id, // Map ID to SQN if that's the convention
                    ...doc.data()
                }));

                // 2. MERGE with Local Storage (Optimization/Offline support)
                // We prioritize DB result but fill gaps if needed, or strictly use DB as requested ("xogtana aysan bixin karin").
                // User said "Active Discounts", so DB is best source of truth.

                if (dbDiscounts.length > 0) {
                    setCustomers(dbDiscounts);
                } else {
                    // Fallback check on localStorage purely for immediate UI if DB is empty but local has pending writes
                    const localData = JSON.parse(localStorage.getItem('baafiye_local_data') || '[]');
                    const localDiscounts = localData.filter(c => c.status === 'Discount');
                    setCustomers(localDiscounts);
                }

            } catch (e) {
                console.error("Error loading discounts", e);
                // Last resort fallback to local
                const localData = JSON.parse(localStorage.getItem('baafiye_local_data') || '[]');
                const localDiscounts = localData.filter(c => c.status === 'Discount');
                setCustomers(localDiscounts);
            }
        };

        loadDiscounts();
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

        // Custom "Beautiful" Formatter - SIMPLIFIED
        let text = "📋 *Discount Approvals Requested*\n\n";

        selectedCustomers.forEach((c, idx) => {
            const discount = parseFloat(c.discountAmount || 0);

            text += `${idx + 1}. *${c.name}*\n`;
            text += `   🆔 SQN: ${c.sqn}\n`;
            if (discount > 0) {
                text += `   🏷️ Discount: $${discount}\n`;
            } else {
                text += `   🏷️ Discount: (Not specified)\n`;
            }
            text += "\n";
        });

        const totalAmount = selectedCustomers.reduce((sum, c) => sum + parseFloat(c.discountAmount || 0), 0);
        text += "------------------\n";
        text += `Total Discounts: $${totalAmount}`;

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

            <div className="space-y-3 overflow-y-auto px-4 pt-4 pb-20">
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
                                className={`rounded-2xl p-4 shadow-sm border relative overflow-hidden group transition-all cursor-pointer active:scale-98 ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-100'}`}
                            >
                                {/* Selection Indicator */}
                                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'}`}>
                                    {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                </div>

                                <div className="flex justify-between items-start relative z-10 pr-8">
                                    <div className="flex items-start space-x-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner transition-colors ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-purple-50 text-purple-600'}`}>
                                            %
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{customer.name}</h3>
                                            <p className="text-xs text-gray-400 font-mono inline-block mt-0.5">SQN: {customer.sqn}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pl-[52px] pr-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            {customer.discountAmount && (
                                                <div className="text-xs font-medium text-red-500">
                                                    Discount: -${customer.discountAmount}
                                                </div>
                                            )}
                                            <div className="text-sm font-bold text-gray-900">
                                                Balance: ${customer.balance}
                                            </div>
                                        </div>

                                        <div className="text-[10px] text-gray-400 font-medium">
                                            {customer.date || 'Today'}
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
