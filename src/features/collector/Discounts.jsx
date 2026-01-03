import { useState, useEffect } from 'react';
import { BadgePercent, Phone, Calendar, Search, Tag, AlertCircle, Share2, CheckCircle2, Copy, X } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../../lib/mockData';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Discounts() {
    const [customers, setCustomers] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // DISCOUNT EDIT MODAL STATE
    const [discountModalCustomer, setDiscountModalCustomer] = useState(null);
    const [discountForm, setDiscountForm] = useState({ paidAmount: '' });

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
        let text = "📋 *Maamule Discount ii xali*\n\n";

        selectedCustomers.forEach((c, idx) => {
            const discount = parseFloat(c.discountAmount || 0);
            const paid = parseFloat(c.paidAmount || 0);
            const balance = parseFloat(c.balance || 0);

            text += `${idx + 1}. *${c.name}*\n`;
            text += `   🆔 SQN: ${c.sqn}\n`;
            // text += `   💰 Balance: $${balance}\n`; // Removed per user request
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

    const handleSaveDiscount = async (updatedCustomer) => {
        try {
            // Update Firestore
            const zone = currentUser.branch || 'General';
            // Assuming customer has ID or we use SQN as ID. Using ID from doc is safest.
            const docId = updatedCustomer.id || updatedCustomer.sqn;

            const customerRef = doc(db, 'zones', zone, 'customers', String(docId));
            await updateDoc(customerRef, {
                status: 'Discount',
                discountAmount: updatedCustomer.discountAmount,
                paidAmount: updatedCustomer.paidAmount,
                fahfahin: updatedCustomer.fahfahin
            });
            console.log("Discount updated successfully");
            setDiscountModalCustomer(null);
        } catch (e) {
            console.error("Error updating discount", e);
            alert("Error updating discount: " + e.message);
        }
    };

    const handleMarkAsPaid = async () => {
        const selectedCustomers = customers.filter(c => selectedIds.has(c.sqn));
        if (selectedCustomers.length === 0) return;

        if (!confirm(`Are you sure you want to mark ${selectedCustomers.length} customers as PAID?`)) return;

        try {
            const zone = currentUser.branch || 'General';
            const batchPromises = selectedCustomers.map(c => {
                const docId = c.id || c.sqn;
                const customerRef = doc(db, 'zones', zone, 'customers', String(docId));
                return updateDoc(customerRef, {
                    status: 'Paid',
                    paidDate: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            });

            await Promise.all(batchPromises);
            setSelectedIds(new Set()); // Clear selection
            console.log("Marked as Paid successfully");
        } catch (e) {
            console.error("Error marking as paid", e);
            alert("Failed to mark as paid: " + e.message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 pb-24 relative font-sans">
            {/* Header - PREMIUM GRADIENT THEME (Tasks Style) */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-4 border-b border-indigo-500/30 shadow-lg sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Active Discounts</h1>
                        <div className="flex items-center space-x-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <p className="text-xs text-indigo-100 font-bold uppercase tracking-wide">
                                {customers.length} Request{customers.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* ACTION BUTTONS (Visible when selected) */}
                        {selectedIds.size > 0 && (
                            <>
                                <button
                                    onClick={handleShare}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all active:scale-95 backdrop-blur-sm border border-white/10"
                                    title="Share Requests"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button
                                    onClick={handleMarkAsPaid}
                                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 rounded-lg border border-emerald-500/30 transition-all active:scale-95 backdrop-blur-sm"
                                    title="Mark as Paid"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                            </>
                        )}

                        <button
                            onClick={selectAll}
                            className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all backdrop-blur-sm border border-white/10 shadow-sm"
                        >
                            {selectedIds.size === customers.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>
            </div>

            {/* TOTAL SUMMARY CARD */}
            {customers.length > 0 && (
                <div className="mx-5 mt-4 p-5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-3xl shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Tag size={80} />
                    </div>
                    <div className="relative z-10 flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Paid</span>
                            <span className="text-2xl font-black text-white tracking-tight">
                                ${customers.reduce((sum, c) => sum + parseFloat(c.paidAmount || 0), 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Discount</span>
                            <span className="text-xl font-black text-white/90 tracking-tight">
                                ${customers.reduce((sum, c) => sum + parseFloat(c.discountAmount || 0), 0).toFixed(2)}
                            </span>
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
                                className={`rounded-xl p-3 shadow border relative overflow-hidden group transition-all active:scale-95 ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-gray-200/60 hover:shadow-md'}`}
                            >
                                {/* Selection Indicator (Click to Toggle) */}
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(customer.sqn); }}
                                    className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors z-20 cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200 bg-white hover:border-indigo-400'}`}
                                >
                                    {isSelected && <CheckCircle2 size={10} className="text-white" />}
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDiscountModalCustomer(customer);
                                        setDiscountForm({ paidAmount: customer.paidAmount || '' });
                                    }}
                                    className="pr-6"
                                >
                                    <div className="flex items-center gap-2.5 mb-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100/50 text-gray-500 border border-gray-100'}`}>
                                            %
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1 text-sm leading-tight">{customer.name}</h3>
                                            <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">SQN: <span className="text-gray-600">{customer.sqn}</span></p>
                                        </div>
                                    </div>

                                    {/* DATA GRID */}
                                    <div className="flex items-center divide-x divide-gray-200 bg-gray-50/50 rounded-lg border border-gray-100 overflow-hidden">

                                        {/* BALANCE */}
                                        <div className="flex-1 p-2 text-center">
                                            <span className="text-[7px] font-bold text-gray-400 uppercase block tracking-wider mb-0.5">Balance</span>
                                            <span className="text-xs font-black text-gray-700 block">${customer.balance}</span>
                                        </div>

                                        {/* LAGA HAYO */}
                                        <div className="flex-1 p-2 text-center bg-emerald-50/30">
                                            <span className="text-[7px] font-bold text-emerald-600/70 uppercase block tracking-wider mb-0.5">Paid</span>
                                            <span className="text-xs font-black text-emerald-600 block">${customer.paidAmount || '0'}</span>
                                        </div>

                                        {/* DISCOUNT */}
                                        <div className="flex-1 p-2 text-center bg-red-50/30">
                                            <span className="text-[7px] font-bold text-red-500/70 uppercase block tracking-wider mb-0.5">Discount</span>
                                            <span className="text-xs font-black text-red-500 block">-${customer.discountAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>



            {/* DISCOUNT CALCULATION MODAL */}
            {
                discountModalCustomer && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setDiscountModalCustomer(null)}>
                        <div onClick={e => e.stopPropagation()} className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Edit Discount</h3>
                                    <p className="text-xs font-bold text-gray-400">Update Calculation</p>
                                </div>
                                <button onClick={() => setDiscountModalCustomer(null)} className="p-2 bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
                            </div>

                            <div className="space-y-5">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Customer Balance</span>
                                        <span className="text-lg font-black text-gray-900">${discountModalCustomer.balance}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-indigo-500 h-full w-full"></div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-gray-900 uppercase ml-1 mb-2 block">
                                        Waxa la dhiibay (Paid Amount)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            autoFocus
                                            value={discountForm.paidAmount}
                                            onChange={(e) => setDiscountForm({ ...discountForm, paidAmount: e.target.value })}
                                            className="w-full pl-8 pr-4 py-4 bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-2xl font-black text-lg focus:outline-none transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Calculation Display */}
                                {discountForm.paidAmount && (
                                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-indigo-400 uppercase">Calculated Discount</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-indigo-600">
                                                ${(parseFloat(discountModalCustomer.balance || 0) - parseFloat(discountForm.paidAmount || 0)).toFixed(2)}
                                            </span>
                                            <span className="text-xs font-bold text-indigo-400">will be discounted</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        const originalBal = parseFloat(discountModalCustomer.balance || 0);
                                        const paid = parseFloat(discountForm.paidAmount || 0);
                                        const discount = originalBal - paid;

                                        if (paid < 0 || paid > originalBal) {
                                            alert("Please enter a valid amount (0 - Balance).");
                                            return;
                                        }

                                        handleSaveDiscount({
                                            ...discountModalCustomer,
                                            discountAmount: discount.toFixed(2),
                                            paidAmount: paid.toFixed(2),
                                            fahfahin: `Discount Request: $${discount.toFixed(2)} (Paid $${paid})`
                                        });
                                    }}
                                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all text-sm uppercase tracking-wide flex justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>Update Discount</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
