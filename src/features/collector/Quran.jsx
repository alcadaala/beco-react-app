import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Search, Loader2, BookOpen, X, Volume2, Mic2, Check, Settings, Moon, Sun, Type, LucideTextCursorInput, Headphones } from 'lucide-react';
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
    const { mode } = location.state || { mode: 'audio' };

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
        if (mode === 'audio' && currentSurah?.id !== surah.id) {
            playSurah(surah);
        }

        // Fetch Arabic Text - Using Quran.com API V4 (Reliable)
        const fetchArabic = fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah.id}`);

        // Fetch Translation if Tafsiir Mode (ID 46 = Somali - Mahmud Abduh)
        const fetchTranslation = mode === 'tafsiir'
            ? fetch(`https://api.quran.com/api/v4/quran/translations/46?chapter_number=${surah.id}`)
            : Promise.resolve(null);

        Promise.all([fetchArabic, fetchTranslation])
        // ...
        // ...
        // COMPONENTS
        const FloatingPlayer = () => (
            currentSurah && (
                <div className="fixed bottom-8 left-6 right-6 z-50 animate-in slide-in-from-bottom duration-500">
                    <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-2 pl-4 pr-2 shadow-2xl shadow-black/50 flex items-center justify-between mx-auto max-w-lg">
                        <div className="flex items-center space-x-4 flex-1 overflow-hidden group cursor-pointer" onClick={() => !readingSurah && openReader(currentSurah)}>
                            <div className="relative h-11 w-11 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                {isPlaying && <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping opacity-75"></div>}
                                <Headphones size={18} className="text-emerald-400 relative z-10" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-white truncate text-sm leading-tight mb-0.5">{currentSurah.name_simple}</h3>
                                <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Now Playing</p>
                            </div>
                        </div>

                        <div className="flex items-center pl-2">
                            <button
                                onClick={togglePlay}
                                className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl hover:bg-emerald-50"
                            >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                            </button>
                        </div>
                    </div>
                </div>
            )
        );

        // READER VIEW
        if (readingSurah) {
            const activeTheme = THEMES[theme];

            // Islamic floral pattern or simple ornamental border style
            const pageStyle = {
                boxShadow: theme === 'light' || theme === 'sepia'
                    ? 'inset 0 0 50px rgba(0,0,0,0.02), 0 0 20px rgba(0,0,0,0.05)'
                    : 'none',
            };

            return (
                <div className={cn("flex flex-col h-full relative animate-in slide-in-from-right duration-300 transition-colors pb-32", activeTheme.bg)}>
                    {/* Font Injection */}
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
                                <p className={cn("text-xs opacity-70", activeTheme.text)}>{selectedReciter.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            {/* Settings Toggle */}
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
// ... existing settings content ...
                        </div>
                    )}

                    {/* Overlay for Settings */}
                    {showSettings && (
                        <div className="absolute inset-0 z-20 bg-black/5" onClick={() => setShowSettings(false)}></div>
                    )}


                    {/* Content - Mushaf Mode Container */}
                    <div className="flex-1 overflow-y-auto" style={pageStyle}>
                        <div className={cn("min-h-full p-4 md:p-8 flex flex-col items-center", activeTheme.text)}>
// ... existing content ...
                        </div>
                    </div>
                </div>
                </div >

        {/* Global Player in Reader View */ }
        < FloatingPlayer />
            </div >
        );
}

// LIST VIEW
return (
    <div className="flex flex-col h-full bg-white relative pb-32">
        {/* ... existing List View Header ... */}
// ...
        // ...
        <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32">
            {/* ... existing list map ... */}
                )}
        </div>

        {/* Global Player in List View */}
        <FloatingPlayer />
    </div>
);
}
