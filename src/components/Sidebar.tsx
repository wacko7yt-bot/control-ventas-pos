import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    TrendingUp,
    Settings
} from 'lucide-react';

interface SidebarProps {
    onViewChange: (view: 'dashboard' | 'inventory' | 'sales') => void;
    currentView: string;
}

export const Sidebar = ({ onViewChange, currentView }: SidebarProps) => {
    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'inventory', icon: Package, label: 'Inventario' },
        { id: 'sales', icon: ShoppingCart, label: 'Registro Ventas' },
        { id: 'analytics', icon: TrendingUp, label: 'Analíticas' },
    ];

    return (
        <aside className="glass" style={{ margin: '1rem', display: 'flex', flexDirection: 'column', padding: '1.5rem', height: 'calc(100vh - 2rem)', position: 'sticky', top: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--accent-lime)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                    <TrendingUp size={20} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>OWNER'S HUB</h2>
            </div>

            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none' }}>
                    {navItems.map((item) => (
                        <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                            <button
                                onClick={() => (item.id === 'dashboard' || item.id === 'inventory' || item.id === 'sales') && onViewChange(item.id as any)}
                                className={`transition-all ${currentView === item.id ? 'glass' : ''}`}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    color: currentView === item.id ? 'var(--accent-lime)' : 'var(--text-secondary)',
                                    background: currentView === item.id ? 'rgba(190, 242, 100, 0.05)' : 'transparent',
                                    border: currentView === item.id ? '1px solid rgba(190, 242, 100, 0.2)' : 'none',
                                    textAlign: 'left',
                                    cursor: (item.id === 'dashboard' || item.id === 'inventory' || item.id === 'sales') ? 'pointer' : 'not-allowed',
                                    opacity: (item.id === 'dashboard' || item.id === 'inventory' || item.id === 'sales') ? 1 : 0.5
                                }}
                            >
                                <item.icon size={20} />
                                <span style={{ fontWeight: 600 }}>{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <button className="transition-all" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', color: 'var(--text-secondary)' }}>
                    <Settings size={20} /> <span style={{ fontWeight: 600 }}>Ajustes Privados</span>
                </button>
            </div>
        </aside>
    );
};
