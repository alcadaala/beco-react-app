import React from 'react';

export function ToDo() {
    const columns = [
        {
            id: 'todo',
            title: 'To Do',
            color: 'bg-gray-100',
            items: ['Design UI', 'Research API']
        },
        {
            id: 'in-progress',
            title: 'In Progress',
            color: 'bg-blue-50',
            items: ['Build Components']
        },
        {
            id: 'done',
            title: 'Done',
            color: 'bg-green-50',
            items: ['Setup Project']
        }
    ];

    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            <header className="pt-2">
                <h1 className="text-2xl font-bold text-gray-900">Kanban Board 📋</h1>
                <p className="text-gray-500 text-sm">Maamul mashruucaaga.</p>
            </header>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex space-x-4 h-full min-w-[700px]"> {/* Min width to invoke scroll on mobile */}
                    {columns.map((col) => (
                        <div key={col.id} className={`${col.color} w-64 rounded-2xl p-4 flex flex-col h-full max-h-[500px]`}>
                            <h3 className="font-bold text-gray-700 mb-3">{col.title} ({col.items.length})</h3>
                            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                {col.items.map((item, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-sm font-medium text-gray-800">
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <button className="mt-3 w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-black/5 rounded-lg transition-colors">
                                + Add Card
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
