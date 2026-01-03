import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi } from 'lucide-react';

export default function DataBundles() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center space-x-4 sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center -ml-2 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-black text-gray-900">Data Bundles</h1>
            </div>

            {/* Coming Soon Card */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pb-24">
                <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-lg border border-white/10 animate-pulse">
                            <Wifi size={36} className="text-white drop-shadow-lg" />
                        </div>

                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-2 drop-shadow-md">Coming Soon</h2>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-90 max-w-[200px] mx-auto">
                                We are working hard to bring you the best data packages. Stay tuned!
                            </p>
                        </div>

                        <div className="h-1 w-16 bg-white/20 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
