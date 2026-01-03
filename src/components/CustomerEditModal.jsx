import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, DollarSign, User, Phone, FileText, Calendar, Plus, List, Receipt, MapPin, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils'; // Adjust path if needed based on location

export default function CustomerEditModal({ customer, onClose, onSave }) {
    // Core Identity Fields
    const [name, setName] = useState(customer?.name || '');
    const [sqn, setSqn] = useState(customer?.sqn || '');
    const [tell, setTell] = useState(customer?.tell || customer?.phone || '');

    // Financial Fields
    const [balance, setBalance] = useState(customer?.balance || '0');
    // Note: Some legacy data might not have these, default to 0 or derived
    const [prevBalance, setPrevBalance] = useState(customer?.prevBalance || '0');

    // Status & Logic Fields
    const [status, setStatus] = useState(customer?.status || 'Normal');
    const [fahfahin, setFahfahin] = useState(customer?.fahfahin || '');
    const [isCustomFahfahin, setIsCustomFahfahin] = useState(false); // New state for custom input mode
    const [discountAmount, setDiscountAmount] = useState(customer?.discountAmount || '');
    const [paidAmount, setPaidAmount] = useState(customer?.paidAmount || '');
    const [balanDate, setBalanDate] = useState('');

    // --- GPS STATE ---
    const [gpsLocation, setGpsLocation] = useState(customer?.location || null);
    const [gpsStatus, setGpsStatus] = useState(customer?.location ? 'locked' : 'loading'); // loading, locked, error

    // Fetch GPS on Mount
    useEffect(() => {
        if (!customer?.location && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGpsLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    });
                    setGpsStatus('locked');
                },
                (error) => {
                    console.error("GPS Error:", error);
                    setGpsStatus('error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else if (!customer?.location) {
            setGpsStatus('error');
        }
    }, []);

    if (!customer) return null;

    const handleSave = () => {
        let finalDate = customer.date;

        // If Balan, use the picked date
        if (status === 'Balan' && balanDate) {
            const d = new Date(balanDate);
            finalDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        }

        const safeDate = (status === 'Balan' ? finalDate : customer.date) || null;
        const safePaidDate = (status === 'Paid' ? new Date().toISOString() : customer.paidDate) || null;

        // DISCOUNT LOGIC
        let safeDiscount = null;
        let safePaid = null;

        if (status === 'Discount') {
            const originalBal = parseFloat(balance || 0);
            const paid = parseFloat(paidAmount || 0);
            const discount = originalBal - paid;

            safeDiscount = discount.toFixed(2);
            safePaid = paid.toFixed(2);
        }

        const updatedCustomer = {
            ...customer,
            name: name || '',
            sqn: sqn || '',
            tell: tell || '',
            balance: balance || '0',
            prevBalance: prevBalance || '0',
            status: status || 'Normal',
            fahfahin: fahfahin || '',
            discountAmount: safeDiscount,
            paidAmount: safePaid,
            date: safeDate,
            paidDate: safePaidDate,
            location: gpsLocation, // Include GPS
            updatedAt: new Date().toISOString()
        };

        // --- ACTIVITY LOGGING (ASSISTANT MONITORING) ---
        const userStr = localStorage.getItem('beco_current_user');
        if (userStr) {
            try {
                const currentUser = JSON.parse(userStr);
                const now = new Date();
                let logType = 'edit';
                let logDetail = 'Updated Info';

                if (status === 'Balan') {
                    logType = 'appointment';
                    logDetail = `${fahfahin || 'Balan'} - ${finalDate}`;
                } else if (status === 'Discount') {
                    logType = 'discount';
                    logDetail = `Discount: $${discountAmount}`;
                } else if (status === 'Paid') {
                    logType = 'payment';
                    logDetail = 'Marked as Paid';
                }

                const newLog = {
                    id: Date.now(),
                    userId: currentUser.id,
                    userName: currentUser.name,
                    type: logType,
                    customerName: name,
                    customerId: sqn,
                    detail: logDetail,
                    timestamp: now.toISOString(),
                    location: gpsLocation // Log location too
                };

                const logs = JSON.parse(localStorage.getItem('beco_activity_logs') || '[]');
                logs.push(newLog);
                localStorage.setItem('beco_activity_logs', JSON.stringify(logs));
            } catch (e) {
                console.error("Logging error", e);
            }
        }
        // ----------------------------------------------

        onSave(updatedCustomer);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Glass Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6 mt-2 relative">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-50 text-blue-600 text-xl font-bold mb-2 shadow-inner">
                        {name?.charAt(0) || '?'}
                    </div>

                    {/* GPS Indicator */}
                    <div className="absolute top-0 left-0">
                        {gpsStatus === 'loading' && (
                            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-[9px] font-bold animate-pulse">
                                <Loader2 size={10} className="animate-spin" /> GPS
                            </div>
                        )}
                        {gpsStatus === 'locked' && (
                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-[9px] font-bold">
                                <MapPin size={10} /> GPS OK
                            </div>
                        )}
                        {gpsStatus === 'error' && (
                            <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-full text-[9px] font-bold">
                                <MapPin size={10} /> No GPS
                            </div>
                        )}
                    </div>

                    <h2 className="text-lg font-bold text-gray-900">Edit Customer</h2>
                    <p className="text-xs text-gray-500">Update details and status</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">

                    {/* 1. Identity Section */}
                    <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Identity</h3>

                        {/* Name */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Name</label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                        </div>

                        {/* SQN & Phone */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">SQN</label>
                                <div className="relative">
                                    <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={sqn}
                                        onChange={(e) => setSqn(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Phone</label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={tell}
                                        onChange={(e) => setTell(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Financial Section */}
                    <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Financials</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Balance</label>
                                <div className="relative">
                                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                    <input
                                        type="number"
                                        value={balance}
                                        onChange={(e) => setBalance(e.target.value)}
                                        className="w-full pl-8 pr-2 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Total Bill</label>
                                <div className="relative">
                                    <Receipt size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                                    <input
                                        type="number"
                                        value={customer.total || ''} // Read-only mostly for reference
                                        readOnly
                                        className="w-full pl-8 pr-2 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Prev Bal</label>
                                <div className="relative">
                                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        value={prevBalance}
                                        onChange={(e) => setPrevBalance(e.target.value)}
                                        className="w-full pl-8 pr-2 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:ring-2 focus:ring-gray-500/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Status Selection (Renamed 'Normal' to 'Details' in UI if preferred, but keeping logic same) */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1.5 block">Status Action</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['Normal', 'Balan', 'Discount', 'Paid'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={cn(
                                        "py-2.5 rounded-xl text-[10px] sm:text-xs font-bold border transition-all truncate px-1",
                                        status === s ?
                                            s === 'Discount' ? "bg-yellow-50 border-yellow-200 text-yellow-700 ring-1 ring-yellow-400" :
                                                s === 'Balan' ? "bg-purple-50 border-purple-200 text-purple-700 ring-1 ring-purple-400" :
                                                    s === 'Paid' ? "bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-400" :
                                                        "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-400"
                                            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                                    )}
                                >
                                    {s === 'Normal' ? 'Details' : s}
                                </button>
                            ))}
                        </div>
                    </div>









                    {/* Conditional Discount Input - NEW LOGIC */}
                    {status === 'Discount' && (
                        <div className="animate-in slide-in-from-top-2 fade-in space-y-3">
                            <div>
                                <label className="text-xs font-bold text-indigo-900 uppercase ml-1 mb-1.5 flex items-center">
                                    <DollarSign size={12} className="mr-1" />
                                    Waxa la dhiibay (Paid Amount)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-indigo-50/50 border border-indigo-200 text-gray-900 font-bold rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400/50 text-lg"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Calculation Display */}
                            {paidAmount && (
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-indigo-400">Calculated Discount:</span>
                                    <span className="text-xl font-black text-indigo-600">
                                        ${(parseFloat(balance || 0) - parseFloat(paidAmount || 0)).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Appointment Type & Date (Only if Balan) */}
                    {status === 'Balan' && (
                        <div className="animate-in slide-in-from-top-2 fade-in space-y-3 p-3 bg-purple-50/30 rounded-2xl border border-purple-100">
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-xs font-bold text-purple-600 uppercase ml-1">Nooca Balanka</label>
                                    <button
                                        onClick={() => setIsCustomFahfahin(!isCustomFahfahin)}
                                        className="p-1 hover:bg-purple-100 rounded-md text-purple-600 transition-colors"
                                        title={isCustomFahfahin ? "Pick from list" : "Type custom reason"}
                                    >
                                        {isCustomFahfahin ? <List size={14} /> : <Plus size={14} />}
                                    </button>
                                </div>

                                {isCustomFahfahin ? (
                                    <input
                                        type="text"
                                        value={fahfahin}
                                        onChange={(e) => setFahfahin(e.target.value)}
                                        placeholder="Qor sababta..."
                                        className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-purple-400/50"
                                        autoFocus
                                    />
                                ) : (
                                    <select
                                        value={fahfahin}
                                        onChange={(e) => setFahfahin(e.target.value)}
                                        className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-purple-400/50"
                                    >
                                        <option value="">Dooro...</option>
                                        <option value="Balan">Balan</option>
                                        <option value="Caawa">Caawa</option>
                                        <option value="Barri">Barri</option>
                                        <option value="Duhur">Duhur</option>
                                        <option value="qataato">Qataato (Warning)</option>
                                        <option value="dhicid">Dhicid (Missed Call)</option>
                                        <option value="acc">Acc (Not Paid)</option>
                                    </select>
                                )}
                            </div>

                            {/* DATE PICKER */}
                            <div>
                                <label className="text-xs font-bold text-purple-600 uppercase ml-1 mb-1.5 flex items-center">
                                    <Calendar size={12} className="mr-1" />
                                    Dooro Taariikhda
                                </label>
                                <input
                                    type="date"
                                    value={balanDate}
                                    onChange={(e) => setBalanDate(e.target.value)}
                                    className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-purple-400/50"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className={cn(
                        "w-full mt-8 py-3.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center",
                        status === 'Discount' ? "bg-yellow-500 shadow-yellow-200 hover:bg-yellow-600" :
                            status === 'Balan' ? "bg-purple-600 shadow-purple-200 hover:bg-purple-700" :
                                "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                    )}
                >
                    <CheckCircle2 size={18} className="mr-2" />
                    Save Changes
                </button>
            </div>
        </div>,
        document.body
    );
}
