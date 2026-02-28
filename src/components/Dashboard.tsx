import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    TrendingUp,
    Package,
    ShoppingCart,
    ArrowUpRight,
    Database,
    Plus
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const data = [
    { name: 'Lun', sales: 4000 },
    { name: 'Mar', sales: 3000 },
    { name: 'Mie', sales: 2000 },
    { name: 'Jue', sales: 2780 },
    { name: 'Vie', sales: 1890 },
    { name: 'Sab', sales: 2390 },
    { name: 'Dom', sales: 3490 },
];

export const Dashboard = () => {
    const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const [stats, setStats] = useState({
        products: 0,
        totalSales: 0,
        totalCosts: 0
    });

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // 1. Conexión y Conteo de Productos
                const { count: productCount, error: pError } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true });

                if (pError) throw pError;

                // 2. Suma de Ventas Reales (desde tabla sales)
                const { data: salesData, error: sError } = await supabase
                    .from('sales')
                    .select('total_amount');

                if (sError) throw sError;
                const totalSales = salesData?.reduce((acc, sale) => acc + (sale.total_amount || 0), 0) || 0;

                // 3. Valor del Inventario (Suma de Precio de Venta * Stock)
                const { data: productsData, error: prError } = await supabase
                    .from('products')
                    .select('price, stock');

                if (prError) throw prError;
                const totalInventoryValue = productsData?.reduce((acc, p) => acc + (p.price * p.stock), 0) || 0;

                setStats({
                    products: productCount || 0,
                    totalSales: totalSales,
                    totalCosts: totalInventoryValue
                });
                setDbStatus('connected');

            } catch (err) {
                console.error('Dashboard logic error:', err);
                setDbStatus('error');
            }
        }
        fetchDashboardData();
    }, []);

    return (
        <main style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Resumen de Negocio</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Bienvenido de nuevo, administrador.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '12px' }}>
                        <Database size={16} color={dbStatus === 'connected' ? 'var(--accent-lime)' : '#ef4444'} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {dbStatus === 'checking' && 'Verificando Supabase...'}
                            {dbStatus === 'connected' && 'Supabase Conectado'}
                            {dbStatus === 'error' && 'Error de Conexión'}
                        </span>
                    </div>
                    <button className="btn-primary">
                        <Plus size={20} /> Nueva Venta
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="glass glass-hover" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                            <ShoppingCart size={20} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', gap: '4px' }}>
                            <ArrowUpRight size={16} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Real</span>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Ventas Acumuladas</p>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>${stats.totalSales.toLocaleString()}</h2>
                </div>

                <div className="glass glass-hover" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(190, 242, 100, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-lime)' }}>
                            <Package size={20} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', gap: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700 }}>Activos</span>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Productos Registrados</p>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{stats.products} Items</h2>
                </div>

                <div className="glass glass-hover" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                            <TrendingUp size={20} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#f87171', gap: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700 }}>Actual</span>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Valor de Inventario</p>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>${stats.totalCosts.toLocaleString()}</h2>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="glass" style={{ padding: '1.5rem', height: '400px' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Ventas Diarias</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-lime)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--accent-lime)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#18181b', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--accent-lime)' }}
                            />
                            <Area type="monotone" dataKey="sales" stroke="var(--accent-lime)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Últimas Ventas</h3>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#27272a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>CF</div>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 600 }}>Cliente Final</p>
                                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Hace 5 min</p>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 700, color: 'var(--accent-lime)' }}>+$120.00</p>
                            </div>
                        ))}
                    </div>
                    <button style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 600 }}>Ver todo el historial</button>
                </div>
            </div>
        </main>
    );
};
