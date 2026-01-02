import React, { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { RevenueChart } from '../components/RevenueChart';
import { Wallet, CheckCircle, Clock } from 'lucide-react';

export function Dashboard() {
    const [activeTab, setActiveTab] = useState('daily');

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <header className="flex justify-between items-start pt-2">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-0.5">Kusoo dhawaada,</p>
                    <h1 className="text-2xl font-bold text-gray-900">Axmed Cali 👋</h1>
                </div>
                <div className="relative">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-gray-200"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
            </header>

            {/* Time Filter */}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex w-full">
                {['daily', 'weekly', 'monthly'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === tab
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'daily' ? 'Maalin' : tab === 'weekly' ? 'Todobaad' : 'Bil'}
                    </button>
                ))}
            </div>

            {/* Metrics Grid */}
            <div className="space-y-4">
                <MetricCard
                    title="Wadarta Dayn"
                    value="$12,450"
                    change="+12%"
                    changeType="increase"
                    icon={Wallet}
                    gradient="bg-gradient-to-br from-blue-600 to-indigo-600"
                />
                <div className="grid grid-cols-2 gap-4">
                    <MetricCard
                        title="La Ururiyay"
                        value="$8,200"
                        change="+5%"
                        changeType="increase"
                        icon={CheckCircle}
                        gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    />
                    <MetricCard
                        title="Baaqi"
                        value="$4,250"
                        change="-2%"
                        changeType="decrease"
                        icon={Clock}
                        gradient="bg-gradient-to-br from-orange-400 to-red-500"
                    />
                </div>
            </div>

            {/* Chart Section */}
            <div className="pt-2 pb-6">
                <RevenueChart />
            </div>
        </div>
    );
}
