import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export function MetricCard({ title, value, change, changeType, icon: Icon, gradient }) {
    return (
        <div className={`p-6 rounded-2xl shadow-lg relative overflow-hidden ${gradient} text-white`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Icon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full border border-white/10 ${changeType === 'increase' ? 'bg-white/20 text-white' : 'bg-red-500/20 text-white'
                        }`}>
                        {changeType === 'increase' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {change}
                    </div>
                </div>

                <p className="text-sm font-medium text-blue-50 opacity-90">{title}</p>
                <h3 className="text-3xl font-bold mt-1 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
