import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Package, Plus, Search, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { productsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
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
  
  // Sort states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Confirm Delete dialog
  const [productToDelete, setProductToDelete] = useState(null);

  const toast = useToast();
  
  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const res = await productsApi.getAll(search, skip, limit, sortBy, sortOrder);
      
      const data = res.data;
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      price: '',
      quantity_in_stock: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      price: parseFloat(product.price),
      quantity_in_stock: product.quantity_in_stock
    });
    setIsModalOpen(true);
  };

  // Handle URL edit param (?edit=123) for dashboard navigation shortcut
  const editHandledRef = useRef(null);
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || editHandledRef.current === editId) return;
    if (products.length === 0) return;

    editHandledRef.current = editId;
    const prod = products.find(p => p.id === parseInt(editId));
    if (prod) {
      handleOpenEdit(prod);
    } else {
      productsApi.getById(parseInt(editId))
        .then(res => handleOpenEdit(res.data))
        .catch(() => toast.error('Could not find requested product to edit.'));
    }
    // Clean query params so it doesn't reopen on reload
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, products]);

  const onSubmitForm = async (data) => {
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
        toast.success(`Product '${data.name}' updated successfully.`);
      } else {
        await productsApi.create(data);
        toast.success(`Product '${data.name}' created successfully.`);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to save product.';
      toast.error(errMsg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await productsApi.delete(productToDelete.id);
      toast.success(`Product '${productToDelete.name}' deleted successfully.`);
      setProductToDelete(null);
      loadProducts();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to delete product.';
      toast.error(errMsg);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort state is now handled by the backend API
  const sortedProducts = products;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
          />
        </div>

        {/* Add Product trigger button */}
        <button
          onClick={handleOpenAdd}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shrink-0 shadow-md shadow-brand-600/10"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Product
        </button>
      </div>

      {/* Products Table Wrapper */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
        {/* Slim loading progress bar at the top of the table card */}
        {loading && products.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-100 overflow-hidden z-10">
            <div className="h-full bg-brand-600 animate-shimmer w-1/3 rounded-full"></div>
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading catalog...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800">No products found</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              {search ? "No products matched your search query." : "Start building your catalogue by adding your first product."}
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-semibold uppercase">
                  <th 
                    className="py-3.5 px-6 cursor-pointer hover:bg-slate-100/50 transition rounded-l-2xl select-none"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1.5">
                      Product Name <ArrowUpDown className="w-3.5 h-3.5" />
                    </span>
                  </th>
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/50 transition select-none"
                    onClick={() => handleSort('sku')}
                  >
                    <span className="flex items-center gap-1.5">
                      SKU <ArrowUpDown className="w-3.5 h-3.5" />
                    </span>
                  </th>
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/50 transition select-none"
                    onClick={() => handleSort('price')}
                  >
                    <span className="flex items-center gap-1.5">
                      Price <ArrowUpDown className="w-3.5 h-3.5" />
                    </span>
                  </th>
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/50 transition text-center select-none"
                    onClick={() => handleSort('quantity_in_stock')}
                  >
                    <span className="flex items-center gap-1.5 justify-center">
                      Stock Level <ArrowUpDown className="w-3.5 h-3.5" />
                    </span>
                  </th>
                  <th className="py-3.5 px-6 text-right rounded-r-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-bold text-slate-800">{product.name}</td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-500 uppercase">{product.sku}</td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{'\u20B9'}{parseFloat(product.price).toFixed(2)}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex border
                        ${
                          product.quantity_in_stock === 0
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : product.quantity_in_stock < 10
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }
                      `}>
                        {product.quantity_in_stock === 0 ? 'Out of Stock' : `${product.quantity_in_stock} units`}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 hover:bg-brand-50 hover:text-brand-600 border border-slate-100 hover:border-brand-100 rounded-lg text-slate-500 transition inline-flex items-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProductToDelete(product)}
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
        {!loading && sortedProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400 font-medium">
              Showing page {page} ({sortedProducts.length} items)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={products.length < limit}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product Name</label>
            <input
              type="text"
              {...register('name', { required: 'Product name is required.' })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
              placeholder="e.g. Logitech Wireless Mouse"
            />
            {errors.name && (
              <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">SKU (Unique Part Code)</label>
            <input
              type="text"
              {...register('sku', { required: 'Unique SKU is required.' })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium font-mono uppercase"
              placeholder="e.g. KEY-MECH-BR"
              disabled={!!editingProduct}
            />
            {errors.sku && (
              <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.sku.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Price (₹ INR)</label>
              <input
                type="number"
                step="0.01"
                {...register('price', {
                  required: 'Price is required.',
                  min: { value: 0.01, message: 'Price must be positive.' }
                })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stock Quantity</label>
              <input
                type="number"
                {...register('quantity_in_stock', {
                  required: 'Quantity in stock is required.',
                  min: { value: 0, message: 'Quantity cannot be negative.' }
                })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
                placeholder="0"
              />
              {errors.quantity_in_stock && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.quantity_in_stock.message}
                </p>
              )}
            </div>
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
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deletion overlay */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={productToDelete ? `Are you sure you want to delete '${productToDelete.name}'? This action is permanent and cannot be undone.` : ''}
        confirmText="Delete Product"
      />
    </div>
  );
};

export default Products;
