import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus } from 'lucide-react';

export function Tasks() {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Wac Faarax Cali', completed: false },
        { id: 2, text: 'Diyaari warbixinta bisha', completed: true },
        { id: 3, text: 'Cusbooneysii diiwaanka', completed: false },
    ]);

    const toggleTask = (id) => {
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    return (
        <div className="p-6 space-y-6">
            <header className="pt-2 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tasks ✅</h1>
                    <p className="text-gray-500 text-sm">Hawlahaaga maanta.</p>
                </div>
                <button className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-6 h-6" />
                </button>
            </header>

            <div className="space-y-3">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-4 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${task.completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-sm hover:border-blue-200'
                            }`}
                    >
                        {task.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                        ) : (
                            <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {task.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
