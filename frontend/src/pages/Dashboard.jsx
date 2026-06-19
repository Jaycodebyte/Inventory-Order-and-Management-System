import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ShoppingCart, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { dashboardApi } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      setStats(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard metrics. Please check if your API server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Gathering workspace statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="w-10 h-10" />
        <div>
          <h3 className="font-bold text-lg">Failed to Load Metrics</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-sm transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Products',
      value: stats?.total_products ?? 0,
      color: 'from-blue-500 to-indigo-600',
      icon: Package,
      link: '/products',
    },
    {
      title: 'Total Customers',
      value: stats?.total_customers ?? 0,
      color: 'from-emerald-500 to-teal-600',
      icon: Users,
      link: '/customers',
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders ?? 0,
      color: 'from-violet-500 to-purple-600',
      icon: ShoppingCart,
      link: '/orders',
    },
    {
      title: 'Low Stock Items',
      value: stats?.low_stock_count ?? 0,
      color: (stats?.low_stock_count ?? 0) > 0 ? 'from-amber-500 to-orange-600' : 'from-slate-500 to-slate-600',
      icon: AlertTriangle,
      link: '#low-stock',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-all duration-200 flex flex-col justify-between h-40 group relative overflow-hidden"
            >
              {/* Decorative background circle */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-slate-50 opacity-50 group-hover:scale-110 transition-transform" />

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              {card.link.startsWith('#') ? (
                <div className="text-xs font-semibold text-slate-400 mt-4 flex items-center gap-1.5 cursor-default">
                  Needs attention
                </div>
              ) : (
                <Link
                  to={card.link}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 mt-4 flex items-center gap-1.5 transition"
                >
                  Manage items <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Low Stock Alerts Section */}
      <div id="low-stock" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm scroll-mt-20">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Critical Inventory Warnings</h3>
              <p className="text-xs text-slate-400">Products with stock quantities below threshold of 10 items</p>
            </div>
          </div>
          {stats?.low_stock_count > 0 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
              {stats.low_stock_count} Warnings
            </span>
          )}
        </div>

        {(stats?.low_stock_products?.length ?? 0) === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800">All Stocks Healthy</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Every item has sufficient inventory. No restocks are currently required.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase bg-slate-50/50">
                  <th className="py-3.5 px-4 rounded-l-xl">Product Name</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4 text-center">Available Stock</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {(stats?.low_stock_products ?? []).map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-slate-800">{product.name}</td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-500 uppercase">{product.sku}</td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{'\u20B9'}{parseFloat(product.price || 0).toFixed(2)}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border
                        ${
                          product.quantity_in_stock <= 3
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }
                      `}>
                        {product.quantity_in_stock} units
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/products?edit=${product.id}`}
                        className="px-3.5 py-1.5 border border-slate-200 hover:border-brand-500 text-slate-600 hover:text-brand-600 font-semibold text-xs rounded-lg transition inline-block bg-white"
                      >
                        Adjust Stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
