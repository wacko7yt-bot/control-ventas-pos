import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Trash2, Edit, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SizeVariant {
    size: string;
    stock: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    image_url: string;
    sizes: SizeVariant[];
}

export const Inventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        cost: 0,
        image_url: '',
        sizes: [] as SizeVariant[]
    });

    const [newSize, setNewSize] = useState({ size: '', stock: 0 });

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Error al cargar productos');
        } else {
            setProducts(data || []);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `product-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
            toast.success('Imagen subida correctamente');
        } catch (error: any) {
            toast.error('Error al subir imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAddSize = () => {
        if (!newSize.size) return;
        setFormData({
            ...formData,
            sizes: [...formData.sizes, { ...newSize }]
        });
        setNewSize({ size: '', stock: 0 });
    };

    const handleRemoveSize = (index: number) => {
        const newSizes = [...formData.sizes];
        newSizes.splice(index, 1);
        setFormData({ ...formData, sizes: newSizes });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: formData.name,
            price: formData.price,
            cost: formData.cost,
            image_url: formData.image_url,
            sizes: formData.sizes
        };

        const action = editingProduct ?
            supabase.from('products').update(payload).eq('id', editingProduct.id) :
            supabase.from('products').insert([payload]);

        const { error } = await action;

        if (error) {
            toast.error('Error al guardar: ' + error.message);
        } else {
            toast.success(editingProduct ? 'Producto actualizado' : 'Producto añadido');
            setShowModal(false);
            setEditingProduct(null);
            setFormData({ name: '', price: 0, cost: 0, image_url: '', sizes: [] });
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
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Inventario de Productos</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gestiona tallas, fotos y precios de tus prendas.</p>
                </div>
                <button className="btn-primary" onClick={() => {
                    setEditingProduct(null);
                    setFormData({ name: '', price: 0, cost: 0, image_url: '', sizes: [] });
                    setShowModal(true);
                }}>
                    <Plus size={20} /> Añadir Producto
                </button>
            </div>

            {/* Search */}
            <div className="glass" style={{ padding: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
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
                            <th style={{ padding: '1rem' }}>Foto</th>
                            <th style={{ padding: '1rem' }}>Producto</th>
                            <th style={{ padding: '1rem' }}>Tallas y Stock</th>
                            <th style={{ padding: '1rem' }}>Precio Venta</th>
                            <th style={{ padding: '1rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="transition-all hover:bg-white/[0.02]">
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ width: '50px', height: '50px', background: '#27272a', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {product.image_url ? <img src={product.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Upload size={16} color="#444" />}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{product.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {product.sizes?.map(s => (
                                            <span key={s.size} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                {s.size}: <b style={{ color: s.stock > 0 ? 'var(--accent-lime)' : '#ef4444' }}>{s.stock}</b>
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--accent-lime)', fontWeight: 700 }}>${product.price.toFixed(2)}</td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => { setEditingProduct(product); setFormData(product); setShowModal(true); }} style={{ color: 'var(--accent-blue)', padding: '4px' }}><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(product.id)} style={{ color: '#ef4444', padding: '4px' }}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', overflowY: 'auto' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '600px', padding: '2rem', background: '#121214', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontWeight: 800 }}>{editingProduct ? 'Editar Prenda' : 'Nueva Prenda'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ color: '#666' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Image Upload */}
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ width: '120px', height: '120px', background: '#1c1c1f', borderRadius: '16px', border: '2px dashed #2d2d30', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {formData.image_url ? (
                                        <img src={formData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#666' }}>
                                            <Upload size={24} style={{ marginBottom: '4px' }} />
                                            <p style={{ fontSize: '10px' }}>{uploading ? 'Subiendo...' : 'Subir Foto'}</p>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleFileUpload} accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nombre del Producto</label>
                                    <input required style={{ width: '100%', background: '#1c1c1f', border: '1px solid #2d2d30', borderRadius: '8px', padding: '0.75rem', color: 'white' }}
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Precio Venta ($)</label>
                                    <input type="number" step="0.01" required style={{ width: '100%', background: '#1c1c1f', border: '1px solid #2d2d30', borderRadius: '8px', padding: '0.75rem', color: 'white' }}
                                        value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Costo ($)</label>
                                    <input type="number" step="0.01" required style={{ width: '100%', background: '#1c1c1f', border: '1px solid #2d2d30', borderRadius: '8px', padding: '0.75rem', color: 'white' }}
                                        value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) })} />
                                </div>
                            </div>

                            {/* Sizes Management */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Gestión de Tallas y Stock</label>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <input placeholder="Talla (S, M, L...)" style={{ background: '#1c1c1f', border: '1px solid #2d2d30', borderRadius: '8px', padding: '0.6rem', color: 'white' }}
                                        value={newSize.size} onChange={e => setNewSize({ ...newSize, size: e.target.value.toUpperCase() })} />
                                    <input type="number" placeholder="Cantidad" style={{ background: '#1c1c1f', border: '1px solid #2d2d30', borderRadius: '8px', padding: '0.6rem', color: 'white' }}
                                        value={newSize.stock} onChange={e => setNewSize({ ...newSize, stock: parseInt(e.target.value) || 0 })} />
                                    <button type="button" onClick={handleAddSize} className="btn-primary" style={{ padding: '0.6rem 1rem' }}><Plus size={18} /></button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {formData.sizes.map((s, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1c1f', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                            <span style={{ fontWeight: 700 }}>{s.size}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Stock: {s.stock}</span>
                                                <button type="button" onClick={() => handleRemoveSize(idx)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.sizes.length === 0 && <p style={{ textAlign: 'center', fontSize: '12px', color: '#555' }}>No hay tallas añadidas aún.</p>}
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontWeight: 800 }}>
                                Guardar Producto
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
