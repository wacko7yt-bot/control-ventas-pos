import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    image_url?: string;
    sizes: { size: string; stock: number }[];
}

export const Sales = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [salePrice, setSalePrice] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (error) toast.error('Error al cargar productos');
        else setProducts(data || []);
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setSalePrice(product.price);
        setSelectedSize('');
    };

    const handleConfirmSale = async () => {
        if (!selectedProduct || !selectedSize || salePrice <= 0) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        const sizeObj = selectedProduct.sizes.find(s => s.size === selectedSize);
        if (!sizeObj || sizeObj.stock <= 0) {
            toast.error('No hay stock para esta talla');
            return;
        }

        setLoading(true);

        try {
            // 1. Create Sale record
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    total_amount: salePrice,
                    status: 'completed'
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Item record
            const { error: itemError } = await supabase
                .from('sale_items')
                .insert([{
                    sale_id: saleData.id,
                    product_id: selectedProduct.id,
                    quantity: 1,
                    unit_price: salePrice,
                    size: selectedSize
                }]);

            if (itemError) throw itemError;

            // 3. Update Product Stock (Atomic-ish)
            const updatedSizes = selectedProduct.sizes.map(s =>
                s.size === selectedSize ? { ...s, stock: s.stock - 1 } : s
            );

            const { error: stockError } = await supabase
                .from('products')
                .update({ sizes: updatedSizes })
                .eq('id', selectedProduct.id);

            if (stockError) throw stockError;

            toast.success('¡Venta registrada con éxito!');
            setSelectedProduct(null);
            setSelectedSize('');
            fetchProducts();
        } catch (err: any) {
            console.error('Error recording sale:', err);
            toast.error('Error al registrar la venta: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Registro de Ventas</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Selecciona un producto para registrar una venta.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left Side: Product Selection */}
                <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre..."
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0.75rem 0.75rem 0.75rem 2.5rem', color: 'white', outline: 'none' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredProducts.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleSelectProduct(p)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    background: selectedProduct?.id === p.id ? 'rgba(190, 242, 100, 0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${selectedProduct?.id === p.id ? 'rgba(190, 242, 100, 0.4)' : 'transparent'}`,
                                    transition: 'all 0.2s',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ width: '40px', height: '40px', background: '#27272a', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Package size={20} color="#666" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>${p.price.toFixed(2)}</p>
                                </div>
                                {selectedProduct?.id === p.id && <CheckCircle size={16} color="var(--accent-lime)" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Side: Sale Details */}
                <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Detalles de la Venta</h2>

                    {!selectedProduct ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1rem', opacity: 0.5 }}>
                            <ShoppingCart size={48} />
                            <p>Selecciona un producto de la izquierda</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block' }}>Talla de la prenda:</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {selectedProduct.sizes.map(s => (
                                        <button
                                            key={s.size}
                                            disabled={s.stock <= 0}
                                            onClick={() => setSelectedSize(s.size)}
                                            style={{
                                                padding: '0.75rem 1.25rem',
                                                borderRadius: '10px',
                                                background: selectedSize === s.size ? 'var(--accent-lime)' : 'rgba(255,255,255,0.05)',
                                                color: selectedSize === s.size ? '#000' : (s.stock <= 0 ? '#444' : 'white'),
                                                border: `1px solid ${selectedSize === s.size ? 'var(--accent-lime)' : 'rgba(255,255,255,0.1)'}`,
                                                fontWeight: 700,
                                                cursor: s.stock <= 0 ? 'not-allowed' : 'pointer',
                                                opacity: s.stock <= 0 ? 0.3 : 1
                                            }}
                                        >
                                            {s.size}
                                            <span style={{ fontSize: '10px', display: 'block', opacity: 0.7 }}>Stock: {s.stock}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Precio de Venta ($):</label>
                                <input
                                    type="number"
                                    value={salePrice}
                                    onChange={(e) => setSalePrice(parseFloat(e.target.value))}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '1rem', color: 'white', fontSize: '1.5rem', fontWeight: 800, outline: 'none' }}
                                />
                            </div>

                            <div style={{ background: 'rgba(190, 242, 100, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px dashed rgba(190, 242, 100, 0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Producto:</span>
                                    <span style={{ fontWeight: 600 }}>{selectedProduct.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Talla:</span>
                                    <span style={{ fontWeight: 600 }}>{selectedSize || '--'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ fontWeight: 700 }}>Total Venta:</span>
                                    <span style={{ fontWeight: 800, color: 'var(--accent-lime)', fontSize: '1.25rem' }}>${salePrice.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleConfirmSale}
                                disabled={loading || !selectedSize}
                                style={{ width: '100%', justifyContent: 'center', height: '56px', fontSize: '16px', fontWeight: 800 }}
                            >
                                {loading ? 'Registrando...' : 'Confirmar Venta'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
