import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Eye, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { ordersApi, customersApi, productsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const limit = 20;
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Modal controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Form state for new order
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1, maxStock: 0, price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const res = await ordersApi.getAll(skip, limit);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Load dropdown catalogs when modal opens
  const handleOpenCreate = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customersApi.getAll('', 0, 100),
        productsApi.getAll('', 0, 100)
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
      
      // Reset form states
      setOrderCustomer('');
      setOrderItems([{ product_id: '', quantity: 1, maxStock: 0, price: 0 }]);
      setIsCreateOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to initialize catalog lists.');
    }
  };

  const handleProductSelect = (index, product_id) => {
    const selectedProd = products.find(p => p.id === parseInt(product_id));
    const updated = [...orderItems];
    if (selectedProd) {
      const currentQty = parseInt(updated[index].quantity) || 1;
      updated[index] = {
        ...updated[index],
        product_id: selectedProd.id,
        maxStock: selectedProd.quantity_in_stock,
        price: parseFloat(selectedProd.price),
        quantity: Math.min(currentQty, selectedProd.quantity_in_stock || 1)
      };
    } else {
      updated[index] = { product_id: '', quantity: 1, maxStock: 0, price: 0 };
    }
    setOrderItems(updated);
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], quantity: qty === '' ? '' : qty };
    setOrderItems(updated);
  };

  const handleQtyBlur = (index) => {
    const updated = [...orderItems];
    const raw = updated[index].quantity;
    const numericQty = parseInt(raw);
    updated[index] = { ...updated[index], quantity: isNaN(numericQty) || numericQty < 1 ? 1 : numericQty };
    setOrderItems(updated);
  };

  const addOrderItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, maxStock: 0, price: 0 }]);
  };

  const removeOrderItemRow = (index) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated.length ? updated : [{ product_id: '', quantity: 1, maxStock: 0, price: 0 }]);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 0;
      return sum + (item.price * qty);
    }, 0);
  };

  const handleViewDetails = async (orderId) => {
    try {
      const res = await ordersApi.getById(orderId);
      setSelectedOrderDetails(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order invoice details.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      await ordersApi.delete(orderToDelete.id);
      toast.success('Order deleted successfully. Inventory stock levels restored.');
      setOrderToDelete(null);
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete order.');
    }
  };

  const onSubmitOrder = async (e) => {
    e.preventDefault();
    if (!orderCustomer) {
      toast.warning('Please select a customer.');
      return;
    }

    // Filter valid lines (items with a product selected)
    const validItems = orderItems.filter(item => item.product_id !== '');
    if (!validItems.length) {
      toast.warning('Please select at least one product.');
      return;
    }

    // Ensure all quantities are valid numbers >= 1
    for (const item of validItems) {
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty < 1) {
        toast.warning('Each item must have a quantity of at least 1.');
        return;
      }
    }

    // Check stock issues
    const stockErrors = validItems.filter(item => parseInt(item.quantity) > item.maxStock);
    if (stockErrors.length > 0) {
      toast.error('Cannot place order: Some items exceed available inventory stock.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customer_id: parseInt(orderCustomer),
        items: validItems.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity)
        }))
      };

      await ordersApi.create(payload);
      toast.success('Order placed successfully!');
      setIsCreateOpen(false);
      loadOrders();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to place order.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Purchase Records</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-md shadow-brand-600/10"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
        {/* Slim loading progress bar at the top of the table card */}
        {loading && orders.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-100 overflow-hidden z-10">
            <div className="h-full bg-brand-600 animate-shimmer w-1/3 rounded-full"></div>
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading orders database...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800">No orders placed</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Select products and customers to record your first checkout order transaction.
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-semibold uppercase">
                  <th className="py-3.5 px-6 rounded-l-2xl">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Order Items</th>
                  <th className="py-3.5 px-4">Total Price</th>
                  <th className="py-3.5 px-4">Placement Date</th>
                  <th className="py-3.5 px-6 text-right rounded-r-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map((order) => {
                  const itemsCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 font-bold text-slate-800">#ORD-{String(order.id).padStart(4, '0')}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {order.customer ? order.customer.full_name : 'Unknown Customer'}
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-medium">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800">{'\u20B9'}{parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-400">
                        {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleViewDetails(order.id)}
                          className="p-1.5 hover:bg-brand-50 hover:text-brand-600 border border-slate-100 hover:border-brand-100 rounded-lg text-slate-500 transition inline-flex items-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 hover:border-rose-100 rounded-lg text-slate-500 transition inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checkout Modal Form */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Checkout New Order"
      >
        <form onSubmit={onSubmitOrder} className="space-y-5">
          {/* Select Customer */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Customer Account</label>
            <select
              value={orderCustomer}
              onChange={(e) => setOrderCustomer(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm transition font-medium"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Items</label>
              <button
                type="button"
                onClick={addOrderItemRow}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item Row
              </button>
            </div>

            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {/* Select Product */}
                  <div className="flex-1 min-w-0">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg text-sm transition font-semibold"
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({'\u20B9'}{parseFloat(p.price).toFixed(2)})
                        </option>
                      ))}
                    </select>

                    {item.product_id && (
                      <div className="mt-1.5 flex items-center justify-between text-xs font-medium">
                        <span className={`px-1.5 py-0.5 rounded
                          ${item.maxStock === 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}
                        `}>
                          Available Stock: {item.maxStock}
                        </span>
                        {item.quantity !== '' && parseInt(item.quantity) === 0 && (
                          <span className="text-amber-600 font-bold flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" /> Min. 1 required
                          </span>
                        )}
                        {item.quantity !== '' && parseInt(item.quantity) > item.maxStock && (
                          <span className="text-rose-600 font-bold flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" /> Exceeds stock
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quantity input */}
                  <div className="w-20 shrink-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(index, e.target.value)}
                      onBlur={() => handleQtyBlur(index)}
                      disabled={!item.product_id}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg text-sm transition font-semibold text-center"
                    />
                  </div>

                  {/* Delete row */}
                  <button
                    type="button"
                    onClick={() => removeOrderItemRow(index)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bill summary footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Total</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{'\u20B9'}{calculateTotal().toFixed(2)}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-sm transition"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || orderItems.some(item => item.product_id && (parseInt(item.quantity) > item.maxStock || !item.quantity || parseInt(item.quantity) < 1))}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Order
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Invoice Details Modal */}
      <Modal
        isOpen={!!selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
        title="Order Invoice Details"
      >
        {selectedOrderDetails && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Order ID</p>
                <p className="text-lg font-extrabold text-slate-800">#ORD-{String(selectedOrderDetails.id).padStart(4, '0')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Checkout Date</p>
                <p className="text-sm font-semibold text-slate-600">
                  {new Date(selectedOrderDetails.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Profile</h4>
              <div className="p-3 border border-slate-100 rounded-xl">
                <p className="text-sm font-bold text-slate-800">{selectedOrderDetails.customer?.full_name ?? 'Unknown Customer'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedOrderDetails.customer?.email ?? 'N/A'}</p>
                {selectedOrderDetails.customer?.phone && (
                  <p className="text-xs text-slate-500 mt-0.5">{selectedOrderDetails.customer.phone}</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Products Summary</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(selectedOrderDetails.items || []).map((item) => {
                      const sub = parseFloat(item.unit_price) * item.quantity;
                      return (
                        <tr key={item.id} className="text-slate-700">
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-800">{item.product ? item.product.name : 'Unknown Product'}</p>
                            <p className="font-mono text-[10px] text-slate-400 uppercase mt-0.5">
                              {item.product ? item.product.sku : 'N/A'}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-center">{item.quantity}</td>
                          <td className="py-3 px-3 text-right">{'\u20B9'}{parseFloat(item.unit_price).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-800">{'\u20B9'}{sub.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals panel */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">Net Checkout Amount</span>
              <span className="text-2xl font-black text-brand-600">{'\u20B9'}{parseFloat(selectedOrderDetails.total_amount).toFixed(2)}</span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
              >
                Close Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Order Confirmation */}
      <ConfirmDialog
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Order History"
        message={orderToDelete ? `Are you sure you want to delete this order? Deleting will automatically return the stock quantity of all products back into active inventory levels.` : ''}
        confirmText="Delete and Restore Inventory"
      />
    </div>
  );
};

export default Orders;
