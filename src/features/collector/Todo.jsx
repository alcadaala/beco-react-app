export default function Todo() {
    const columns = [
        { id: 'todo', title: 'To Do', color: 'bg-gray-100', tasks: ['Call 10 Zone A', 'Visit Manager'] },
        { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50', tasks: ['Resolving SQN 105'] },
        { id: 'done', title: 'Done', color: 'bg-green-50', tasks: ['Submit Report'] },
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900">My Board</h1>
            </div>

            <div className="flex-1 overflow-x-auto p-4 flex space-x-4 pb-24">
                {columns.map(col => (
                    <div key={col.id} className="min-w-[280px] w-[80vw] md:w-64 bg-gray-50 rounded-2xl p-4 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-700">{col.title}</h3>
                            <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-400 font-bold border border-gray-100">{col.tasks.length}</span>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {col.tasks.map((task, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-sm font-medium text-gray-700 active:scale-95 transition-transform cursor-grab">
                                    {task}
                                </div>
                            ))}
                            <button className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-bold hover:border-gray-300 hover:text-gray-500 transition-colors">
                                + Add Task
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
