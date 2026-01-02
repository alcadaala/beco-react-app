import { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, Signal, Phone, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function DataBundles() {
    const navigate = useNavigate();
    const [selectedBundle, setSelectedBundle] = useState(null);

    const [bundles, setBundles] = useState([]);
    const [promo, setPromo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                setLoading(true);
                // Fetch Bundles from Firestore
                const bundlesQuery = query(
                    collection(db, 'data_bundles'),
                    where('status', '==', 'Active')
                );
                const querySnapshot = await getDocs(bundlesQuery);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (data && data.length > 0) {
                    setBundles(data);
                } else {
                    // Fallback Defaults if DB empty
                    const defaults = [
                        { id: '1', name: 'Weekly 5GB', price: 5, size: '5GB', validity: '7 Days', type: '4G', color: 'bg-blue-500' },
                        { id: '2', name: 'Monthly 20GB', price: 15, size: '20GB', validity: '30 Days', type: '4G', color: 'bg-indigo-500' },
                        { id: '3', name: 'Unlimited Basic', price: 40, size: 'Unl', validity: '30 Days', type: '5G', color: 'bg-violet-600' },
                    ];
                    setBundles(defaults);
                }

                // Check for Promo in Local Storage (Legacy support or simple config)
                const savedPromo = localStorage.getItem('beco_data_promo');
                if (savedPromo) {
                    setPromo(JSON.parse(savedPromo));
                }
            } catch (err) {
                console.error("Bundles Load Error", err);
                // Fallback on error too
                const defaults = [
                    { id: '1', name: 'Weekly 5GB', price: 5, size: '5GB', validity: '7 Days', type: '4G', color: 'bg-blue-500' },
                    { id: '2', name: 'Monthly 20GB', price: 15, size: '20GB', validity: '30 Days', type: '4G', color: 'bg-indigo-500' },
                    { id: '3', name: 'Unlimited Basic', price: 40, size: 'Unl', validity: '30 Days', type: '5G', color: 'bg-violet-600' },
                ];
                setBundles(defaults);
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, []);

    const handleBuy = async () => {
        if (!selectedBundle) return;

        // Get Merchant Number or Default
        const merchantNum = localStorage.getItem('beco_merchant_number') || '619700987';

        // USSD Format: *712*NUMBER*PRICE#
        const ussdCode = `*712*${merchantNum}*${selectedBundle.price}#`;

        // TRACKING
        try {
            const userStr = localStorage.getItem('beco_current_user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (user) {
                await addDoc(collection(db, 'activity_logs'), {
                    user_id: user.id,
                    action_type: 'data_bundle_click',
                    details: {
                        bundleName: selectedBundle.name,
                        price: selectedBundle.price,
                        bundleId: selectedBundle.id,
                        branch: user.branch || user.zone
                    },
                    created_at: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Tracking Error", e);
        }

        window.open(`tel:${encodeURIComponent(ussdCode)}`, '_self');
    };

    return (
        <div className="min-h-full bg-gray-50 pb-safe">
            {/* Header */}
            <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-10 flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-xl active:scale-95 transition-transform">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Data Bundles</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Visual Banner */}
                {promo && promo.active ? (
                    <div className={`bg-gradient-to-r ${promo.gradient || 'from-blue-600 to-indigo-600'} p-6 rounded-3xl text-white relative overflow-hidden shadow-lg shadow-blue-200 animate-in slide-in-from-top duration-500`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                        <div className="relative z-10">
                            <Wifi size={32} className="mb-4 text-white/50" />
                            <h2 className="text-2xl font-black mb-1 leading-tight">{promo.title || 'Special Offer!'}</h2>
                            <p className="text-white/90 font-bold text-sm leading-relaxed opacity-90">{promo.message || 'Check out our latest discounts.'}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-3xl text-white relative overflow-hidden shadow-lg shadow-gray-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                        <div className="relative z-10">
                            <Wifi size={32} className="mb-4 text-gray-500" />
                            <h2 className="text-2xl font-black mb-1">Stay Connected</h2>
                            <p className="text-gray-400 font-medium text-sm">Choose the best plan for your needs.</p>
                        </div>
                    </div>
                )}

                {/* Bundle Grid */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Package</h3>

                    {loading && <p className="text-center text-gray-400 text-sm py-4">Loading plans...</p>}

                    <div className="grid grid-cols-2 gap-3">
                        {!loading && bundles.map(b => (
                            <div
                                key={b.id}
                                onClick={() => setSelectedBundle(b)}
                                className={`
                                    relative p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 duration-200
                                    ${selectedBundle?.id === b.id ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20' : 'border-white bg-white hover:border-blue-100 shadow-sm'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white shadow-sm ${b.type === '5G' ? 'bg-indigo-600' : 'bg-blue-500'}`}>
                                    <Signal size={20} />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">{b.name}</h4>
                                <p className="text-xs text-gray-500 font-medium mb-2">{b.validity || b.duration}</p>
                                <div className="text-lg font-black text-gray-900">${b.price}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Confirmation Modal */}
                {selectedBundle && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedBundle(null)}>
                        <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            {/* Modal Header with Bundle Color */}
                            <div className={`${selectedBundle.color || (selectedBundle.type === '5G' ? 'bg-indigo-600' : 'bg-blue-600')} p-8 text-center relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg ring-4 ring-white/10">
                                        <Signal size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-1">{selectedBundle.name}</h2>
                                    <p className="text-blue-100 font-bold text-lg">${selectedBundle.price}</p>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 text-center space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ma hubtaa?</h3>
                                    <p className="text-gray-500 font-medium">
                                        Inaad ku shubato xirmada <span className="text-gray-900 font-bold">{selectedBundle.name}</span> oo qiimaheedu yahay <span className="text-gray-900 font-bold">${selectedBundle.price}</span>?
                                    </p>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setSelectedBundle(null)}
                                        className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        Maya
                                    </button>
                                    <button
                                        onClick={handleBuy}
                                        className="flex-1 bg-black text-white py-3.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <span>Haa</span>
                                        <Phone size={18} className="text-green-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
