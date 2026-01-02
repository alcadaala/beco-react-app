import React, { useRef, useState, useEffect } from 'react';
import { Book, Heart, Receipt, ChevronRight, ArrowRight, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Wifi, FileText, Users, X } from 'lucide-react';
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

    // PROFILE EDIT STATE
    const [isEditingProfile, setIsEditingProfile] = useState(false);
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
                        where('parent_id', '==', user.id) // Ensure string/number match based on your DB schema
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

    // Handle Profile Edit
    const handleEditProfile = () => {
        setEditForm({
            name: currentUser?.name || '',
            password: currentUser?.access_code || currentUser?.password || ''
        });
        setIsEditingProfile(true);
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
                access_code: editForm.password, // Assuming 'access_code' is the password field or 'password'
                password: editForm.password
            };

            await updateDoc(userRef, updates);

            // Update Local State
            const updatedUser = { ...currentUser, ...updates };
            setCurrentUser(updatedUser);
            localStorage.setItem('beco_current_user', JSON.stringify(updatedUser));

            setIsEditingProfile(false);
            alert("Profile updated successfully!");
        } catch (e) {
            console.error("Profile update failed", e);
            alert("Failed to update profile.");
        }
    };

    return (
        <div className="min-h-full bg-gray-50 pb-24">
            {/* NEW PROFILE HEADER SECTION */}
            <div className="bg-white p-6 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden mb-6">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 opacity-100 z-0"></div>

                {/* Decorative Blobs */}
                <div className="absolute top-[-50%] right-[-20%] w-80 h-80 bg-white/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-64 h-64 bg-black/10 rounded-full blur-3xl z-0 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center text-center mt-2">
                    <div className="w-20 h-20 bg-white p-1 rounded-full shadow-lg mb-3 relative group">
                        <img
                            src={`https://ui-avatars.com/api/?name=${currentUser?.name || 'User'}&background=random&color=fff&size=128`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                        />
                        <button
                            onClick={handleEditProfile}
                            className="absolute bottom-0 right-0 bg-gray-900 text-white p-1.5 rounded-full shadow-md hover:scale-110 transition-transform"
                        >
                            <FileText size={12} />
                        </button>
                    </div>

                    <h2 className="text-2xl font-black text-white leading-tight mb-1">
                        {currentUser?.name || 'Loading...'}
                    </h2>

                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {currentUser?.branch || 'General Zone'}
                        </span>
                    </div>
                </div>
            </div>

            {/* GLASSMORPHISM COMPACT GRID */}
            <div className="px-4 grid grid-cols-2 gap-4 relative z-10">

                {/* Upload Card (Glass Style) */}
                <div
                    onClick={() => { if (uploadStatus !== 'loading') fileInputRef.current?.click(); }}
                    className="col-span-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-3xl p-5 border border-white/30 shadow-2xl relative overflow-hidden flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer h-28"
                >
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            {uploadStatus === 'loading' ? <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div> : <Upload size={28} className="text-white" />}
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 text-lg leading-tight">Import Data</h3>
                            <p className="text-xs font-bold text-gray-500">{message || 'Upload Excel Sheet'}</p>
                        </div>
                    </div>
                    <div className="relative z-10 bg-white/20 p-2.5 rounded-full backdrop-blur-md shadow-sm border border-white/50">
                        <ChevronRight size={20} className="text-gray-700" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.json,.csv" className="hidden" />
                </div>

                {/* Service Cards (Glassmorphism) */}
                <ServiceCard
                    title="Quran"
                    icon={Book}
                    gradient="from-emerald-400 to-teal-500"
                    shadow="shadow-emerald-200"
                    onClick={() => navigate('/quran')}
                />

                <ServiceCard
                    title="Hospitals"
                    icon={Heart}
                    gradient="from-pink-400 to-rose-500"
                    shadow="shadow-pink-200"
                    onClick={() => navigate('/hospital-discounts')}
                />

                <ServiceCard
                    title="Reports"
                    icon={Receipt}
                    gradient="from-violet-400 to-purple-500"
                    shadow="shadow-violet-200"
                    onClick={() => navigate('/billing')}
                />

                <ServiceCard
                    title="Bundles"
                    icon={Wifi}
                    gradient="from-blue-400 to-cyan-500"
                    shadow="shadow-blue-200"
                    onClick={() => navigate('/data-bundles')}
                />

                <ServiceCard
                    title="Assistants"
                    icon={Users}
                    gradient="from-amber-400 to-orange-500"
                    shadow="shadow-amber-200"
                    onClick={() => setShowAssistantModal(true)}
                />

                <ServiceCard
                    title="Clear List"
                    icon={FileSpreadsheet}
                    gradient="from-red-400 to-red-600"
                    shadow="shadow-red-200"
                    onClick={handleClearMyData}
                />

            </div>

            {/* PROFILE EDIT MODAL */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/50 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
                            <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-gray-100/50 rounded-full hover:bg-gray-200 transition-colors"><X size={18} /></button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Password / Access Code</label>
                                <input
                                    type="text"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono tracking-wider"
                                    placeholder="Enter password"
                                />
                            </div>

                            <button
                                onClick={saveProfile}
                                className="w-full bg-gradient-to-r from-gray-900 to-black text-white font-bold py-4 rounded-2xl shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} />
                                Save Changes
                            </button>
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

// NEW COMPACT SERVICE CARD
// NEW GLASSMORPHISM SERVICE CARD
function ServiceCard({ title, icon: Icon, gradient, shadow, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-white/80 backdrop-blur-xl rounded-[1.8rem] p-4 shadow-lg border border-white/60 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 h-32 relative overflow-hidden group hover:bg-white/90"
        >
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-xl -mr-6 -mt-6 group-hover:opacity-20 transition-opacity`}></div>

            <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${shadow}`}>
                <Icon size={26} className="text-white drop-shadow-sm" />
            </div>
            <span className="font-extrabold text-gray-700 text-sm tracking-tight group-hover:text-gray-900">{title}</span>
        </div>
    );
}
