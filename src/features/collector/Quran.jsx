import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Search, Loader2, BookOpen, Mic2, Check, Settings, Type, Headphones } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

// Famous Reciters List
const RECITERS = [
    { id: 'afs', name: 'Mishary Alafasy', url: 'https://server8.mp3quran.net/afs/' },
    { id: 'sds', name: 'Al-Sudais', url: 'https://server11.mp3quran.net/sds/' },
    { id: 'shur', name: 'Saud Al-Shuraim', url: 'https://server7.mp3quran.net/shur/' },
    { id: 'yasser', name: 'Yasser Al-Dosari', url: 'https://server11.mp3quran.net/yasser/' },
    { id: 'maher', name: 'Maher Al Muaiqly', url: 'https://server12.mp3quran.net/maher/' },
    { id: 'ajm', name: 'Ahmed Al-Ajmy', url: 'https://server10.mp3quran.net/ajm/' }
];

// Reading Themes
const THEMES = {
    light: { name: 'Light', bg: 'bg-white', text: 'text-gray-900', secondary: 'bg-gray-100' },
    sepia: { name: 'Sepia', bg: 'bg-[#f4ecd8]', text: 'text-[#5c4b37]', secondary: 'bg-[#ebdcb2]' },
    dark: { name: 'Dark', bg: 'bg-gray-900', text: 'text-gray-100', secondary: 'bg-gray-800' }
};

export default function Quran() {
    const navigate = useNavigate();
    const location = useLocation();
    // Default to 'audio' if no state passed
    const { mode: initialMode } = location.state || { mode: 'audio' };

    // Internal active mode state
    const [activeMode, setActiveMode] = useState(initialMode);

    const [surahs, setSurahs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSurah, setCurrentSurah] = useState(null);
    const [readingSurah, setReadingSurah] = useState(null);
    const [ayahs, setAyahs] = useState([]);
    const [loadingText, setLoadingText] = useState(false);

    // Reading Settings
    const [theme, setTheme] = useState('sepia');
    const [fontSize, setFontSize] = useState(32); // Default larger for readability
    const [showSettings, setShowSettings] = useState(false);

    // Reciter State
    const [selectedReciter, setSelectedReciter] = useState(() => {
        const saved = localStorage.getItem('quranReciter');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return RECITERS[0];
    });
    const [showReciters, setShowReciters] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());
    const [searchTerm, setSearchTerm] = useState('');

    // Load Surah List
    useEffect(() => {
        // Fetch Surah List
        fetch('https://api.quran.com/api/v4/chapters?language=en')
            .then(res => res.json())
            .then(data => {
                setSurahs(data.chapters);
                setLoading(false);

                // Check for Auto-Play/Continue navigation from Dashboard
                const autoSurahId = location.state?.surahId;
                if (autoSurahId && data.chapters) {
                    const target = data.chapters.find(s => s.id === Number(autoSurahId));
                    if (target) {
                        openReader(target);
                    }
                }
            })
            .catch(err => {
                console.error("Failed", err);
                setLoading(false);
            });
    }, []);

    // Save progress
    const saveProgress = (surah) => {
        localStorage.setItem('lastReadSurahId', surah.id);
        localStorage.setItem('lastReadSurahName', surah.name_simple);
        localStorage.setItem('lastReadDate', new Date().toISOString());
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const playSurah = (surah) => {
        if (currentSurah?.id === surah.id) {
            togglePlay();
            return;
        }
        const paddedId = String(surah.id).padStart(3, '0');
        // Use dynamically selected URL
        audioRef.current.src = `${selectedReciter.url}${paddedId}.mp3`;
        audioRef.current.play();
        setCurrentSurah(surah);
        setIsPlaying(true);
    };

    const changeReciter = (reciter) => {
        setSelectedReciter(reciter);
        localStorage.setItem('quranReciter', JSON.stringify(reciter));
        setShowReciters(false);

        // If playing, restart with new reciter
        if (currentSurah && isPlaying) {
            const paddedId = String(currentSurah.id).padStart(3, '0');
            audioRef.current.src = `${reciter.url}${paddedId}.mp3`;
            audioRef.current.play();
        }
    };

    const openReader = (surah) => {
        saveProgress(surah); // Ensure we save progress when reader is opened
        setReadingSurah(surah);
        setLoadingText(true);

        // Auto-play audio if not already playing this surah (ONLY IN AUDIO MODE or Explicit Trigger)
        // If mode is 'read' or 'tafsiir', we don't auto-play unless user wants to.
        if (activeMode === 'audio' && currentSurah?.id !== surah.id) {
            playSurah(surah);
        }

        // Fetch Arabic Text - Using Quran.com API V4 (Reliable) - Fetch ALL verses (up to 300)
        const fetchArabic = fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah.id}&per_page=300`);

        // Fetch Translation if Tafsiir Mode (ID 46 = Somali - Mahmud Abduh)
        const fetchTranslation = activeMode === 'tafsiir'
            ? fetch(`https://api.quran.com/api/v4/quran/translations/46?chapter_number=${surah.id}&per_page=300`)
            : Promise.resolve(null);

        Promise.all([fetchArabic, fetchTranslation])
            .then(async ([resArabic, resTrans]) => {
                const dataArabic = await resArabic.json();
                const dataTrans = resTrans ? await resTrans.json() : null;

                // Map Quran.com structure to our app's structure
                if (dataArabic.verses) {
                    const formattedAyahs = dataArabic.verses.map((v, index) => {
                        // Find matching translation if available
                        let translationText = null;
                        if (dataTrans?.translations) {
                            // Option A: Direct Index Match (Usually reliable for translations by chapter)
                            translationText = dataTrans.translations[index]?.text;
                        }

                        return {
                            number: v.id,
                            text: v.text_uthmani,
                            numberInSurah: v.verse_key.split(':')[1],
                            translation: translationText // Add translation field
                        };
                    });
                    setAyahs(formattedAyahs);
                } else {
                    console.error("Quran API Structure Mismatch");
                }
                setLoadingText(false);
            })
            .catch(err => {
                console.error("Reader Error", err);
                setLoadingText(false);
            });
    };

    useEffect(() => {
        const audio = audioRef.current;
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);

        return () => {
            audio.pause();
            audio.src = "";
        };
    }, []);

    const filteredSurahs = surahs.filter(s =>
        s?.name_simple?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s?.id).includes(searchTerm)
    );

    // Dynamic Row Click Handler
    const handleRxClick = (surah) => {
        if (activeMode === 'audio') {
            playSurah(surah);
        } else {
            // Read or Tafsiir -> Open Reader
            openReader(surah);
        }
    };

    // COMPONENTS
    const FloatingPlayer = () => {
        if (activeMode === 'tafsiir') return null;

        return (
            currentSurah && (
                <div className="fixed bottom-4 left-0 right-0 z-[60] animate-in slide-in-from-bottom duration-500 flex justify-center w-full pointer-events-none">
                    <div className="w-[94%] max-w-xl pointer-events-auto bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 pl-3 pr-2 shadow-2xl shadow-black/50 flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 overflow-hidden group cursor-pointer" onClick={() => !readingSurah && openReader(currentSurah)}>
                            <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                {isPlaying && <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping opacity-75"></div>}
                                <Headphones size={18} className="text-emerald-400 relative z-10" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-white truncate text-xs sm:text-sm leading-tight mb-0.5">{currentSurah.name_simple}</h3>
                                <p className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-400 tracking-wider truncate">Reciter: {selectedReciter.name.split(' ')[0]}</p>
                            </div>
                        </div>

                        <div className="flex items-center pl-2">
                            <button
                                onClick={togglePlay}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl hover:bg-emerald-50"
                            >
                                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                            </button>
                        </div>
                    </div>
                </div>
            )
        );
    };

    // READER VIEW
    if (readingSurah) {
        const activeTheme = THEMES[theme];
        const pageStyle = {
            boxShadow: theme === 'light' || theme === 'sepia'
                ? 'inset 0 0 50px rgba(0,0,0,0.02), 0 0 20px rgba(0,0,0,0.05)'
                : 'none',
        };

        return (
            <div className={cn("flex flex-col h-full relative animate-in slide-in-from-right duration-300 transition-colors pb-32", activeTheme.bg)}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Lateef&display=swap');
                    .quran-text { line-height: 2.5; }
                    .ayah-end-symbol { 
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 36 36' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M18 0L20.5 10.5L30.5 13L20.5 15.5L18 26L15.5 15.5L5.5 13L15.5 10.5L18 0Z' fill='%23D4AF37' opacity='0.2'/%3E%3Ccircle cx='18' cy='18' r='14' stroke='%23D4AF37' stroke-width='2'/%3E%3C/svg%3E");
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                        width: 45px;
                        height: 45px;
                        margin: 0 5px;
                        vertical-align: middle;
                        position: relative;
                    }
                    .ayah-end-symbol::before {
                        content: attr(data-number);
                        font-family: 'Lateef', serif; 
                        font-size: 1.2em; 
                        color: inherit; 
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                    }
                `}</style>

                {/* Header */}
                <div className={cn("px-4 py-3 backdrop-blur-md border-b sticky top-0 z-20 flex items-center justify-between shadow-sm transition-colors",
                    theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-stone-200'
                )}>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setReadingSurah(null)} className={cn("p-2 -ml-2 rounded-full", theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-stone-600 hover:bg-stone-100')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className={cn("text-lg font-bold", activeTheme.text)}>{readingSurah.name_simple}</h1>
                            <p className={cn("text-xs opacity-70", activeTheme.text)}>
                                {activeMode === 'tafsiir' ? 'Tafsiir (Somali)' : selectedReciter.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn("p-2 rounded-full transition-colors", theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-stone-600 hover:bg-stone-100')}
                        >
                            <Type size={20} />
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="absolute top-[65px] right-4 left-4 z-30 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 animate-in slide-in-from-top-2">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Theme</label>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    {Object.entries(THEMES).map(([key, t]) => (
                                        <button
                                            key={key}
                                            onClick={() => setTheme(key)}
                                            className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                                theme === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                                            )}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Text Size</label>
                                <div className="flex items-center space-x-4 bg-gray-100 p-2 rounded-xl">
                                    <button onClick={() => setFontSize(Math.max(20, fontSize - 4))} className="p-2 hover:bg-white rounded-lg transition-colors"><Type size={16} /></button>
                                    <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${((fontSize - 20) / 40) * 100}%` }}></div>
                                    </div>
                                    <button onClick={() => setFontSize(Math.min(60, fontSize + 4))} className="p-2 hover:bg-white rounded-lg transition-colors"><Type size={24} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {showSettings && <div className="absolute inset-0 z-20 bg-black/5" onClick={() => setShowSettings(false)}></div>}

                {/* Content - Mushaf Mode Container */}
                <div className="flex-1 overflow-y-auto" style={pageStyle}>
                    <div className={cn("min-h-full p-4 md:p-8 flex flex-col items-center", activeTheme.text)}>
                        <div className={cn("w-full max-w-3xl border-2 rounded-[2px] p-1 shadow-sm", theme === 'dark' ? 'border-gray-700' : 'border-[#d4af37]/30')}>
                            <div className={cn("w-full h-full border rounded-[1px] p-6 mobile:p-4 min-h-[80vh]", theme === 'dark' ? 'border-gray-800' : 'border-[#d4af37]/20')}>
                                <div className="text-center py-6 mb-8 border-b border-[#d4af37]/20 relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]/50 hidden sm:block"></span>
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]/50 hidden sm:block"></span>
                                    <div className="block font-amiri text-3xl sm:text-4xl" style={{ fontFamily: 'Amiri, serif' }}>
                                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                    </div>
                                </div>
                                {loadingText ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="animate-spin text-[#d4af37]" size={32} />
                                    </div>
                                ) : (
                                    <div className="quran-text text-right" dir="rtl" style={{ textAlign: 'justify', textAlignLast: 'center' }}>
                                        {ayahs.map((ayah, i) => (
                                            <div key={ayah.number} className="mb-6 border-b border-dashed border-gray-200 pb-2 last:border-none">
                                                <div className="mb-3">
                                                    <span
                                                        className={cn("inline transition-colors hover:text-[#d4af37] cursor-pointer leading-[2.5]", activeTheme.text)}
                                                        style={{ fontFamily: 'Amiri, serif', fontSize: `${fontSize}px` }}
                                                    >
                                                        {ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', '')}
                                                    </span>
                                                    <span className="ayah-end-symbol text-[#d4af37] mx-2 select-none" data-number={Number(ayah.numberInSurah).toLocaleString('ar-EG')} style={{ fontSize: `${Math.max(12, fontSize * 0.45)}px` }}>
                                                    </span>
                                                </div>
                                                {/* Only show translation if we have text AND we are in Tafsiir mode OR just broadly if translation exists (since only fetched in tafsiir) */}
                                                {ayah.translation && (
                                                    <div
                                                        className={cn("text-center text-sm sm:text-base font-medium px-4 leading-relaxed font-sans",
                                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                        )}
                                                        dir="ltr"
                                                        dangerouslySetInnerHTML={{ __html: ayah.translation }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Global Player in Reader View */}
                <FloatingPlayer />
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="flex flex-col h-full bg-white relative pb-32">
            {/* Header Area (App Style) */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 pb-6 px-6 pt-6 rounded-b-[2.5rem] sticky top-0 z-20 shadow-xl mb-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => navigate(-1)} className="p-2.5 -ml-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all active:scale-95">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-white tracking-tight">Quran Kareem</h1>
                            <p className="text-xs text-emerald-100 font-bold uppercase tracking-wide opacity-80">Beco Islamic</p>
                        </div>
                    </div>
                    {/* Only show Reciter Button in Audio Mode */}
                    {(activeMode === 'audio' || isPlaying) && (
                        <button
                            onClick={() => setShowReciters(!showReciters)}
                            className="flex items-center space-x-2 bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-bold border border-white/20 active:scale-95 transition-all backdrop-blur-md hover:bg-white/20"
                        >
                            <Mic2 size={14} />
                            <span>{selectedReciter.name.split(' ')[0]}</span>
                        </button>
                    )}
                </div>

                {/* SEARCH BAR */}
                <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search Surah..."
                        className="w-full pl-11 pr-4 py-3.5 bg-white text-gray-900 rounded-2xl shadow-lg border-none focus:ring-4 focus:ring-emerald-900/10 transition-all font-bold placeholder:font-medium placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveMode('tafsiir')}
                        className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeMode === 'tafsiir' ? "bg-white text-violet-600 shadow-md transform scale-[1.02]" : "text-white/70 hover:text-white"
                        )}
                    >
                        Tafsiir
                    </button>
                    <button
                        onClick={() => setActiveMode('audio')}
                        className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeMode === 'audio' ? "bg-white text-emerald-600 shadow-md transform scale-[1.02]" : "text-white/70 hover:text-white"
                        )}
                    >
                        Dhageysi
                    </button>
                    <button
                        onClick={() => setActiveMode('read')}
                        className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeMode === 'read' ? "bg-white text-teal-600 shadow-md transform scale-[1.02]" : "text-white/70 hover:text-white"
                        )}
                    >
                        Aqriso
                    </button>
                </div>
            </div>

            {showReciters && (
                <div className="absolute top-[145px] right-4 left-4 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-in slide-in-from-top-4 fade-in">
                    <div className="grid grid-cols-1 gap-1">
                        {RECITERS.map(r => (
                            <button
                                key={r.id}
                                onClick={() => changeReciter(r)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl text-left transition-colors",
                                    selectedReciter.id === r.id ? "bg-emerald-50 text-emerald-700" : "hover:bg-gray-50 text-gray-700"
                                )}
                            >
                                <span className="font-bold text-sm">{r.name}</span>
                                {selectedReciter.id === r.id && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {showReciters && <div className="absolute inset-0 z-20 bg-black/20" onClick={() => setShowReciters(false)}></div>}

            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32">
                {loading ? (
                    <div className="flex justify-center pt-20">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                ) : (
                    filteredSurahs.map((surah) => (
                        <div
                            key={surah.id}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border",
                                currentSurah?.id === surah.id
                                    ? "bg-emerald-50 border-emerald-100 shadow-sm"
                                    : "bg-white border-transparent hover:bg-gray-50"
                            )}
                            onClick={() => handleRxClick(surah)}
                        >
                            <div className="flex items-center space-x-4 flex-1">
                                <div className={cn(
                                    "h-10 w-10 min-w-[2.5rem] rounded-full flex items-center justify-center text-sm font-bold border-2",
                                    currentSurah?.id === surah.id
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "bg-gray-50 border-gray-100 text-gray-100" // Use lighter text in inactive state
                                )}>
                                    {surah.id}
                                </div>
                                <div>
                                    <h3 className={cn("font-bold text-sm sm:text-base", currentSurah?.id === surah.id ? "text-emerald-700" : "text-gray-900")}>
                                        {surah.name_simple}
                                    </h3>
                                    <p className="text-xs text-gray-400">{surah.verses_count} Verses</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                {activeMode === 'audio' ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playSurah(surah); }}
                                        className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                    >
                                        <Play size={14} className="fill-current ml-0.5" />
                                    </button>
                                ) : (
                                    // Icon for both Read and Tafsiir modes to signify "Open"
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openReader(surah); }}
                                        className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 active:scale-95 transition-all text-xs font-bold flex items-center"
                                    >
                                        <BookOpen size={14} className="mr-1.5" />
                                        {activeMode === 'tafsiir' ? 'View' : 'Read'}
                                    </button>
                                )}
                                <span className="font-amiri text-xl text-gray-400 leading-none hidden sm:block" style={{ fontFamily: 'serif' }}>
                                    {surah.name_arabic}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Global Player in List View */}
            <FloatingPlayer />
        </div>
    );
}
