import React from 'react';
import { useLocation } from 'react-router-dom';
import { User, Bell, Calendar } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  // Format pathname into page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/products')) return 'Product Inventory';
    if (path.startsWith('/customers')) return 'Customer Directory';
    if (path.startsWith('/orders')) return 'Order Registry';
    return 'Management System';
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{getPageTitle()}</h2>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-6">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{getTodayDate()}</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">Administrator</p>
            <p className="text-xs text-slate-400">admin@inventorysys.com</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-bold">
            A
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
