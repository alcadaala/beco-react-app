import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, MapPin, Phone, Building2, X, Search, CheckCircle, Upload, Image as ImageIcon, FileSpreadsheet, Loader2 } from 'lucide-react';
import { read, utils } from 'xlsx';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function SuperAdminHospitals() {
    const [hospitals, setHospitals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', location: '', phone: '', status: 'Active', discount: 30, image_url: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);

    const DEFAULT_HOSPITALS = [
        // 50% DISCOUNT
        { name: 'Horyaal Hospital', location: 'Tarabuunka Road, Hodan', phone: '+252 614 269 444', discount: 50, status: 'Active' },
        { name: 'Hodan Hospital', location: 'Hodan District', phone: '', discount: 50, status: 'Active' },
        { name: 'Somali Sudanese Hospital', location: 'Hodan, Soona key', phone: '+252 61 323 3333', discount: 50, status: 'Active' },
        { name: 'Wadajir Hospital', location: 'Wadajir', phone: '', discount: 50, status: 'Active' },
        { name: 'Somali Syrian Hospital', location: 'Mogadishu', phone: '', discount: 50, status: 'Active' },
        { name: 'Somali Egyptian Hospital', location: 'Mogadishu', phone: '', discount: 50, status: 'Active' },

        // 40% DISCOUNT
        { name: 'Kalkaal Specialty Hospital', location: 'Digfer Road, Hodan', phone: '+252 617 633 661', discount: 40, status: 'Active' },
        { name: 'Ibnu Sinaa Hospital', location: 'Mogadishu', phone: '', discount: 40, status: 'Active' },
        { name: 'Dalmar Specialist Hospital', location: 'Agagaarka KM5', phone: '+252 61 391 7070', discount: 40, status: 'Active' },
        { name: 'Adan Cade Hospital', location: 'Mogadishu', phone: '', discount: 40, status: 'Active' },
        { name: 'Horseed Hospital', location: 'Agagaarka KM5, Zoobe', phone: '+252 610 405 080', discount: 40, status: 'Active' },
        { name: 'Macaani Hospital', location: 'KM13, Mogadishu', phone: '+252 61 502 4277', discount: 40, status: 'Active' },
        { name: 'Darul Shifaa Hospital', location: 'Mogadishu', phone: '', discount: 40, status: 'Active' },
        { name: 'Samakaal Hospital', location: 'Mogadishu', phone: '', discount: 40, status: 'Active' },
        { name: 'Androcare Hospital', location: 'Mogadishu', phone: '', discount: 40, status: 'Active' },
        { name: 'Al Casima Hospital', location: 'Mogadishu', phone: '', discount: 40, status: 'Active' },

        // 30% DISCOUNT
        { name: 'Horjoog Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Jazeera Specialist Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Duco Community Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Abuu Bashiir Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Daarusalaam Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Welcare Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Kaafi Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Darajaat Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Somali Pakistani Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Eye Community Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Al Zahra Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Royal Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Somali Specialist Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
        { name: 'Muqdisho Specialist Hospital', location: 'Yaaqshiid', phone: '+252 61 187 8787', discount: 30, status: 'Active' },
        { name: 'Amoore Hospital', location: 'Mogadishu', phone: '', discount: 30, status: 'Active' },
    ];

    const handleSeedData = async () => {
        if (!confirm("Add missing default hospitals to database?")) return;
        setSaving(true);
        try {
            const batch = writeBatch(db);
            const hospitalsRef = collection(db, 'hospitals');
            let addedCount = 0;

            // Check existing to avoid duplicates (Client side check for simplicity)
            const existingNames = new Set(hospitals.map(h => h.name.toLowerCase()));

            DEFAULT_HOSPITALS.forEach(h => {
                if (!existingNames.has(h.name.toLowerCase())) {
                    const docRef = doc(hospitalsRef);
                    batch.set(docRef, { ...h, created_at: new Date().toISOString() });
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                await batch.commit();
                await fetchHospitals();
                alert(`Added ${addedCount} new hospitals.`);
            } else {
                alert("All default hospitals already exist.");
            }

        } catch (error) {
            console.error(error);
            alert("Error seeding data: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'hospitals'), orderBy('created_at', 'desc')); // Indexes might be needed
            // Fallback if no index: just getDocs(collection(db, 'hospitals')) and sort client side

            let data = [];
            try {
                const querySnapshot = await getDocs(q);
                data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (err) {
                // Fallback: simple fetch if ordering fails due to missing index
                const querySnapshot = await getDocs(collection(db, 'hospitals'));
                data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
            }

            setHospitals(data || []);
        } catch (error) {
            console.error("Error fetching hospitals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        alert("Image upload requires Storage setup. Coming soon!");
    };

    const handleFileUpload = async (e) => {
        // Bulk Import logic
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json(sheet);

            if (jsonData.length === 0) return alert("File is empty!");

            const batch = writeBatch(db);
            const hospitalsRef = collection(db, 'hospitals');

            let count = 0;
            const CHUNK_SIZE = 450;
            // We need to loop and commit in chunks if huge, but simplistic here:

            // Simple loop for now (assuming < 500 records)
            const newHospitals = jsonData.map(row => ({
                name: row.Name || row.name || 'Unknown',
                location: row.Location || row.location || 'Mogadishu',
                phone: row.Phone || row.phone || '',
                discount: row.Discount || row.discount || 30,
                status: 'Active',
                created_at: new Date().toISOString()
            }));

            // If > 500, we'd need to loop batches. Let's assume small file for now, or just limit to first 500.
            const toImport = newHospitals.slice(0, 490);

            toImport.forEach(h => {
                const docRef = doc(hospitalsRef); // Auto ID
                batch.set(docRef, h);
                count++;
            });

            await batch.commit();

            fetchHospitals();
            alert(`Successfully imported ${count} hospitals!`);
        } catch (error) {
            console.error(error);
            alert("Failed to import: " + error.message);
        }
    };

    const handleSave = async () => {
        if (!formData.name) return alert("Please enter hospital name");
        setSaving(true);

        try {
            if (editingId) {
                // Update
                const hospitalRef = doc(db, 'hospitals', editingId);
                await updateDoc(hospitalRef, {
                    name: formData.name,
                    location: formData.location,
                    phone: formData.phone,
                    status: formData.status,
                    discount: formData.discount
                });
            } else {
                // Create
                await addDoc(collection(db, 'hospitals'), {
                    name: formData.name,
                    location: formData.location,
                    phone: formData.phone,
                    status: formData.status,
                    discount: formData.discount,
                    created_at: new Date().toISOString()
                });
            }

            fetchHospitals();
            closeModal();
        } catch (error) {
            alert("Error saving: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this hospital?")) {
            try {
                await deleteDoc(doc(db, 'hospitals', id));
                fetchHospitals();
            } catch (error) {
                alert("Error deleting: " + error.message);
            }
        }
    };

    const handleDeleteAll = async () => {
        if (confirm("WARNING: Are you sure you want to delete ALL hospitals? This cannot be undone.")) {
            // Delete manually in batch or loop
            try {
                const snapshot = await getDocs(collection(db, 'hospitals'));
                const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'hospitals', d.id)));
                await Promise.all(deletePromises); // Parallel delete (beware of limits)

                fetchHospitals();
            } catch (error) {
                alert("Error deleting all: " + error.message);
            }
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({ name: '', location: '', phone: '', status: 'Active', discount: 30, image_url: '' });
        setIsModalOpen(true);
    };

    const openEdit = (hospital) => {
        setEditingId(hospital.id);
        setFormData({ ...hospital });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const filtered = hospitals.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading && hospitals.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50">
                <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-stone-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-900 leading-tight">Hospitals</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Database Integrated</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleSeedData}
                        className="bg-indigo-600 text-white p-3 px-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center text-xs font-bold gap-2"
                        title="Add Default Hospitals"
                    >
                        <Building2 size={16} /> Sync DB
                    </button>
                    {hospitals.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="bg-red-100 text-red-600 p-3 rounded-2xl shadow-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                            title="Delete All Hospitals"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <label className="bg-green-600 text-white p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform cursor-pointer flex items-center justify-center">
                        <FileSpreadsheet size={20} />
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={openCreate}
                        className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                <Search size={20} className="text-gray-400 ml-2" />
                <input
                    className="w-full p-2 outline-none font-bold text-gray-700 bg-transparent placeholder-gray-300"
                    placeholder="Search hospitals..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.map(hospital => (
                    <div key={hospital.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 overflow-hidden">
                                {hospital.image_url ? (
                                    <img src={hospital.image_url} alt={hospital.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 size={24} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{hospital.name}</h3>
                                <div className="flex items-center space-x-3 text-[10px] font-bold text-gray-400 uppercase">
                                    <span className="flex items-center"><MapPin size={10} className="mr-1" /> {hospital.location}</span>
                                    <span>•</span>
                                    <span className="flex items-center"><Phone size={10} className="mr-1" /> {hospital.phone}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${hospital.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                {hospital.status}
                            </span>
                            <button onClick={() => openEdit(hospital)} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(hospital.id)} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-10 text-gray-400 font-bold text-xs">No hospitals found.</div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">{editingId ? 'Edit Hospital' : 'New Hospital'}</h2>
                            <button onClick={closeModal}><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Name</label>
                                <input
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 focus:ring-2 ring-gray-900 outline-none" placeholder="e.g. Digfeer"
                                />
                            </div>

                            {/* Image Upload Placeholder */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Hospital Image</label>
                                <div className="mt-1 flex items-center space-x-3">
                                    <div className="h-16 w-16 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                        <ImageIcon size={20} className="text-gray-400" />
                                    </div>
                                    <label className="flex-1 cursor-pointer opacity-50">
                                        <div className="bg-gray-900 text-white p-3 rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition-colors">
                                            <Upload size={16} className="mr-2" />
                                            Upload Photo
                                        </div>
                                        {/* Disabled real upload for now */}
                                        <button onClick={() => alert("Image bucket not configured yet.")} className="hidden"></button>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Location</label>
                                <input
                                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 focus:ring-2 ring-gray-900 outline-none" placeholder="e.g. Hodan"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone</label>
                                <input
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 focus:ring-2 ring-gray-900 outline-none" placeholder="e.g. 61xxxxxxx"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Discount (%)</label>
                                <input
                                    type="number"
                                    value={formData.discount || ''} onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 focus:ring-2 ring-gray-900 outline-none" placeholder="e.g. 30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Status</label>
                                <select
                                    value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold mt-1 outline-none appearance-none"
                                >
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </select>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl mt-4 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Hospital'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
