import React, { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import { useData, getInventoryStatus } from '../context/DataContext';
import DashboardCard from '../components/ui/DashboardCard';
import StatusChip from '../components/ui/StatusChip';

/**
 * INVENTORY PAGE
 * Tracks hospital medical supplies, equipment, and pharmaceutical stock levels.
 * Provides automated alerts for low-stock items and expiration tracking.
 */
const InventoryPage: React.FC = () => {
    const { inventory } = useData();
    const { searchQuery, setSearchQuery } = useSearch();
    const [search, setSearch] = useState(searchQuery);
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Sync local search with global search
    useEffect(() => {
        setSearch(searchQuery);
    }, [searchQuery]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setSearchQuery(val);
    };

    const categories = ['all', ...Array.from(new Set(inventory.map(i => i.category)))];

    const filtered = inventory
        .filter(i => categoryFilter === 'all' || i.category === categoryFilter)
        .filter(i =>
            !search ||
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.category.toLowerCase().includes(search.toLowerCase()) ||
            i.supplier.toLowerCase().includes(search.toLowerCase())
        );

    const statusCount = {
        inStock: inventory.filter(i => getInventoryStatus(i) === 'in-stock').length,
        lowStock: inventory.filter(i => getInventoryStatus(i) === 'low-stock').length,
        outOfStock: inventory.filter(i => getInventoryStatus(i) === 'out-of-stock').length,
    };

    const alertItems = inventory.filter(i => getInventoryStatus(i) !== 'in-stock');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-[2.5rem] font-extrabold text-primary tracking-tight leading-none mb-2">Inventory</h1>
                <p className="text-on-surface-variant font-medium">Pharmaceutical and medical supplies stock management</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'In Stock', value: statusCount.inStock, icon: 'check_circle', color: 'text-secondary bg-secondary/10' },
                    { label: 'Low Stock', value: statusCount.lowStock, icon: 'warning', color: 'text-tertiary bg-tertiary-container' },
                    { label: 'Out of Stock', value: statusCount.outOfStock, icon: 'block', color: 'text-error bg-error/10' },
                ].map(s => (
                    <DashboardCard key={s.label} variant="low" className="p-5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                            <span className="material-symbols-outlined text-sm">{s.icon}</span>
                        </div>
                        <p className="text-3xl font-black text-primary">{s.value}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
                    </DashboardCard>
                ))}
            </div>

            {/* Alerts */}
            {alertItems.length > 0 && (
                <div className="bg-error/5 border border-error/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-error text-sm">notifications_active</span>
                        <h3 className="text-sm font-bold text-error">Reorder Alerts ({alertItems.length} items)</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alertItems.map(item => (
                            <div key={item.id} className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-1.5">
                                <span className={`w-2 h-2 rounded-full ${getInventoryStatus(item) === 'out-of-stock' ? 'bg-error' : 'bg-tertiary'}`} />
                                <span className="text-xs font-bold text-on-surface">{item.name}</span>
                                <span className="text-[10px] text-on-surface-variant">({item.quantity} {item.unit})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter + Search */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex bg-surface-container-low rounded-2xl p-1 gap-1 flex-wrap">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${categoryFilter === cat
                                    ? 'bg-white shadow-sm text-primary'
                                    : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-2xl">
                    <span className="material-symbols-outlined text-outline text-sm">search</span>
                    <input
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-sm placeholder:text-outline"
                        placeholder="Search items, suppliers..."
                    />
                </div>
            </div>

            {/* Table */}
            <DashboardCard noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-outline-variant/10">
                                {['Item Name', 'Category', 'Stock Level', 'Reorder At', 'Unit', 'Supplier', 'Status'].map((h, i) => (
                                    <th key={i} className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                            {filtered.map(item => {
                                const stockStatus = getInventoryStatus(item);
                                const pct = item.reorderLevel > 0 ? Math.min((item.quantity / (item.reorderLevel * 3)) * 100, 100) : 100;
                                return (
                                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-on-surface">{item.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold uppercase px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-sm text-primary min-w-[32px]">{item.quantity}</p>
                                                <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${stockStatus === 'out-of-stock' ? 'bg-error' :
                                                                stockStatus === 'low-stock' ? 'bg-tertiary' : 'bg-secondary'
                                                            }`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{item.reorderLevel}</td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{item.unit}</td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{item.supplier}</td>
                                        <td className="px-6 py-4">
                                            <StatusChip
                                                label={stockStatus.replace('-', ' ')}
                                                variant={
                                                    stockStatus === 'in-stock' ? 'success' :
                                                        stockStatus === 'low-stock' ? 'warning' : 'error'
                                                }
                                                dot
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
                    <p className="text-xs text-on-surface-variant">{filtered.length} items · Last updated today</p>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">print</span>
                        Print Report
                    </button>
                </div>
            </DashboardCard>
        </div>
    );
};

export default InventoryPage;