import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

export function Balan() {
    const appointments = [
        { id: 1, title: 'Balan Macaamiil', time: '10:00 AM', location: 'Xafiiska', date: 'Maanta' },
        { id: 2, title: 'Kulan Kooxda', time: '02:30 PM', location: 'Online', date: 'Berri' },
    ];

    return (
        <div className="p-6 space-y-6">
            <header className="pt-2">
                <h1 className="text-2xl font-bold text-gray-900">Balan 📅</h1>
                <p className="text-gray-500 text-sm">Jadwalkaaga iyo balamaha.</p>
            </header>

            <div className="space-y-4">
                {appointments.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{item.title}</h3>
                            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {item.time}</span>
                                <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {item.location}</span>
                            </div>
                            <div className="mt-2 inline-block bg-gray-100 px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-600">
                                {item.date}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
