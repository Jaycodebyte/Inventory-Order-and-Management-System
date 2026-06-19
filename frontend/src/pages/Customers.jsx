import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Plus, Search, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { customersApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input to avoid API flickering
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch]);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const res = await customersApi.getAll(search, skip, limit);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customer list.');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleOpenAdd = () => {
    reset({
      full_name: '',
      email: '',
      phone: ''
    });
    setIsModalOpen(true);
  };

  const onSubmitForm = async (data) => {
    try {
      await customersApi.create(data);
      toast.success(`Customer '${data.full_name}' added successfully.`);
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to save customer.';
      toast.error(errMsg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await customersApi.delete(customerToDelete.id);
      toast.success(`Customer '${customerToDelete.full_name}' deleted successfully.`);
      setCustomerToDelete(null);
      loadCustomers();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to delete customer.';
      toast.error(errMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
          />
        </div>

        {/* Add Customer Button */}
        <button
          onClick={handleOpenAdd}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shrink-0 shadow-md shadow-brand-600/10"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Customer
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
        {/* Slim loading progress bar at the top of the table card */}
        {loading && customers.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-100 overflow-hidden z-10">
            <div className="h-full bg-brand-600 animate-shimmer w-1/3 rounded-full"></div>
          </div>
        )}

        {loading && customers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading customer registry...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800">No customers found</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              {search ? "No customers matched your search query." : "Add customers to associate with your orders."}
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-semibold uppercase">
                  <th className="py-3.5 px-6 rounded-l-2xl">Full Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-6 text-right rounded-r-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-bold text-slate-800">{customer.full_name}</td>
                    <td className="py-4 px-4 font-medium text-slate-500">{customer.email}</td>
                    <td className="py-4 px-4 font-medium text-slate-500">{customer.phone || 'N/A'}</td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-400">
                      {new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setCustomerToDelete(customer)}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 hover:border-rose-100 rounded-lg text-slate-500 transition inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!loading && customers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400 font-medium">
              Showing page {page} ({customers.length} items)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                &larr;
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={customers.length < limit}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer Account"
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              {...register('full_name', { required: 'Full name is required.' })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
              placeholder="e.g. John Doe"
            />
            {errors.full_name && (
              <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email address is required.',
                pattern: {
                  value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                  message: 'Please enter a valid email syntax structure.'
                }
              })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
              placeholder="e.g. rahul@gmail.com"
            />
            {errors.email && (
              <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number (Optional)</label>
            <input
              type="text"
              {...register('phone')}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
              placeholder="e.g. +91-98765-43210"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl font-semibold text-sm transition flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirmation */}
      <ConfirmDialog
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Account"
        message={customerToDelete ? `Are you sure you want to delete the customer account for '${customerToDelete.full_name}'? This action is permanent and cannot be undone.` : ''}
        confirmText="Delete Customer"
      />
    </div>
  );
};

export default Customers;
