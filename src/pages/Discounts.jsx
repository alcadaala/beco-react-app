import React from 'react';
import { Tag, Percent } from 'lucide-react';

export function Discounts() {
    const offers = [
        { id: 1, title: 'Bisha Koowaad', discount: '50% OFF', color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
        { id: 2, title: 'Macaamiil Cusub', discount: '20% OFF', color: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
        { id: 3, title: 'Xirmo Sanadeed', discount: 'Badbaadi $100', color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
    ];

    return (
        <div className="p-6 space-y-6">
            <header className="pt-2">
                <h1 className="text-2xl font-bold text-gray-900">Discounts 🏷️</h1>
                <p className="text-gray-500 text-sm">Dalabyada iyo qiimo-dhimista.</p>
            </header>

            <div className="grid gap-4">
                {offers.map((offer) => (
                    <div key={offer.id} className={`${offer.color} p-5 rounded-2xl shadow-lg run-text-white relative overflow-hidden text-white`}>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium opacity-90 text-sm">{offer.title}</p>
                                    <h3 className="text-3xl font-extrabold mt-1">{offer.discount}</h3>
                                </div>
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    <Tag className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <button className="mt-4 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors shadow-sm">
                                Dalabo Hada
                            </button>
                        </div>
                        <Percent className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 z-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
