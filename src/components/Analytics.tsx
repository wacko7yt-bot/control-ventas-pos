import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    TrendingUp,
    Package,
    ShoppingCart,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Cell,
    Pie
} from 'recharts';

export const Analytics = () => {
    const [salesHistory, setSalesHistory] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [stats, setStats] = useState({
        avgTicket: 0,
        totalItemsSold: 0,
        conversionRate: 100 // Placeholder for internal tool
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            const { data: sales, error } = await supabase
                .from('sales')
                .select(`
                    id,
                    total_amount,
                    created_at,
                    sale_items (
                        quantity,
                        products ( name )
                    )
                `)
                .order('created_at', { ascending: true });

            if (error) return;

            // 1. Process daily sales for the chart
            const dailyData: any = {};
            let totalQty = 0;
            const productCounts: any = {};

            sales.forEach(sale => {
                const date = new Date(sale.created_at).toLocaleDateString('es-ES', { weekday: 'short' });
                dailyData[date] = (dailyData[date] || 0) + sale.total_amount;

                sale.sale_items?.forEach((item: any) => {
                    totalQty += item.quantity;
                    const pName = item.products?.name || 'Desconocido';
                    productCounts[pName] = (productCounts[pName] || 0) + item.quantity;
                });
            });

            const chartData = Object.keys(dailyData).map(key => ({ name: key, sales: dailyData[key] }));
            setSalesHistory(chartData);

            // 2. Top Products
            const top = Object.keys(productCounts)
                .map(name => ({ name, value: productCounts[name] }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            setTopProducts(top);

            // 3. Overall Stats
            setStats({
                avgTicket: sales.length > 0 ? (sales.reduce((acc, s) => acc + s.total_amount, 0) / sales.length) : 0,
                totalItemsSold: totalQty,
                conversionRate: 100
            });
        };

        fetchAnalytics();
    }, []);

    const COLORS = ['#bef264', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa'];

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Analíticas de Rendimiento</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Métricas detalladas sobre el comportamiento de tu stock y ventas.</p>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '10px', color: '#60a5fa' }}>
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Ticket Promedio</p>
                            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>${stats.avgTicket.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(190, 242, 100, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-lime)' }}>
                            <Package size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Prendas Vendidas</p>
                            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{stats.totalItemsSold} Unidades</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1.5rem', minHeight: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={18} /> Tendencia de Ventas
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" fontSize={12} />
                            <YAxis stroke="#666" fontSize={12} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="sales" stroke="var(--accent-lime)" fill="rgba(190, 242, 100, 0.1)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass" style={{ padding: '1.5rem', minHeight: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PieChartIcon size={18} /> Prendas Más Vendidas
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={topProducts}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                        {topProducts.map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '11px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }}></div>
                                <span>{p.name} ({p.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
