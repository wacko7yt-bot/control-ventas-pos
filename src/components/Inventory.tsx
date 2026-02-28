import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Trash2, Edit, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock: number;
    category_name?: string;
}

export const Inventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: 0,
        cost: 0,
        stock: 0
    });

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Error al cargar productos');
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = editingProduct ?
            supabase.from('products').update(formData).eq('id', editingProduct.id) :
            supabase.from('products').insert([formData]);

        const { error } = await action;

        if (error) {
            toast.error('Error al guardar: ' + error.message);
        } else {
            toast.success(editingProduct ? 'Producto actualizado' : 'Producto añadido');
            setShowModal(false);
            setEditingProduct(null);
            setFormData({ name: '', sku: '', price: 0, cost: 0, stock: 0 });
            fetchProducts();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) toast.error('Error al eliminar');
            else {
                toast.success('Producto eliminado');
                fetchProducts();
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Inventario de Productos</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Control de stock y precios internos.</p>
                </div>
                <button className="btn-primary" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
                    <Plus size={20} /> Añadir Producto
                </button>
            </div>

            {/* Search & Stats */}
            <div className="glass" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0.75rem 0.75rem 0.75rem 2.5rem', color: 'white', outline: 'none' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Producto</th>
                            <th style={{ padding: '1rem' }}>SKU</th>
                            <th style={{ padding: '1rem' }}>Costo</th>
                            <th style={{ padding: '1rem' }}>Precio Venta</th>
                            <th style={{ padding: '1rem' }}>Stock</th>
                            <th style={{ padding: '1rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="transition-all hover:bg-white/[0.02]">
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{product.name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{product.sku || '-'}</td>
                                <td style={{ padding: '1rem' }}>${product.cost.toFixed(2)}</td>
                                <td style={{ padding: '1rem', color: 'var(--accent-lime)', fontWeight: 700 }}>${product.price.toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        background: product.stock < 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: product.stock < 5 ? '#f87171' : '#34d399',
                                        border: `1px solid ${product.stock < 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                                    }}>
                                        {product.stock} unidades
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => { setEditingProduct(product); setFormData(product); setShowModal(true); }} style={{ color: 'var(--accent-blue)', padding: '4px' }}><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(product.id)} style={{ color: '#ef4444', padding: '4px' }}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No se encontraron productos.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: '#18181b' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nombre del Producto</label>
                                <input required style={{ width: '100%', background: '#272727', border: '1px solid #3f3f46', borderRadius: '8px', padding: '0.75rem', color: 'white' }}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>SKU / Código</label>
                                    <input style={{ width: '100%', background: '#272727', border: '1px solid #3f3f46', borderRadius: '8px', padding: '0.75rem', color: 'white' }}
                                        value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Stock Inicial</label>
                                    <input type="number" required style={{ width: '100%', background: '#272727', border: '1px solid #3f3f46', borderRadius: '8px', padding: '0.75rem', color: 'white' }}
                                        value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Costo ($)</label>
                                    <input type="number" step="0.01" required style={{ width: '100%', background: '#272727', border: '1px solid #3f3f46', borderRadius: '8px', padding: '0.75rem', color: 'white' }}
                                        value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Precio Venta ($)</label>
                                    <input type="number" step="0.01" required style={{ width: '100%', background: '#272727', border: '1px solid #3f3f46', borderRadius: '8px', padding: '0.75rem', color: 'white' }}
                                        value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #3f3f46', color: 'white' }}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
