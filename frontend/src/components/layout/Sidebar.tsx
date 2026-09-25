import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  CheckSquare,
  FileText,
  Activity,
  Zap,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Inspections',
      path: '/inspections',
      icon: ClipboardList,
    },
    {
      label: 'New Inspection',
      path: '/inspections/new',
      icon: PlusCircle,
    },
    {
      label: 'Human Verification',
      path: '/verification',
      icon: CheckSquare,
      badge: '2 Pending',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      label: 'Certificates & Reports',
      path: '/reports/insp_101',
      icon: FileText,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="text-gray-950 font-black text-base">Q</span>
            </div>
            <div>
              <span className="text-[1.3rem] font-bold tracking-tight text-white flex items-center gap">
                Onion<span className="text-amber-400">Q</span>
              </span>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                AI Quality & Grading System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer — Hardware / AI Model Status */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/40">
          <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Model Inference
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" /> 98.4 ms
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
