import { LayoutDashboard, Users, AlertCircle, Grid } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { memo } from 'react';

const navItems = [
    { path: '/supervisor/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/supervisor/team', icon: Users, label: 'Team' },
    { path: '/supervisor/tasks', icon: AlertCircle, label: 'Tasks' },
    { path: '/supervisor/services', icon: Grid, label: 'More' },
];

export const SupervisorBottomNav = memo(function SupervisorBottomNav() {
    return (
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 z-50 pb-safe">
            <div className="flex justify-between items-center h-[5.5rem] px-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "relative flex items-center justify-center h-12 rounded-full transition-all duration-300",
                                isActive
                                    ? "bg-[#E31B23] text-white flex-[2] px-4 shadow-lg"
                                    : "text-gray-400 bg-transparent flex-1 hover:bg-gray-50"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <div className="flex items-center space-x-2 overflow-hidden whitespace-nowrap">
                                <item.icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className="flex-shrink-0"
                                />
                                {isActive && (
                                    <span className="text-xs font-bold tracking-wide animate-in slide-in-from-right-2 fade-in duration-300">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
});
