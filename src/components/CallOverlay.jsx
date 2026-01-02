import { Phone, X } from 'lucide-react';
import { useEffect } from 'react';

export function CallOverlay({ name, number, onClose }) {
    useEffect(() => {
        // Simulate connection or auto-close if needed
        const timer = setTimeout(() => {
            // In a real app, this might just stay until the user ends it or the system dialer takes over
            window.location.href = `tel:${number}`;
            onClose();
        }, 1500);
        return () => clearTimeout(timer);
    }, [number, onClose]);

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-200">
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full">
                <div className="relative">
                    <div className="h-32 w-32 bg-blue-500 rounded-full flex items-center justify-center z-10 relative shadow-2xl shadow-blue-500/50">
                        <Phone size={48} className="fill-white" />
                    </div>
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse-ring" />
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse-ring delay-500" />
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold">{name}</h2>
                    <p className="text-xl text-blue-200 font-medium tracking-wider">{number}</p>
                    <p className="text-sm text-gray-400 animate-pulse">Calling...</p>
                </div>
            </div>

            <button
                onClick={onClose}
                className="bg-red-500/20 text-red-100 p-4 rounded-full border border-red-500/50 hover:bg-red-500 hover:text-white transition-all"
            >
                <X size={24} />
            </button>
        </div>
    );
}
