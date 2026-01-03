import React, { useRef, useState, useEffect } from 'react';
import { Book, Heart, Receipt, ChevronRight, Upload, FileSpreadsheet, CheckCircle2, Wifi, Users, X, User, Mail, Shield, MapPin, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Services() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [message, setMessage] = useState('');

    // ASSISTANT & USER LOGIC
    const [showAssistantModal, setShowAssistantModal] = useState(false);
    const [existingAssistants, setExistingAssistants] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // PROFILE VIEW/EDIT STATE
    const [isViewingProfile, setIsViewingProfile] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', password: '' });

    useEffect(() => {
        const loadUserAndAssistants = async () => {
            const userStr = localStorage.getItem('beco_current_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);

                if (user.role === 'Assistant') {
                    navigate('/dashboard', { replace: true });
                    return;
                }

                // Fetch My Assistants from Firestore
                try {
                    const q = query(
                        collection(db, 'profiles'),
                        where('role', '==', 'Assistant'),
                        where('parent_id', '==', user.id)
                    );
                    const querySnapshot = await getDocs(q);
                    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    if (data) setExistingAssistants(data);
                } catch (e) {
                    console.error("Error loading assistants", e);
                }
            }
        };
        loadUserAndAssistants();
    }, [showAssistantModal, navigate]);

    const handleCreateAssistant = async () => {
        alert("To add an assistant, ask them to Register via the Login page. You can then approve them.");
        return;
    };

    const handleDeleteAssistant = async (id) => {
        if (!window.confirm("Remove this assistant?")) return;
        try {
            const assistantRef = doc(db, 'profiles', id);
            await updateDoc(assistantRef, {
                parent_id: null,
                status: 'Inactive'
            });
            setExistingAssistants(existingAssistants.filter(u => u.id !== id));
        } catch (e) {
            console.error("Error removing assistant", e);
            alert("Failed to remove assistant.");
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadStatus('loading');
        setMessage('Processing file...');

        const reader = new FileReader();

        const processData = (rawData) => {
            try {
                // Map specific columns
                const mappedData = rawData.map(row => {
                    const keys = Object.keys(row);

                    const findK = (checks, exclude = []) => keys.find(k => {
                        const low = k.toLowerCase().replace(/\s+/g, '');
                        const matches = checks.some(c => low.includes(c));
                        const excluded = exclude.some(ex => low.includes(ex));
                        return matches && !excluded;
                    });

                    const sqnKey = findK(['sqn', 'tix', 'id', 'account', 'acc', 'ref', 'number', 'no']);
                    const nameKey = findK(['name', 'magaca', 'customer']);
                    const tellKey = findK(['tell', 'phone', 'mob', 'cell', 'tel', 'mobile']);

                    // Financials
                    const prevKey = findK(['prev', 'old', 'hore'], []);
                    const balKey = findK(['balance', 'due', 'owe', 'haraaga', 'har'], ['prev', 'old', 'total', 'wadarta', 'hore']);

                    const record = {
                        sqn: row[sqnKey] ? String(row[sqnKey]) : null,
                        name: row[nameKey] || 'Unknown',
                        phone: row[tellKey] ? String(row[tellKey]) : null,
                        prev_balance: parseFloat(row[prevKey] || 0),
                        balance: parseFloat(row[balKey] || 0),
                        status: 'Unpaid',
                    };

                    return (record.sqn && record.name !== 'Unknown') ? record : null;
                }).filter(Boolean);

                saveToFirebase(mappedData);
            } catch (err) {
                console.error("Mapping Error", err);
                setUploadStatus('error');
                setMessage('Failed to map data columns. Check file format.');
            }
        };

        // Handler for Excel Files
        if (file.name.match(/\.(xlsx|xls)$/)) {
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    processData(jsonData);
                } catch (err) {
                    console.error(err);
                    setUploadStatus('error');
                    setMessage('Failed to parse Excel file.');
                }
            };
            reader.readAsBinaryString(file);
        }
        else {
            reader.onload = (e) => {
                try {
                    let data = [];
                    const text = e.target.result;

                    if (file.name.endsWith('.json')) {
                        data = JSON.parse(text);
                        processData(data);
                    } else if (file.name.endsWith('.csv')) {
                        const lines = text.split('\n');
                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                        data = lines.slice(1).filter(l => l.trim()).map(line => {
                            const values = line.split(',');
                            let obj = {};
                            headers.forEach((h, i) => { obj[h] = values[i]?.trim(); });
                            return obj;
                        });
                        processData(data);
                    }
                } catch (err) {
                    setUploadStatus('error');
                    setMessage('Failed to parse file.');
                }
            };
            reader.readAsText(file);
        }
    };

    const saveToFirebase = async (data) => {
        if (data.length > 0) {
            try {
                const userStr = localStorage.getItem('beco_current_user');
                const user = userStr ? JSON.parse(userStr) : {};
                const ownerId = user.id;
                const zone = user.branch || 'General';

                if (!ownerId) {
                    setUploadStatus('error');
                    setMessage('Error: User not identified. Please relogin.');
                    return;
                }

                setMessage(`Uploading ${data.length} records to Zone: ${zone}...`);

                const CHUNK_SIZE = 450;
                for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                    const chunk = data.slice(i, i + CHUNK_SIZE);
                    const batch = writeBatch(db);

                    chunk.forEach(record => {
                        const ref = doc(db, 'zones', zone, 'customers', String(record.sqn));
                        const taggedRecord = {
                            ...record,
                            collector_id: ownerId,
                            branch: zone,
                            branch_id: user.branchId || null,
                            updated_at: new Date().toISOString()
                        };
                        batch.set(ref, taggedRecord, { merge: true });
                    });

                    await batch.commit();
                }

                setUploadStatus('success');
                setMessage(`Successfully imported ${data.length} customers to ${zone}!`);
                setTimeout(() => { navigate('/baafiye'); }, 1500);

            } catch (e) {
                console.error("Upload failed", e);
                setUploadStatus('error');
                setMessage('Failed to sync: ' + e.message);
            }
        } else {
            setUploadStatus('error');
            setMessage('No valid data found in file.');
        }
    };

    const handleClearMyData = async () => {
        const confirmDelete = window.confirm("Are you sure you want to DELETE ALL your uploaded customer data? This cannot be undone.");
        if (!confirmDelete) return;

        const confirmDouble = window.confirm("Please confirm again: DELETE ALL DATA?");
        if (!confirmDouble) return;

        try {
            setMessage("Deleting data...");
            const userStr = localStorage.getItem('beco_current_user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user) return;

            const zone = user.branch || 'General';
            const q = query(
                collection(db, 'zones', zone, 'customers'),
                where('collector_id', '==', user.id)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("No data found in your Zone (" + zone + ") to delete.");
                setMessage("");
                return;
            }

            const CHUNK_SIZE = 450;
            const chunks = [];
            for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
                chunks.push(snapshot.docs.slice(i, i + CHUNK_SIZE));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(doc => { batch.delete(doc.ref); });
                await batch.commit();
            }

            localStorage.removeItem('baafiye_local_data');
            setMessage("Data deleted successfully.");
            alert("All your data has been deleted from " + zone + ".");
            navigate('/baafiye');

        } catch (e) {
            console.error("Delete failed", e);
            alert("Error deleting data: " + e.message);
        }
    };

    // Handle Profile View/Edit
    const handleProfileClick = () => {
        setEditForm({
            name: currentUser?.name || '',
            password: currentUser?.access_code || currentUser?.password || ''
        });
        setIsViewingProfile(true);
    };

    const saveProfile = async () => {
        if (!editForm.name || !editForm.password) {
            alert("Name and Password are required.");
            return;
        }
        try {
            const userRef = doc(db, 'profiles', currentUser.id);
            const updates = {
                name: editForm.name,
                access_code: editForm.password,
                password: editForm.password
            };

            await updateDoc(userRef, updates);

            // Update Local State
            const updatedUser = { ...currentUser, ...updates };
            setCurrentUser(updatedUser);
            localStorage.setItem('beco_current_user', JSON.stringify(updatedUser));

            setIsViewingProfile(false);
            alert("Profile updated successfully!");
        } catch (e) {
            console.error("Profile update failed", e);
            alert("Failed to update profile.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 pb-24 min-h-screen font-sans">
            {/* Header Area (Hospital Style) */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-8 rounded-b-[2.5rem] sticky top-0 z-20 shadow-lg mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Services</h1>
                        <p className="text-xs text-indigo-100 font-bold uppercase tracking-wide">
                            Tools & Utilities
                        </p>
                    </div>
                    {/* User Profile Icon */}
                    <button
                        onClick={handleProfileClick}
                        className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all flex items-center justify-center shadow-lg active:scale-95"
                    >
                        <User size={24} className="text-white" />
                    </button>
                </div>
            </div>

            {/* CLEAN GRID */}
            <div className="px-5 grid grid-cols-2 gap-4">

                {/* Import Data Banner - Cleaner */}
                <div
                    onClick={() => { if (uploadStatus !== 'loading') fileInputRef.current?.click(); }}
                    className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            {uploadStatus === 'loading' ? <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div> : <Upload size={24} strokeWidth={2.5} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Import Customers</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{message || 'Upload Excel / CSV'}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-gray-400">
                        <ChevronRight size={18} />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.json,.csv" className="hidden" />
                </div>

                {/* Service Cards */}
                <ServiceCard title="Quran" icon={Book} color="bg-emerald-500" onClick={() => navigate('/quran')} />
                <ServiceCard title="Hospitals" icon={Heart} color="bg-rose-500" onClick={() => navigate('/hospital-discounts')} />
                <ServiceCard title="Reports" icon={Receipt} color="bg-violet-500" onClick={() => navigate('/billing')} />
                <ServiceCard title="Bundles" icon={Wifi} color="bg-cyan-500" onClick={() => navigate('/data-bundles')} />
                <ServiceCard title="Assistants" icon={Users} color="bg-amber-500" onClick={() => setShowAssistantModal(true)} />
                <ServiceCard title="Clear List" icon={FileSpreadsheet} color="bg-red-500" onClick={handleClearMyData} />

            </div>

            {/* PROFILE DETAIL MODAL (Read Only) */}
            {isViewingProfile && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/50 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">My Profile</h2>
                                <p className="text-xs text-gray-500 font-bold uppercase">Account Details</p>
                            </div>
                            <button onClick={() => setIsViewingProfile(false)} className="p-2 bg-gray-100/50 rounded-full hover:bg-gray-200 transition-colors"><X size={18} /></button>
                        </div>

                        <div className="space-y-4">
                            {/* INFO CARD */}
                            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">

                                {/* Name */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-md">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Full Name</p>
                                        <p className="text-base font-black text-gray-900">{currentUser?.name || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200/50 w-full"></div>

                                {/* Email */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Email Address</p>
                                        <p className="text-sm font-bold text-gray-900">{currentUser?.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200/50 w-full"></div>

                                {/* Branch Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100/50 flex items-center justify-center text-emerald-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Branch Name</p>
                                        <p className="text-sm font-bold text-gray-900">{currentUser?.branch || 'General'}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200/50 w-full"></div>

                                {/* Zone Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100/50 flex items-center justify-center text-violet-600">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Zone Name</p>
                                        <p className="text-sm font-bold text-gray-900">{currentUser?.zone || currentUser?.branch || 'General Zone'}</p>
                                    </div>
                                </div>

                            </div>

                            <div className="pt-2 text-center">
                                <p className="text-[10px] text-gray-400 font-medium">
                                    To update your details, please contact your Supervisor or Admin.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSISTANT MODAL (Updated Style) */}
            {showAssistantModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/50 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Manage Assistants</h2>
                                <p className="text-xs text-gray-500 font-bold">Delegate View Access</p>
                            </div>
                            <button onClick={() => setShowAssistantModal(false)}><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-center backdrop-blur-sm">
                                <Users size={32} className="mx-auto text-amber-500 mb-2" />
                                <h3 className="font-bold text-amber-900">Add New Assistant</h3>
                                <p className="text-xs text-amber-700 mt-1 mb-3 font-medium">
                                    To add an assistant, they must register an account using the public Signup page. Once registered, ask Admin to link them to you.
                                </p>
                            </div>

                            {/* LIST EXISTING ASSISTANTS */}
                            {existingAssistants.length > 0 ? (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">My Assistants</p>
                                    <div className="space-y-2">
                                        {existingAssistants.map(asst => (
                                            <div key={asst.id} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                                <div>
                                                    <span className="block text-sm font-bold text-gray-900">{asst.full_name || asst.name}</span>
                                                    <span className="text-[10px] text-gray-400 flex items-center font-bold">
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${asst.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                        {asst.status || 'Active'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteAssistant(asst.id)}
                                                    className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors shadow-sm tracking-wide"
                                                >
                                                    REMOVE
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-xs italic font-medium">
                                    No assistants linked to your account.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// CLEAN SERVICE CARD (No Animation, Minimal)
function ServiceCard({ title, icon: Icon, color, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 h-32 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all"
        >
            <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-sm`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-700 text-xs uppercase tracking-wide">{title}</span>
        </div>
    );
}
