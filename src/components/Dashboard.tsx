import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    ArrowUpRight,
    ArrowDownRight,
    Database,
    Plus,
    History,
    DollarSign,
    ArrowDownCircle,
    ArrowUpCircle
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
        income: 0,
        expenses: 0,
        profit: 0
    });
    const [recentSales, setRecentSales] = useState<any[]>([]);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // 1. Obtener Ventas e Items con su costo para calcular Gasto real
                const { data: salesData, error: sError } = await supabase
                    .from('sales')
                    .select(`
                        id,
                        total_amount,
                        created_at,
                        sale_items (
                            quantity,
                            product_id,
                            products (
                                name,
                                cost
                            )
                        )
                    `)
                    .order('created_at', { ascending: false });

                if (sError) throw sError;

                let totalIncome = 0;
                let totalExpenses = 0;

                salesData?.forEach(sale => {
                    totalIncome += (sale.total_amount || 0);
                    sale.sale_items?.forEach((item: any) => {
                        const itemCost = item.products?.cost || 0;
                        totalExpenses += (itemCost * item.quantity);
                    });
                });

                setStats({
                    income: totalIncome,
                    expenses: totalExpenses,
                    profit: totalIncome - totalExpenses
                });

                // Set recent sales for the list
                setRecentSales(salesData?.slice(0, 5) || []);
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
                <div className="glass glass-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                            <ArrowUpCircle size={20} />
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Ingresos Totales</p>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa' }}>${stats.income.toLocaleString()}</h2>
                </div>

                <div className="glass glass-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                            <ArrowDownCircle size={20} />
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Gastos (Inversión)</p>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f87171' }}>${stats.expenses.toLocaleString()}</h2>
                </div>

                <div className="glass glass-hover" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(190, 242, 100, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(190, 242, 100, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(190, 242, 100, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-lime)' }}>
                            <DollarSign size={20} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: stats.profit >= 0 ? 'var(--accent-lime)' : '#f87171', gap: '4px' }}>
                            {stats.profit >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Beneficio Neto</p>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: stats.profit >= 0 ? 'var(--accent-lime)' : '#f87171' }}>
                        ${stats.profit.toLocaleString()}
                    </h2>
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
                    <h3 style={{ marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={18} /> Últimas Ventas
                    </h3>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {recentSales.map((sale) => (
                            <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'rgba(190, 242, 100, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-lime)', fontSize: '10px', fontWeight: 700 }}>
                                        {sale.sale_items?.[0]?.products?.name?.charAt(0) || 'V'}
                                    </div>
                                    <div style={{ maxWidth: '120px' }}>
                                        <p style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sale.sale_items?.[0]?.products?.name || 'Venta Registro'}
                                        </p>
                                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                            {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 700, color: 'var(--accent-lime)', fontSize: '14px' }}>
                                    +${sale.total_amount.toLocaleString()}
                                </p>
                            </div>
                        ))}
                        {recentSales.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2rem' }}>No hay ventas registradas.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};
