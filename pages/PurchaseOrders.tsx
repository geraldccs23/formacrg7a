import React, { useState, useEffect } from 'react';
import { 
    ClipboardList, Plus, Search, Filter, Loader2, ArrowRight, CheckCircle, 
    XCircle, Clock, Package, ShoppingCart, Truck, AlertCircle, Trash2, Edit,
    FileText
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { PurchaseOrder, PurchaseOrderLine, Product, Supplier } from '../types';

export function PurchaseOrders() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    // Form State
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Partial<PurchaseOrderLine>[]>([]);
    const [notes, setNotes] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [saving, setSaving] = useState(false);

    // Product Search
    const [productSearch, setProductSearch] = useState('');
    const [foundProducts, setFoundProducts] = useState<Product[]>([]);

    useEffect(() => {
        fetchOrders();
        fetchSuppliers();
        generateOrderNumber();
    }, []);

    const generateOrderNumber = async () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true });
        const seq = String((count || 0) + 1).padStart(4, '0');
        setOrderNumber(`OC-${year}${month}-${seq}`);
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            let query = supabase.from('purchase_orders').select(`
                *,
                items:purchase_order_lines(*),
                suppliers(supplier_name)
            `).order('created_at', { ascending: false });
            
            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter.toUpperCase());
            }

            const { data, error } = await query;
            if (error) throw error;

            // Map provider_name from the joined suppliers table
            const mappedOrders = (data || []).map(o => ({
                ...o,
                provider_name: (o.suppliers as any)?.supplier_name || 'Desconocido'
            }));

            setOrders(mappedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        const { data } = await supabase.from('suppliers').select('*').eq('is_active', true).order('supplier_name');
        if (data) setSuppliers(data);
    };

    const searchProducts = async (term: string) => {
        if (term.length < 2) {
            setFoundProducts([]);
            return;
        }
        const { data } = await supabase.from('products')
            .select('*')
            .or(`codigo_producto.ilike.%${term}%,descripcion.ilike.%${term}%`)
            .limit(10);
        if (data) setFoundProducts(data);
    };

    const addItem = (product: Product) => {
        const exists = items.find(i => i.codigo_producto === product.codigo_producto);
        if (exists) return;

        setItems([...items, {
            codigo_producto: product.codigo_producto,
            description: product.descripcion,
            cantidad_pedida: 1,
            cantidad_recibida: 0,
            precio_unitario_usd: product.precio_usd || 0,
            total_linea_usd: product.precio_usd || 0
        }]);
        setProductSearch('');
        setFoundProducts([]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof PurchaseOrderLine, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        
        if (field === 'cantidad_pedida' || field === 'precio_unitario_usd') {
            const qty = Number(newItems[index].cantidad_pedida) || 0;
            const price = Number(newItems[index].precio_unitario_usd) || 0;
            newItems[index].total_linea_usd = qty * price;
        }
        
        setItems(newItems);
    };

    const handleCreateOrder = async () => {
        if (!selectedSupplier || items.length === 0 || saving) return;
        setSaving(true);
        try {
            const totalAmount = items.reduce((sum, i) => sum + (i.total_linea_usd || 0), 0);
            
            const { data: order, error: oError } = await supabase.from('purchase_orders').insert([{
                numero_orden: orderNumber,
                supplier_code: selectedSupplier.supplier_code,
                status: 'PENDING',
                notes,
                total_amount_usd: totalAmount,
                sucursal: 'Boleita' // Default sucursal
            }]).select().single();

            if (oError) throw oError;

            const orderItems = items.map(i => ({
                order_id: order.id,
                codigo_producto: i.codigo_producto,
                description: i.description,
                cantidad_pedida: i.cantidad_pedida,
                cantidad_recibida: 0,
                precio_unitario_usd: i.precio_unitario_usd,
                total_linea_usd: i.total_linea_usd
            }));

            const { error: iError } = await supabase.from('purchase_order_lines').insert(orderItems);
            if (iError) throw iError;

            setIsCreateModalOpen(false);
            resetForm();
            fetchOrders();
            generateOrderNumber();
            alert(`Orden de Compra ${orderNumber} creada con éxito.`);
        } catch (error) {
            console.error(error);
            alert('Error al crear la orden. Puede que el número de orden ya exista.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setSelectedSupplier(null);
        setItems([]);
        setNotes('');
        setProductSearch('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'PARTIAL': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                        <ClipboardList className="text-[#D40000]" size={28} />
                        Ordenes de Compra
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Gestión y seguimiento de pedidos a proveedores.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#D40000] text-white rounded-2xl font-black shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all"
                >
                    <Plus size={20} />
                    NUEVA ORDEN
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por proveedor o ID..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-[#D40000] focus:bg-white rounded-xl transition-all outline-none font-bold text-gray-700"
                    />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                    {['ALL', 'PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED'].map(s => (
                        <button 
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${statusFilter === s ? 'bg-white text-[#D40000] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {s === 'ALL' ? 'TODAS' : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-[#D40000]" size={40} /></div>
                ) : orders.filter(o => 
                    o.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    o.numero_orden?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(order => (
                    <div 
                        key={order.id} 
                        onClick={() => { setSelectedOrder(order); setIsDetailModalOpen(true); }}
                        className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.numero_orden}</span>
                                <h3 className="font-black text-gray-800 line-clamp-1">{order.provider_name}</h3>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="text-gray-400 text-xs">
                                    <Clock size={12} className="inline mr-1" />
                                    {new Date(order.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Estimado</div>
                                    <div className="text-xl font-black text-[#D40000]">${Number(order.total_amount_usd).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 font-bold">
                            <span className="flex items-center gap-1"><Package size={14} /> {order.items?.length || 0} Items</span>
                            <span className="text-[#D40000] group-hover:translate-x-1 transition-transform flex items-center gap-1">Ver Detalles <ArrowRight size={14} /></span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Nueva Orden de Compra</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Nº: {orderNumber}</p>
                            </div>
                            <button onClick={() => { setIsCreateModalOpen(false); resetForm(); }} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><XCircle size={24} className="text-gray-400" /></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            {/* Step 1: Provider */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-black text-gray-700 transition-all outline-none"
                                        onChange={e => setSelectedSupplier(suppliers.find(s => s.supplier_code === e.target.value) || null)}
                                        value={selectedSupplier?.supplier_code || ''}
                                    >
                                        <option value="">-- Seleccionar Proveedor --</option>
                                        {suppliers.map(s => <option key={s.supplier_code} value={s.supplier_code}>{s.supplier_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas / Observaciones</label>
                                    <input 
                                        type="text" 
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Ej: Pedido urgente de sensores"
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-black text-gray-700 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Step 2: Items */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-black text-gray-800 uppercase text-sm tracking-widest">Productos del Pedido</h4>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar producto a agregar..." 
                                            value={productSearch}
                                            onChange={e => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#D40000]/20"
                                        />
                                        {foundProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 bg-white shadow-2xl border rounded-xl mt-2 z-50 overflow-hidden">
                                                {foundProducts.map(p => (
                                                    <button 
                                                        key={p.codigo_producto}
                                                        onClick={() => addItem(p)}
                                                        className="w-full text-left p-3 hover:bg-red-50 border-b last:border-0 transition-colors flex flex-col"
                                                    >
                                                        <span className="font-black text-gray-800 text-xs">{p.codigo_producto}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium line-clamp-1">{p.descripcion}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-100 text-gray-400 font-black uppercase tracking-widest">
                                            <tr>
                                                <th className="px-4 py-3">Producto</th>
                                                <th className="px-4 py-3 text-center">Cant.</th>
                                                <th className="px-4 py-3 text-right">Costo Unit $</th>
                                                <th className="px-4 py-3 text-right">Subtotal $</th>
                                                <th className="px-4 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-white transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-black text-gray-800 uppercase">{item.codigo_producto}</div>
                                                        <div className="text-[10px] text-gray-500 font-medium line-clamp-1">{item.description}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            type="number" 
                                                            value={item.cantidad_pedida} 
                                                            onChange={e => updateItem(idx, 'cantidad_pedida', e.target.value)}
                                                            className="w-20 px-2 py-1 bg-white border rounded-lg text-center font-black outline-none focus:ring-2 focus:ring-[#D40000]/20"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            type="number" 
                                                            step="0.01"
                                                            value={item.precio_unitario_usd} 
                                                            onChange={e => updateItem(idx, 'precio_unitario_usd', e.target.value)}
                                                            className="w-24 px-2 py-1 bg-white border rounded-lg text-right font-black outline-none focus:ring-2 focus:ring-[#D40000]/20"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-gray-800">
                                                        ${Number(item.total_linea_usd).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-red-500">
                                                        <button onClick={() => removeItem(idx)} className="p-1 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {items.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400 font-bold uppercase tracking-widest italic">
                                                        No hay productos agregados a la orden.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                            <div className="text-right">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Orden</div>
                                <div className="text-2xl font-black text-[#D40000]">
                                    ${items.reduce((sum, i) => sum + (i.total_linea_usd || 0), 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setIsCreateModalOpen(false); resetForm(); }} className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition-all">CANCELAR</button>
                                <button 
                                    onClick={handleCreateOrder}
                                    disabled={!selectedSupplier || items.length === 0 || saving}
                                    className="px-8 py-3 bg-[#D40000] text-white rounded-2xl font-black shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'CREANDO...' : 'CREAR ORDEN DE COMPRA'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail/Process Modal */}
            {isDetailModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Orden: {selectedOrder.numero_orden}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{selectedOrder.provider_name}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><XCircle size={24} className="text-gray-400" /></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* Summary info */}
                            <div className="flex flex-wrap gap-4 mb-8">
                                <div className="flex-1 min-w-[150px] p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Estado</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                                </div>
                                <div className="flex-1 min-w-[150px] p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Orden</span>
                                    <span className="text-xl font-black text-[#D40000]">${Number(selectedOrder.total_amount_usd).toLocaleString()}</span>
                                </div>
                                <div className="flex-1 min-w-[150px] p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sucursal</span>
                                    <span className="text-sm font-black text-gray-800 uppercase">{selectedOrder.sucursal}</span>
                                </div>
                                <div className="flex-1 min-w-[150px] p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fecha</span>
                                    <span className="text-sm font-black text-gray-800 font-mono">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <h4 className="font-black text-gray-800 uppercase text-xs tracking-[0.2em] mb-4">Productos en la Orden</h4>
                            <div className="border rounded-2xl overflow-hidden bg-gray-50">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-white text-gray-400 font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Producto</th>
                                            <th className="px-6 py-4 text-center">Pedida</th>
                                            <th className="px-6 py-4 text-center">Recibida</th>
                                            <th className="px-6 py-4 text-right">Precio Unit.</th>
                                            <th className="px-6 py-4 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedOrder.items?.map(item => (
                                            <tr key={item.id} className="hover:bg-white transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-gray-800 uppercase">{item.codigo_producto}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium line-clamp-1">{item.description}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-gray-800">{item.cantidad_pedida}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-black ${item.cantidad_recibida >= item.cantidad_pedida ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {item.cantidad_recibida}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-gray-800">${Number(item.precio_unitario_usd).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-black text-gray-800">${Number(item.total_linea_usd).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-white flex justify-between gap-4">
                            <div className="flex gap-2">
                                <button className="px-6 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-black text-xs hover:bg-gray-200 transition-all uppercase tracking-widest">Imprimir</button>
                                <button className="px-6 py-2.5 bg-gray-100 text-red-500 rounded-xl font-black text-xs hover:bg-red-50 transition-all uppercase tracking-widest">Anular Orden</button>
                            </div>
                            <button className="px-8 py-3 bg-[#D40000] text-white rounded-2xl font-black shadow-lg shadow-red-500/10 hover:-translate-y-0.5 transition-all uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle size={18} /> Procesar Recepción
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
