import { LineChart, Rss, CalendarCheck, BadgePercent, Lamp, AlignJustify, BarChart3 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { memo } from 'react';

const navItems = [
    { icon: LineChart, label: 'Dash', path: '/dashboard' },
    { icon: Rss, label: 'Baafiye', path: '/baafiye' },
    { icon: BarChart3, label: 'Analysis', path: '/billing' },
    { icon: BadgePercent, label: 'Disc', path: '/discounts' },
    { icon: Lamp, label: 'Tasks', path: '/tasks' },
    { icon: AlignJustify, label: 'More', path: '/services' },
];

export const BottomNav = memo(function BottomNav() {
    return (
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 z-50 pb-safe">
            <div className="flex justify-between items-center h-[5.5rem] px-4">
                {navItems.filter(item => {
                    const user = JSON.parse(localStorage.getItem('beco_current_user') || 'null');
                    if (user && user.role === 'Assistant') {
                        // Restricted View
                        return ['/dashboard', '/baafiye'].includes(item.path);
                    }
                    return true;
                }).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "relative flex items-center justify-center h-12 min-h-[44px] rounded-full transition-all duration-300",
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
        </nav >
    );
});
