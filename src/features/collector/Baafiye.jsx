import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Filter, Phone, Calendar, MessageCircle, MessageSquare, ChevronDown, MapPin, X, User, FileText, CheckCircle2, Send, Users, Copy, Edit, ArrowRight, AlertCircle, Lock, MoreHorizontal, Plus, Clock, ChevronRight, Bell, Trash2, Upload, BarChart3, CircleUser, Heart, Pin, RefreshCw, Receipt, Tag } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomerEditModal from '../../components/CustomerEditModal';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// SAFE HELPERS
// SAFE HELPERS
const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr !== 'string') return null;

    // Check for DD/MM/YYYY or DD-MM-YYYY format first (Prioritize this!)
    // We expect this format from our save logic.
    const parts = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (parts) {
        // parts[1] is day, parts[2] is month, parts[3] is year
        return new Date(parts[3], parts[2] - 1, parts[1]);
    }

    // Fallback to standard parsing (e.g. for ISO strings YYYY-MM-DD)
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    return null;
};

const formatDateCompact = (dateStr) => {
    const date = parseDate(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const isDateToday = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return false;
    const today = new Date();
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
};

const isDateTomorrow = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.getDate() === tomorrow.getDate() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getFullYear() === tomorrow.getFullYear();
};

const getDaysDifference = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return 0;
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today - d;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// --- ADVANCED SMS LOGIC ---
const generateSMS = (c) => {
    if (!c || typeof c !== 'object') return '';
    const name = c.name || 'Customer';
    const note = (c.fahfahin || '').toLowerCase();
    const balanceVal = parseFloat(c.balance) || 0;
    const bal = balanceVal < 4.5 ? 4.5 : balanceVal;

    const isToday = isDateToday(c.date);

    // 1. Caawa + Today
    if ((note.includes('caawa')) && isToday) {
        return `Salaan! ${name}, waxaa la gaaray waqtigii balanta oo caawa ahayd. Fadlan soo dir lacagta oo dhan $${bal}. Mahadsanid.`;
    }

    // 2. Galab + Today
    if ((note.includes('galbta') || note.includes('galab')) && isToday) {
        return `Salaan! ${name}, waxaa la gaaray waqtigii balanta oo galbta ahayd. Fadlan soo dir lacagta oo dhan $${bal}. Mahadsanid.`;
    }

    // 3. Duhur + Today
    if ((note.includes('duhur')) && isToday) {
        return `Salaan! ${name}, waxaa la gaaray waqtigii balanta oo duhur ahayd. Fadlan soo dir lacagta oo dhan $${bal}. Mahadsanid.`;
    }

    // 4. Qataato
    if (note.includes('qataato')) {
        return `OGEYSIIS! Mudane ${name}, waa digniintii ugu dambaysay. Fadlan si degdeg ah u bixi lacagta kugu taagan oo dhan $${bal}.`;
    }

    // 5. Acc
    if (note.includes('acc')) {
        return `OGEYSIIS! Mudane ${name}, wali lacagtada ma aadan shubin $${bal} fadlan habkan u bixi *233*${c.sqn}*${bal}#`;
    }

    // 6. Balan Logic
    if (note.includes('balan')) {
        const diffDays = getDaysDifference(c.date);

        if (diffDays > 7) {
            return `Mudane ${name}, ballantii aad qabsatay ${c.date} waxay dhaaftay wax ka badan 7 maalmood. Kani waa ogeysiiskii ugu dambeeyay. Fadlan si degdeg ah lacagta u soo dir.`;
        }
        if (diffDays > 0) {
            return `Mudane ${name}, waxaan ku xusuusinaynaa ballantii aad qabsatay ${c.date} ee laga soo gudbay muddo ${diffDays} maalmood. Fadlan na qadari ee lacagta soo dir.`;
        }
        if (isToday) {
            return `Ballanta aad qabsatay waa maanta. Fadlan soo dir lacagta oo dhan $${bal}.`;
        }
        if (isDateTomorrow(c.date)) {
            return `Salaan ${name}, waxaan ku xusuusinaynaa inaad ballanti aad qabsatay aytahay BERRITO hadii aad heyso fadlan hada soo dir lacgtada waa $${bal}`;
        }
        if (diffDays < 0) {
            return `OGOW MUDANE: ${name}, waxaan ku xusuusinaynaa inaad Qabsatay ${c.date}. Fadlan balanta ilaali Mahadsanid. Your balance is $${bal}`;
        }
    }

    if (c.status === 'Qabyo') {
        return `Salaan ${name}. Waad ku mahadsan tahay bixinta qayb kamid ah lacagta. Waxaa kugu haray $${bal}. Fadlan soo dhammaystir inta dhiman.`;
    }

    if (note.includes('dhicid')) {
        return `Salaan ${name}, waan ku soo wacay laakiin telka kama aadan qaban. Fadlan soo dir lacagta korontada oo dhan $${bal}. Mahadsanid.`;
    }

    if (note === 'ok' || note.includes('ok -')) {
        return `Wali kama hayo, ${name}. Fadlan soo dir hee lacagta oo dhan $${bal} adigoo mahadsan ku soo dir 0619700985.`;
    }

    return `Salaam! ${name}, waxaa la dhaafay xiligii lacagta bixinta, fadlan soo dir lacagta korontada waxaana kugu taagan $${bal}. Mahadsanid.`;
};

export default function Baafiye() {
    const navigate = useNavigate();
    const location = useLocation();

    // UI STATE
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [quickActionId, setQuickActionId] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [previewRecipients, setPreviewRecipients] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [letterFilter, setLetterFilter] = useState('');
    const [callSelection, setCallSelection] = useState(null);
    const [sentItems, setSentItems] = useState(new Set());
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isCustomNoteMode, setIsCustomNoteMode] = useState(false);
    const [customNotes, setCustomNotes] = useState([]);
    const [viewingBalanceId, setViewingBalanceId] = useState(null);
    const [viewCallHistoryId, setViewCallHistoryId] = useState(null);
    const [callHistoryData, setCallHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeFormData, setActiveFormData] = useState({ date: '', note: '' });



    // DISCOUNT MODAL STATE
    const [discountModalCustomer, setDiscountModalCustomer] = useState(null);
    const [discountForm, setDiscountForm] = useState({ paidAmount: '' });


    // MESSAGE PREVIEW FLOW
    const [messageFlow, setMessageFlow] = useState({ step: 'idle', customer: null, channel: null, text: '' });

    // EXPANDED ACTIONS STATE
    const [expandedActionId, setExpandedActionId] = useState(null);
    const [balanDropdownId, setBalanDropdownId] = useState(null);
    const [balanNote, setBalanNote] = useState('');


    // FETCH CUSTOMERS (Local Storage with Firestore Fallback)
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('beco_current_user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (!user) {
                setLoading(false);
                return;
            }

            const zone = user.branch || 'General';
            console.log("Fetching customers from Zone:", zone, "for:", user.id);

            // QUERY LOGIC REFACTOR:
            // 1. Fetch by Zone Path AND collector_id
            const q = query(
                collection(db, 'zones', zone, 'customers'),
                where('collector_id', '==', user.id)
            );
            const querySnapshot = await getDocs(q);
            let data = querySnapshot.docs.map(doc => ({
                sqn: doc.id,
                _collectionPath: `zones/${zone}/customers`,
                ...doc.data()
            }));

            // LEGACY FALLBACK (Only check if main query is empty)
            // If empty, check generic 'customers' just in case data wasn't migrated but user is old.
            // But we prioritize Zone data.
            if (data.length === 0 && zone === 'General') {
                // Try reading from old collection ONLY if user has no specific zone
                // This helps transition.
                const legacyQ = query(collection(db, 'customers'), where('collector_id', '==', user.id));
                const legacySnap = await getDocs(legacyQ);
                if (!legacySnap.empty) {
                    data = legacySnap.docs.map(doc => ({ sqn: doc.id, _collectionPath: 'customers', ...doc.data() }));
                }
            }

            if (data && data.length > 0) {
                const mapped = data.map(c => ({
                    ...c,
                    sqn: c.sqn || c.id,
                    isFavorite: c.is_favorite ?? c.isFavorite ?? false,
                    is_favorite: c.is_favorite ?? c.isFavorite ?? false
                }));
                mapped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                setCustomers(mapped);
                localStorage.setItem('baafiye_local_data', JSON.stringify(mapped));
                setIsQuotaExceeded(false); // Reset if successful
            } else {
                setCustomers([]);
                if (navigator.onLine) {
                    localStorage.removeItem('baafiye_local_data');
                }
            }
        } catch (err) {
            console.error("Error fetching customers:", err);

            // CHECK FOR QUOTA ERROR
            if (err.message && (err.message.includes('quota') || err.message.includes('resource-exhausted'))) {
                setIsQuotaExceeded(true);
                console.warn("Quota exceeded. Switching to fully offline mode for reads.");
            }

            // Offline Fallback
            const localData = localStorage.getItem('baafiye_local_data');
            if (localData) setCustomers(JSON.parse(localData));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        // Restore custom notes
        const savedNotes = localStorage.getItem('baafiye_custom_notes');
        if (savedNotes) {
            try { setCustomNotes(JSON.parse(savedNotes)); } catch (e) { }
        }
    }, []);

    // DASHBOARD INTEGRATION (Filter via Location State)
    useEffect(() => {
        if (location.state?.filter) {
            const filter = location.state.filter;
            if (filter === 'Paid') {
                setActiveTab('paid');
                setSearchTerm('');
            } else if (filter === 'Balan') {
                setActiveTab('balan');
                setFilterType('balan');
            } else if (filter === 'Discount') {
                setActiveTab('active');
                setFilterType('discount');
            } else {
                setActiveTab('active');
                setFilterType('all');
                setSearchTerm(filter);
            }
        }
    }, [location.state]);

    // SAVE/UPDATE CUSTOMER (Firestore + Local Storage)
    const handleSaveCustomer = async (updatedCustomer) => {
        // Update State
        const newCustomers = customers.map(c =>
            c.sqn === updatedCustomer.sqn ? updatedCustomer : c
        );
        setCustomers(newCustomers);
        setSelectedCustomer(null);

        // Update Local Storage
        try {
            localStorage.setItem('baafiye_local_data', JSON.stringify(newCustomers));
            console.log("Customer saved to Local Storage");

            // Update Firestore
            // Assuming 'sqn' is the document ID. If not, we need the doc ID.
            // If the customer object has a separate 'id' field for Firestore doc ID, use that.
            // For now, let's assume sqn might be the ID or we query for it.
            // Best practice: Use specific ID.
            const docId = updatedCustomer.id || updatedCustomer.sqn;
            if (docId) {
                const collectionPath = updatedCustomer._collectionPath || 'customers';
                const customerRef = doc(db, collectionPath, String(docId));
                await updateDoc(customerRef, {
                    ...updatedCustomer,
                    is_favorite: updatedCustomer.isFavorite ?? false // Ensure boolean
                });
                console.log("Customer saved to Firestore");
            } else {
                console.warn("No ID found for customer, cannot update Firestore", updatedCustomer);
            }

        } catch (e) {
            console.error("Failed to save to Storage/DB", e);
            alert("Error saving data: " + e.message);
        }
    };

    // LOGGING HELPER
    const logActivity = async (type, detail, customerName, customerId) => {
        try {
            const userStr = localStorage.getItem('beco_current_user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            await addDoc(collection(db, 'activity_logs'), {
                user_id: user.id,
                action_type: type,
                details: { detail, customerName, customerId },
                created_at: new Date().toISOString()
            });

            // Optimistically update local count if it's a call
            if (type === 'call') {
                setCustomers(prev => prev.map(c =>
                    (c.sqn === customerId || c.id === customerId)
                        ? { ...c, callCount: (c.callCount || 0) + 1 }
                        : c
                ));
            }

        } catch (e) { console.error("Log error", e); }
    };

    // FETCH CALL HISTORY
    const handleViewCallHistory = async (c) => {
        setViewCallHistoryId(c.sqn);
        setCallHistoryData([]);
        setHistoryLoading(true);
        try {
            // Query logs for this customer
            const q = query(
                collection(db, 'activity_logs'),
                where('details.customerId', '==', c.sqn),
                where('action_type', '==', 'call')
            );
            // Note: Ordering requires composite index. Sorting client-side for safety.
            const snap = await getDocs(q);
            const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Sort Descending
            logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setCallHistoryData(logs);
        } catch (e) {
            console.error("History fetch error", e);
        } finally {
            setHistoryLoading(false);
        }
    };

    // CLEAR TODAY LOGIC (Local Storage Only)
    const handleClearToday = async () => {
        if (!window.confirm("Ma hubtaa inaad tirtirto jadwalka maanta (Clear Today)?")) return;

        // Update State
        const newCustomers = customers.map(c => {
            const f = (c.fahfahin || '').toLowerCase();
            const isToday = f.includes('caawa') || f.includes('galabta') || f.includes('galbta') || f.includes('duhur');
            if (isToday || c.isFavorite) {
                return { ...c, fahfahin: isToday ? '' : c.fahfahin, isFavorite: false };
            }
            return c;
        });
        setCustomers(newCustomers);

        // Update Local Storage
        try {
            localStorage.setItem('baafiye_local_data', JSON.stringify(newCustomers));
        } catch (e) {
            console.error("Failed to clear today in Local Storage", e);
        }
    };

    // --- FILTER & SORT LOGIC ---
    const [sortOrder, setSortOrder] = useState('asc');

    const filteredCustomers = useMemo(() => {
        let result = customers.filter(c => {
            if (!c) return false;
            const term = (searchTerm || '').toLowerCase();
            const cName = String(c.name || '').trim().toLowerCase();
            const cFahfahin = String(c.fahfahin || '').toLowerCase();
            const cSqn = String(c.sqn || '');

            // Tab Check
            if (activeTab === 'paid') {
                if (c.status !== 'Paid') return false;
            } else if (activeTab === 'balan') {
                if (c.status !== 'Balan') return false;
            } else if (activeTab === 'today') {
                const isToday = cFahfahin.includes('caawa') || cFahfahin.includes('galabta') || cFahfahin.includes('galbta') || cFahfahin.includes('duhur');
                if ((!isToday && !c.isFavorite) || c.status === 'Paid') return false;
            } else if (activeTab === 'active') {
                if (c.status === 'Paid') return false;
            }

            // Internal Filters
            if (filterType === 'balan' && c.status !== 'Balan') return false;
            if (filterType === 'discount' && c.status !== 'Discount') return false;
            // 2 Bilood Filter: Show if prev balance >= 2
            if (filterType === '2 Bilood') {
                const p = parseFloat(String(c.prev_balance || c.prev || '0').replace(/[^0-9.-]+/g, "") || 0);
                if (p < 2) return false;
            }

            // Letter
            if (letterFilter && !cName.startsWith(letterFilter.toLowerCase())) return false;

            // Search
            if (term) {
                const match = cName.includes(term) || cSqn.includes(term) || cFahfahin.includes(term) || (c.phone && c.phone.includes(term)) || (c.tell && c.tell.includes(term));
                if (!match) return false;
            }
            return true;
        });

        if (sortOrder) {
            result.sort((a, b) => {
                if (sortOrder === 'calls') {
                    return (b.callCount || 0) - (a.callCount || 0);
                }
                const nameA = String(a.name || '').toLowerCase();
                const nameB = String(b.name || '').toLowerCase();
                if (sortOrder === 'asc') return nameA.localeCompare(nameB);
                return nameB.localeCompare(nameA);
            });
        }
        return result;
    }, [customers, searchTerm, activeTab, filterType, letterFilter, sortOrder]);

    const listToRender = useMemo(() => {
        if (activeTab === 'balan') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const overdueAndToday = filteredCustomers.filter(c => {
                if (!c.date) return false;
                const appointmentDate = parseDate(c.date);
                if (!appointmentDate) return false;
                appointmentDate.setHours(0, 0, 0, 0);
                return appointmentDate <= today;
            });
            return overdueAndToday.sort((a, b) => {
                const dateA = parseDate(a.date);
                const dateB = parseDate(b.date);
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return dateB - dateA;
            });
        }
        return filteredCustomers;
    }, [filteredCustomers, activeTab]);

    // INFINITE SCROLL
    const [visibleCount, setVisibleCount] = useState(20);
    const observer = useRef();
    useEffect(() => { setVisibleCount(20); }, [listToRender]);
    const lastElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleCount < listToRender.length) {
                setVisibleCount(prev => prev + 20);
            }
        });
        if (node) observer.current.observe(node);
    }, [visibleCount, listToRender.length]);

    // DYNAMIC COUNTS (Based on current Search & Filter)
    const filteredListForCounts = useMemo(() => {
        return customers.filter(c => {
            // 1. Filter Logic (2 Bilood, Balan, Discount)
            if (filterType === '2 Bilood') {
                const p = parseFloat(String(c.prev_balance || c.prev || '0').replace(/[^0-9.-]+/g, "") || 0);
                if (p < 2) return false;
            } else if (filterType === 'balan') {
                if (c.status !== 'Balan') return false;
            } else if (filterType === 'discount') {
                if (c.status !== 'Discount') return false;
            }

            // 2. Search Logic
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const cName = String(c.name || '').toLowerCase();
                const cSqn = String(c.sqn || '');
                const cFahfahin = String(c.fahfahin || '').toLowerCase();
                const match = cName.includes(term) || cSqn.includes(term) || cFahfahin.includes(term) || (c.phone && c.phone.includes(term));
                if (!match) return false;
            }
            return true;
        });
    }, [customers, filterType, searchTerm]);

    const activeCount = filteredListForCounts.filter(c => c.status !== 'Paid').length;
    const paidCount = filteredListForCounts.filter(c => c.status === 'Paid').length;
    const balanCount = filteredListForCounts.filter(c => c.status === 'Balan').length; // Ensure 'Balan' status is set
    const todayCount = filteredListForCounts.filter(c => {
        if (c.status === 'Paid') return false;
        const f = (c.fahfahin || '').toLowerCase();
        return f.includes('caawa') || f.includes('galabta') || f.includes('galbta') || f.includes('duhur') || c.isFavorite;
    }).length;

    // --- NOTIFICATIONS (Supabase) ---
    const [myNotifications, setMyNotifications] = useState([]);
    const [activeNotification, setActiveNotification] = useState(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // --- NOTIFICATIONS (Disable) ---
    // const [myNotifications, setMyNotifications] = useState([]);
    // const [activeNotification, setActiveNotification] = useState(null);
    // const [isNotifOpen, setIsNotifOpen] = useState(false);

    // useEffect(() => { ... }) removed

    const markAsRead = async (notifId) => {
        const updated = myNotifications.map(n => n.id === notifId ? { ...n, read: true } : n);
        setMyNotifications(updated);
        setActiveNotification(null);
        try {
            await updateDoc(doc(db, 'notifications', notifId), { read: true });
        } catch (e) { console.error("Error marking read", e); }
    };

    const clearAllNotifications = async () => {
        setMyNotifications([]);
        setIsNotifOpen(false);

        const userStr = localStorage.getItem('beco_current_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        try {
            const q = query(collection(db, 'notifications'), where('user_id', '==', user.id));
            const snapshot = await getDocs(q);
            const batchPromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(batchPromises);
        } catch (e) { console.error("Error clearing notifications", e); }
    };

    // --- BLOCKED USER STATUS ---
    const [blockStatus, setBlockStatus] = useState(null);
    useEffect(() => {
        const checkBlock = async () => {
            const userStr = localStorage.getItem('beco_current_user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            try {
                const userDoc = await getDoc(doc(db, 'profiles', user.id));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.status === 'blocked' || data.status === 'suspended') {
                        setBlockStatus({ blocked: true, reason: data.blocked_reason || 'Contact Supervisor' });
                    }
                }
            } catch (e) { console.error("Block check failed", e); }
        };
        checkBlock();
    }, []);

    const handleUnlockRequest = () => {
        alert("Unlock Request Sent to Supervisor.\nPlease wait for approval.");
    }

    // --- SWIPE HANDLERS ---
    const handleTouchStart = (e, sqn) => {
        setSwipeState({ id: sqn, startX: e.targetTouches[0].clientX, currentX: e.targetTouches[0].clientX, isSwiping: false });
    };

    const handleTouchMove = (e) => {
        if (!swipeState.id) return;
        const currentX = e.targetTouches[0].clientX;
        const diff = currentX - swipeState.startX;
        if (Math.abs(diff) > 10 && e.cancelable) {
            // e.preventDefault(); 
        }
        setSwipeState(prev => ({ ...prev, currentX, isSwiping: Math.abs(diff) > 10 }));
    };

    const handleTouchEnd = (c) => {
        if (!swipeState.id) return;
        const diff = swipeState.currentX - swipeState.startX;
        const threshold = 100;
        if (diff > threshold) {
            setCallSelection(c);
        } else if (diff < -threshold) {
            handleMessageIconClick(c);
        }
        setSwipeState({ id: null, startX: 0, currentX: 0, isSwiping: false });
    };

    const handleMessageIconClick = (c) => {
        setMessageFlow({ step: 'select', customer: c, channel: null, text: '' });
    };

    // ... Messaging Logic from original (simplified)
    const handleChannelSelect = (channel) => {
        if (!messageFlow.customer) return;
        const msg = generateSMS(messageFlow.customer);
        setMessageFlow(prev => ({ ...prev, step: 'preview', channel, text: msg }));
    };

    const handleSendMessage = () => {
        const { channel, customer, text } = messageFlow;
        let phoneInput = String(customer.tell || customer.phone || '0610000000');
        const primaryPhone = phoneInput.split(/[\/\,\s]+/)[0].replace(/[^0-9]/g, '');

        let url = '';
        if (channel === 'whatsapp') {
            const finalPhone = primaryPhone.startsWith('252') ? primaryPhone : `252${primaryPhone}`;
            url = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        } else {
            url = `sms:${primaryPhone}?body=${encodeURIComponent(text)}`;
            window.location.href = url;
        }

        logActivity('message', `${channel} sent`, customer.name, customer.sqn);

        setTimeout(() => {
            setMessageFlow({ step: 'idle', customer: null, channel: null, text: '' });
        }, 100);
    };

    // SUMMARY STATS (Ignores Tab, Respects Filter/Search)
    const summaryStats = useMemo(() => {
        if (filterType === 'all') return null;

        return customers.filter(c => {
            // Filter Logic
            if (filterType === '2 Bilood') {
                const p = parseFloat(String(c.prev_balance || c.prev || '0').replace(/[^0-9.-]+/g, "") || 0);
                if (p < 2) return false;
            } else if (filterType === 'balan') {
                if (c.status !== 'Balan') return false;
            } else if (filterType === 'discount') {
                if (c.status !== 'Discount') return false;
            }

            // Search Logic
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const cName = String(c.name || '').toLowerCase();
                const cSqn = String(c.sqn || '');
                const cFahfahin = String(c.fahfahin || '').toLowerCase();
                const match = cName.includes(term) || cSqn.includes(term) || cFahfahin.includes(term) || (c.phone && c.phone.includes(term));
                if (!match) return false;
            }
            return true;
        }).reduce((acc, curr) => {
            acc.count++;
            acc.prev += (parseFloat(String(curr.prev_balance || curr.prev || '0').replace(/[^0-9.-]+/g, "")) || 0);
            acc.due += (parseFloat(String(curr.balance || '0').replace(/[^0-9.-]+/g, "")) || 0);
            if (curr.status === 'Paid') acc.paid++;
            else acc.active++;
            return acc;
        }, { count: 0, active: 0, paid: 0, prev: 0, due: 0 });

    }, [customers, filterType, searchTerm]);

    if (blockStatus?.blocked) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-black text-gray-900">Access Blocked</h2>
                <p className="text-gray-500 mb-4">{blockStatus.reason}</p>
                <button onClick={handleUnlockRequest} className="bg-black text-white px-6 py-3 rounded-xl font-bold">Request Unblock</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* NOTIFICATION TOAST REMOVED */}

            {/* HEADER (Fixed) */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 shadow-lg pt-4 px-4 py-3 flex-none flex justify-between items-center text-white z-30">
                {isSearchActive ? (
                    <div className="flex-1 flex gap-2">
                        <input autoFocus type="text" placeholder="Search..." className="flex-1 bg-white/10 rounded-xl px-4 py-2 border border-white/20 focus:outline-none placeholder-indigo-200 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <button onClick={() => { setIsSearchActive(false); setSearchTerm(''); }} className="font-bold text-sm">Cancel</button>
                    </div>
                ) : (
                    <>
                        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 shadow-sm transition-transform hover:scale-105">
                            <img src="/logo.png" alt="Beco" className="h-8 w-auto object-contain drop-shadow-sm" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => navigate('/billing')} className="p-2 bg-white/10 rounded-xl"><BarChart3 size={20} /></button>
                            <button onClick={() => setIsSearchActive(true)} className="p-2 bg-white/10 rounded-xl"><Search size={20} /></button>
                            <button onClick={() => fetchCustomers()} className="p-2 bg-white/10 rounded-xl"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="p-2 bg-white/10 rounded-xl"><Filter size={20} /></button>
                        </div>
                    </>
                )}
            </div>

            {/* FILTERS & A-Z */}
            {isFilterOpen && (
                <div className="bg-indigo-900/95 backdrop-blur-md p-4 absolute w-full z-40 shadow-xl space-y-4 animate-in slide-in-from-top-5">
                    {/* Main Filters */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {['all', 'balan', 'discount', '2 Bilood'].map(f => {
                            const isSelected = filterType === f;
                            const isRed = f === '2 Bilood';
                            return (
                                <button
                                    key={f}
                                    onClick={() => { setFilterType(f); setLetterFilter(''); setIsFilterOpen(false); }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm whitespace-nowrap
                                        ${isSelected
                                            ? (isRed ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-white text-indigo-900 ring-2 ring-indigo-300')
                                            : (isRed ? 'bg-red-500/20 text-red-100 hover:bg-red-500/40' : 'bg-white/10 text-indigo-200 hover:bg-white/20')
                                        }`}
                                >
                                    {f}
                                </button>
                            );
                        })}
                    </div>

                    {/* A-Z Filter */}
                    <div className="flex gap-1 overflow-x-auto no-scrollbar border-t border-white/10 pt-3">
                        <button
                            onClick={() => { setLetterFilter(''); setIsFilterOpen(false); }}
                            className={`min-w-[32px] h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${!letterFilter ? 'bg-indigo-500 text-white' : 'text-indigo-300 hover:bg-white/10'}`}
                        >
                            All
                        </button>
                        {[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(char => (
                            <button
                                key={char}
                                onClick={() => { setLetterFilter(char); setIsFilterOpen(false); }}
                                className={`min-w-[32px] h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${letterFilter === char ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-300 hover:bg-white/10'}`}
                            >
                                {char}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* TABS (Fixed) */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-1 pb-3 shadow-lg flex-none z-20">
                <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-sm">
                    {['active', 'today', 'balan', 'paid'].map(tab => {
                        let count = 0;
                        if (tab === 'active') count = activeCount;
                        if (tab === 'today') count = todayCount;
                        if (tab === 'balan') count = balanCount;
                        if (tab === 'paid') count = paidCount;

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-black capitalize transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-lg' : 'text-indigo-200 hover:text-white'}`}
                            >
                                {tab} {count > 0 && `(${count})`}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 pb-24 no-scrollbar">

                {/* CLEAR TODAY BAR */}
                {activeTab === 'today' && todayCount > 0 && (
                    <div className="bg-yellow-50 px-4 py-2 flex justify-between items-center border-b border-yellow-200">
                        <span className="text-xs font-bold text-yellow-800 flex items-center gap-1"><AlertCircle size={14} /> End of Day?</span>
                        <button onClick={handleClearToday} className="bg-white border border-yellow-300 text-red-500 text-xs font-bold px-3 py-1 rounded-lg shadow-sm">Clear List</button>
                    </div>
                )}

                {/* GENERAL SUMMARY CARD (Applied for ALL Filters) */}
                {filterType !== 'all' && summaryStats && summaryStats.count > 0 && (
                    <div className="mx-3 mt-3 mb-2 p-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl shadow-lg text-white animate-in slide-in-from-top-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-3 -translate-y-3">
                            <BarChart3 size={100} />
                        </div>

                        <div className="relative z-10">
                            {/* Header Line */}
                            <div className="flex items-center justify-between mb-3 opacity-95">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-inner">
                                        <Users size={18} className="text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-2xl font-black leading-none">{summaryStats.count}</h3>
                                        <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest">{filterType} Clients</p>
                                    </div>
                                </div>

                                {/* ACTIVE / PAID PILLS */}
                                <div className="flex gap-1.5">
                                    <div className="bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/30 rounded-md px-2 py-1 flex flex-col items-center min-w-[50px]">
                                        <span className="text-[10px] font-bold text-emerald-300">Active</span>
                                        <span className="text-sm font-black">{summaryStats.active}</span>
                                    </div>
                                    <div className="bg-blue-500/30 backdrop-blur-sm border border-blue-400/30 rounded-md px-2 py-1 flex flex-col items-center min-w-[50px]">
                                        <span className="text-[10px] font-bold text-blue-200">Paid</span>
                                        <span className="text-sm font-black">{summaryStats.paid}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-black/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-1.5 opacity-10"><Clock size={30} /></div>
                                    <p className="text-[9px] font-bold text-indigo-200 uppercase mb-0.5 tracking-wider">Total Prev Debt</p>
                                    <h3 className="text-lg font-black text-yellow-300">
                                        ${summaryStats.prev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </h3>
                                </div>
                                <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-1.5 opacity-10"><Receipt size={30} /></div>
                                    <p className="text-[9px] font-bold text-indigo-100 uppercase mb-0.5 tracking-wider">Total Due</p>
                                    <h3 className="text-lg font-black text-white">
                                        ${summaryStats.due.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CUSTOMER LIST */}
                <div className="p-4 min-h-[500px]">
                    {loading && customers.length === 0 ? (
                        <div className="flex justify-center pt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : listToRender.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-blue-100">
                                <Upload size={36} className="text-blue-500" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Data Not Found</h3>
                            <p className="text-gray-500 font-medium mb-8 max-w-[280px] mx-auto leading-relaxed">
                                Start by uploading your customer data Excel sheet to see them here.
                            </p>
                            <button
                                onClick={() => navigate('/services')}
                                className="bg-gray-900 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                            >
                                <span className="text-lg">Upload Now</span>
                                <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                                    <ChevronRight size={18} />
                                </div>
                            </button>
                        </div>
                    ) : (
                        listToRender.slice(0, visibleCount).map((c, index) => {
                            const isSwiped = swipeState.id === c.sqn;
                            const offset = isSwiped ? swipeState.currentX - swipeState.startX : 0;
                            const visualOffset = offset;
                            const isLast = index === visibleCount - 1;
                            const isBalanceOpen = viewingBalanceId === c.sqn;
                            const prevBal = parseFloat(String(c.prev_balance || c.prev || '0').replace(/[^0-9.-]+/g, "") || 0);
                            const isHighRisk = prevBal >= 3;
                            const is2BiloodMode = filterType === '2 Bilood' || (filterType === 'all' && prevBal >= 2);

                            return (
                                <div key={c.sqn} ref={isLast ? lastElementRef : null} className={`mb-4 relative group ${isBalanceOpen ? 'z-50' : 'z-0'}`}>
                                    {/* SWIPE BACKGROUNDS - Ultra Premium with Animations */}
                                    <div className="absolute inset-0 rounded-3xl overflow-hidden flex justify-between items-center px-6">
                                        {/* CALL ICON - Left */}
                                        <div className={`flex items-center gap-3 transition-all duration-500 ${offset > 50 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                            <div className="relative">
                                                {/* Animated Glow Ring */}
                                                <div className={`absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl blur-xl ${offset > 50 ? 'animate-pulse' : ''}`}></div>

                                                {/* Icon Container */}
                                                <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 p-3.5 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform">
                                                    <Phone size={22} className="text-white animate-bounce" style={{ animationDuration: '1.5s' }} />
                                                </div>

                                                {/* Floating Particles */}
                                                {offset > 50 && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <span className="font-black text-green-700 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl text-sm shadow-lg border-2 border-green-200 animate-pulse">
                                                    Call
                                                </span>
                                            </div>
                                        </div>

                                        {/* MESSAGE ICON - Right */}
                                        <div className={`flex items-center gap-3 transition-all duration-500 ${offset < -50 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                            <div className="relative">
                                                <span className="font-black text-blue-700 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl text-sm shadow-lg border-2 border-blue-200 animate-pulse">
                                                    Message
                                                </span>
                                            </div>
                                            <div className="relative">
                                                {/* Animated Glow Ring */}
                                                <div className={`absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-xl ${offset < -50 ? 'animate-pulse' : ''}`}></div>

                                                {/* Icon Container */}
                                                <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-3.5 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform">
                                                    <MessageSquare size={22} className="text-white animate-bounce" style={{ animationDuration: '1.5s' }} />
                                                </div>

                                                {/* Floating Particles */}
                                                {offset < -50 && (
                                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-green-50 via-emerald-50/50 to-transparent rounded-l-3xl transition-all duration-300 ${offset > 0 ? 'opacity-100' : 'opacity-0'}`}></div>
                                    <div className={`absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-50 via-indigo-50/50 to-transparent rounded-r-3xl transition-all duration-300 ${offset < 0 ? 'opacity-100' : 'opacity-0'}`}></div>

                                    {/* CARD CONTENT (Grid Removed - Flatter Look) */}
                                    <div
                                        onTouchStart={(e) => handleTouchStart(e, c.sqn)}
                                        // ... touch handlers remain same
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={() => {
                                            if (Math.abs(offset) > 100) {
                                                if (offset > 0) setCallSelection(c);
                                                else handleMessageIconClick(c);
                                            }
                                            handleTouchEnd(c);
                                        }}
                                        style={{ transform: `translateX(${visualOffset}px)`, transition: isSwiped ? 'none' : 'transform 0.3s ease-out' }}
                                        onClick={() => setSelectedCustomer(c)}
                                        className={`relative bg-gradient-to-br from-white to-stone-50 p-1 rounded-xl shadow-[0_1px_4px_-1px_rgba(0,0,0,0.05)] active:scale-[0.99] transition-all mb-px border
                                        ${isHighRisk ? 'border-red-400 bg-red-50/30' : 'border-white'}
                                        ${expandedActionId === c.sqn ? 'z-50 !overflow-visible' : 'z-10'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            {/* Left Info */}
                                            <div className="flex-1 min-w-0 pr-1">
                                                <div className="flex items-center gap-2 relative">
                                                    {/* ACTION TRIGGER (Moved to be less intrusive, or kept same) */}
                                                    <div className="relative">
                                                        {/* Copy the whole action button logic here if needed, but for minimal change just keep structure */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setExpandedActionId(expandedActionId === c.sqn ? null : c.sqn); }}
                                                            className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 relative overflow-hidden active:scale-95
                                                            ${expandedActionId === c.sqn
                                                                    ? 'bg-red-500 text-white rotate-90 shadow-md'
                                                                    : 'bg-white text-gray-500 shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow-md'}`}
                                                        >
                                                            {expandedActionId === c.sqn ? <X size={14} strokeWidth={3} /> : <MoreHorizontal size={16} strokeWidth={2.5} />}
                                                        </button>
                                                        {/* EXPANDED MENU POPUP (Keep existing logic) */}
                                                        {/* EXPANDED MENU POPUP - ANIMATED ICONS */}
                                                        {/* EXPANDED MENU POPUP - ANIMATED ICONS */}
                                                        {expandedActionId === c.sqn && (
                                                            <div onClick={(e) => e.stopPropagation()} className="absolute ml-8 -mt-8 z-[60] flex items-center animate-in slide-in-from-left-4 zoom-in-90 duration-300">

                                                                {/* MAIN ACTIONS CONTAINER */}
                                                                <div className="bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 rounded-2xl flex items-center p-2 gap-3 ring-1 ring-black/5">
                                                                    {/* CALL */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setCallSelection(c); }}
                                                                        className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm active:scale-90 transition-transform hover:bg-emerald-100"
                                                                    >
                                                                        <Phone size={18} fill="currentColor" className="mb-0.5" />
                                                                        <span className="text-[9px] font-bold uppercase leading-none">Call</span>
                                                                    </button>

                                                                    {/* MESSAGE */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleMessageIconClick(c); }}
                                                                        className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm active:scale-90 transition-transform hover:bg-blue-100"
                                                                    >
                                                                        <MessageCircle size={18} fill="currentColor" className="mb-0.5" />
                                                                        <span className="text-[9px] font-bold uppercase leading-none">SMS</span>
                                                                    </button>



                                                                    {/* DISCOUNT (Newly Added) */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDiscountModalCustomer(c);
                                                                            setDiscountForm({ paidAmount: '' });
                                                                        }}
                                                                        className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-purple-50 text-purple-600 border border-purple-100 shadow-sm active:scale-90 transition-transform hover:bg-purple-100"
                                                                    >
                                                                        <Tag size={18} className="mb-0.5" />
                                                                        <span className="text-[9px] font-bold uppercase leading-none">Disc.</span>
                                                                    </button>

                                                                    {/* BALAN (TOGGLES DROPDOWN) */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setBalanDropdownId(balanDropdownId === c.sqn ? null : c.sqn);
                                                                            setActiveFormData({ date: '', note: '' });
                                                                        }}
                                                                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border shadow-sm active:scale-90 transition-transform
                                                                        ${balanDropdownId === c.sqn ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-200' : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100'}`}
                                                                    >
                                                                        <Calendar size={18} className="mb-0.5" />
                                                                        <span className="text-[9px] font-bold uppercase leading-none">Balan</span>
                                                                    </button>
                                                                </div>

                                                                {/* BALAN MODAL - FIXED OVERLAY */}
                                                                {balanDropdownId === c.sqn && (
                                                                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setBalanDropdownId(null);
                                                                        }}
                                                                    >
                                                                        <div
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="bg-white rounded-3xl p-6 w-[85%] max-w-[320px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20"
                                                                        >
                                                                            <div className="flex justify-between items-center mb-4">
                                                                                <h4 className="text-lg font-black text-gray-800">📅 Set Appointment</h4>
                                                                                <button onClick={() => setBalanDropdownId(null)} className="p-1 bg-gray-100 rounded-full"><X size={18} /></button>
                                                                            </div>

                                                                            <div className="space-y-4">
                                                                                <div>
                                                                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        autoFocus
                                                                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-base font-bold outline-none focus:border-orange-500 transition-colors"
                                                                                        onChange={(e) => setActiveFormData(prev => ({ ...prev, date: e.target.value }))}
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Note</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Optional details..."
                                                                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500 transition-colors"
                                                                                        onChange={(e) => setActiveFormData(prev => ({ ...prev, note: e.target.value }))}
                                                                                    />
                                                                                </div>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (!activeFormData.date) return alert("Please pick a date");
                                                                                        // Reuse handleSaveCustomer logic by constructing object
                                                                                        const updatedC = {
                                                                                            ...c,
                                                                                            status: 'Balan',
                                                                                            date: activeFormData.date.split('-').reverse().join('/'), // Convert YYYY-MM-DD to DD/MM/YYYY
                                                                                            fahfahin: activeFormData.note ? `Balan: ${activeFormData.note}` : 'Balan'
                                                                                        };
                                                                                        handleSaveCustomer(updatedC);
                                                                                        setBalanDropdownId(null);
                                                                                        setExpandedActionId(null);
                                                                                    }}
                                                                                    className="w-full bg-orange-500 text-white font-bold py-2 rounded-lg text-xs shadow-lg active:scale-95 transition-transform"
                                                                                >
                                                                                    Confirm Balan
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className={`font-bold truncate text-xs mr-1 ${c.status === 'Paid' ? 'line-through text-gray-400' : (filterType === '2 Bilood' || prevBal >= 2 ? 'text-red-600' : 'text-gray-900')}`}>{c.name}</h3>

                                                    {/* PIN TOGGLE AT NAME END */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSaveCustomer({ ...c, isFavorite: !c.isFavorite }); }}
                                                        className="focus:outline-none active:scale-90 transition-transform"
                                                    >
                                                        <Pin size={14} className={c.isFavorite ? "text-violet-600 fill-violet-600" : "text-gray-300"} />
                                                    </button>

                                                    {/* MINI CALL ICON (Counts) */}
                                                    {/* MINI CALL ICON (Counts) */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewCallHistory(c);
                                                        }}
                                                        className={`focus:outline-none active:scale-90 transition-transform ml-2 p-0.5 rounded-full border ${(!c.callCount || c.callCount === 0) ? 'bg-white border-gray-100 shadow-sm' : 'bg-green-50 border-green-100'}`}
                                                    >
                                                        <div className="flex items-center gap-0.5 px-0.5">
                                                            <Phone size={10} className={(!c.callCount || c.callCount === 0) ? "text-gray-300" : "text-green-600 fill-green-600"} />
                                                            <span className={`text-[9px] font-black leading-none ${(!c.callCount || c.callCount === 0) ? "text-gray-300" : "text-green-700"}`}>
                                                                {c.callCount || 0}
                                                            </span>
                                                        </div>
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-bold pl-8 -mt-0.5">
                                                    <span className="bg-gray-100 text-gray-500 px-1.5 py-0 rounded font-mono border border-gray-200">{c.sqn}</span>
                                                    {c.status === 'Balan' && <span className="bg-orange-50 text-orange-600 px-1.5 py-0 rounded flex items-center gap-1 border border-orange-100"><Calendar size={9} /> {formatDateCompact(c.date)}</span>}
                                                    {c.fahfahin && <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0 rounded truncate max-w-[150px] border border-indigo-100">{c.fahfahin}</span>}
                                                </div>
                                            </div>

                                            {/* Right Balance */}
                                            <div className="text-right flex flex-col items-end justify-center">
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setViewingBalanceId(viewingBalanceId === c.sqn ? null : c.sqn);
                                                    }}
                                                    className={`text-sm font-black leading-tight ${c.status === 'Paid' ? 'text-emerald-500' : 'text-gray-900'} cursor-pointer`}
                                                >
                                                    ${c.balance}
                                                </div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase leading-none mt-0.5">Due</div>

                                                {/* BALANCE POPUP (STYLED) */}
                                                {isBalanceOpen && (
                                                    <div className="absolute top-10 right-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white p-4 rounded-2xl shadow-2xl z-50 min-w-[140px] animate-in zoom-in-95 border border-white/20">
                                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/20">
                                                            <span className="text-[10px] text-indigo-100 font-medium">Total</span>
                                                            <span className="font-bold text-sm">${c.total || c.balance}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] text-indigo-100 font-medium">Prev</span>
                                                            <span className={`font-bold text-xs opacity-90 ${filterType === '2 Bilood' || parseFloat(c.prev_balance || 0) >= 3 ? 'text-red-200' : 'text-white'}`}>${c.prev_balance || c.prev || 0}</span>
                                                        </div>
                                                        <div className="mt-2 text-[9px] text-center text-indigo-200 uppercase tracking-widest font-bold">
                                                            Beco Energy
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {visibleCount < listToRender.length && <div className="text-center py-4 text-xs font-bold text-gray-400">Loading more...</div>}
                </div>

                {/* MODALS */}
                {
                    selectedCustomer && (
                        <CustomerEditModal
                            customer={selectedCustomer}
                            onClose={() => setSelectedCustomer(null)}
                            onSave={handleSaveCustomer}
                        />
                    )
                }

                {/* MESSAGE MODAL */}
                {
                    messageFlow.step !== 'idle' && (
                        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in zoom-in-95">
                                {messageFlow.step === 'select' ? (
                                    <>
                                        <h3 className="text-xl font-black text-center mb-6">Choose Channel</h3>
                                        <div className="space-y-3">
                                            <button onClick={() => handleChannelSelect('whatsapp')} className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold flex justify-center items-center gap-2">
                                                <MessageCircle fill="white" /> WhatsApp
                                            </button>
                                            <button onClick={() => handleChannelSelect('sms')} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex justify-center items-center gap-2">
                                                <MessageSquare /> SMS
                                            </button>
                                            <button onClick={() => setMessageFlow({ step: 'idle', customer: null })} className="w-full py-3 text-gray-400 font-bold">Cancel</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-black mb-4">Preview Message</h3>
                                        <textarea
                                            value={messageFlow.text}
                                            onChange={e => setMessageFlow(prev => ({ ...prev, text: e.target.value }))}
                                            className="w-full h-32 bg-gray-50 rounded-xl p-3 text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex gap-3 mt-4">
                                            <button onClick={() => setMessageFlow({ step: 'idle', customer: null })} className="flex-1 py-3 text-gray-400 font-bold">Cancel</button>
                                            <button onClick={handleSendMessage} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Send</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* CALL MODAL */}
                {
                    callSelection && (
                        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 animate-pulse">
                                    <Phone size={32} fill="currentColor" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-1">{callSelection.name}</h3>
                                <p className="text-gray-400 font-medium text-xs mb-6 uppercase tracking-wider">Select Number to Call</p>

                                <div className="space-y-3">
                                    {/* SQN / TEEL OPTION */}
                                    {/* SQN / TEEL OPTION - DIRECT DIAL */}
                                    <div
                                        className="flex items-center justify-between w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:bg-green-50 hover:border-green-200 transition-all cursor-pointer active:scale-95"
                                        onClick={() => {
                                            logActivity('call', 'SQN/Tell', callSelection.name, callSelection.sqn);
                                            window.location.href = `tel:${callSelection.tell}`;
                                        }}
                                    >
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-0.5">Account / SQN</div>
                                            <div className="font-black text-lg text-gray-900">{callSelection.tell || 'N/A'}</div>
                                            <div className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-1">SQN: {callSelection.sqn}</div>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-full shadow-sm text-gray-400 group-hover:text-green-600 transition-colors">
                                            <Phone size={20} />
                                        </div>
                                    </div>

                                    {/* MOBILE / PHONE OPTION - DIRECT DIAL */}
                                    {callSelection.phone && callSelection.phone !== callSelection.tell && (
                                        <div
                                            className="flex items-center justify-between w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer active:scale-95"
                                            onClick={() => {
                                                logActivity('call', 'Mobile', callSelection.name, callSelection.sqn);
                                                window.location.href = `tel:${callSelection.phone}`;
                                            }}
                                        >
                                            <div className="text-left">
                                                <div className="text-xs font-bold text-gray-400 uppercase mb-0.5">Mobile Number</div>
                                                <div className="font-black text-lg text-gray-900">{callSelection.phone}</div>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-full shadow-sm text-gray-400 group-hover:text-blue-600 transition-colors">
                                                <Phone size={20} />
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={() => setCallSelection(null)} className="w-full py-3 text-gray-400 font-bold text-sm hover:text-gray-600 mt-2">Cancel</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* HISTORY MODAL */}
                {viewCallHistoryId && (
                    <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in zoom-in-95 max-h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-lg flex items-center gap-2">
                                    <Clock size={20} className="text-gray-400" />
                                    Call History
                                </h3>
                                <button onClick={() => setViewCallHistoryId(null)} className="bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-[200px]">
                                {historyLoading ? (
                                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                                ) : callHistoryData.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 font-medium">No calls recorded yet.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {callHistoryData.map(log => (
                                            <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="bg-green-100 p-2 rounded-full text-green-600 mt-1"><Phone size={14} /></div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900">
                                                        {new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">{log.details.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* DISCOUNT CALCULATION MODAL */}
                {discountModalCustomer && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setDiscountModalCustomer(null)}>
                        <div onClick={e => e.stopPropagation()} className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Apply Discount</h3>
                                    <p className="text-xs font-bold text-gray-400">Calculate & Save</p>
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

                                        handleSaveCustomer({
                                            ...discountModalCustomer,
                                            status: 'Discount',
                                            discountAmount: discount.toFixed(2),
                                            paidAmount: paid.toFixed(2),
                                            fahfahin: `Discount Request: $${discount.toFixed(2)} (Paid $${paid})`
                                        });
                                        setDiscountModalCustomer(null);
                                        setExpandedActionId(null);
                                    }}
                                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all text-sm uppercase tracking-wide flex justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>Confirm Discount</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
