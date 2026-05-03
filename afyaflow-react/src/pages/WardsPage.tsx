import React, { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import DashboardCard from '../components/ui/DashboardCard';
import SignatureButton from '../components/ui/SignatureButton';
import StatusChip from '../components/ui/StatusChip';
import { useData } from '../context/DataContext';
import type { Ward, Bed } from '../context/DataContext';
import { wardApi } from '../services/api';

const WARD_TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  icu:       { color: 'bg-error/10 text-error border-error/20',       icon: 'monitor_heart', label: 'ICU' },
  maternity: { color: 'bg-pink-100 text-pink-700 border-pink-200',    icon: 'child_care',    label: 'Maternity' },
  surgical:  { color: 'bg-secondary/10 text-secondary border-secondary/20', icon: 'add_circle',label: 'Surgical' },
  hdu:       { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'emergency',     label: 'HDU' },
  general:   { color: 'bg-primary/10 text-primary border-primary/20', icon: 'bed',           label: 'General' },
};

const BED_STATUS: Record<string, string> = {
  available:   'bg-secondary text-white',
  occupied:    'bg-primary text-white',
  maintenance: 'bg-outline/30 text-on-surface-variant',
};



/**
 * WARDS PAGE
 * Manages hospital bed occupancy, ward admissions, and clinical space allocation.
 * Features a real-time bed map and ward-specific analytics.
 */
const WardsPage: React.FC = () => {
  const { wards, fetchWards, departments } = useData();
  const { searchQuery, setSearchQuery } = useSearch();
  const [search, setSearch] = useState(searchQuery);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [showAddWard, setShowAddWard] = useState(false);
  const [newWardForm, setNewWardForm] = useState({ name: '', department: '', type: 'general' as Ward['type'], capacity: 10 });

  // Sync local search with global search
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSearchQuery(val);
  };

  const filteredWards = wards.filter(w => 
    !search || 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.department.toLowerCase().includes(search.toLowerCase())
  );

  const totalBeds    = wards.reduce((s, w) => s + w.capacity, 0);
  const occupiedBeds = wards.reduce((s, w) => s + (w.beds?.filter(b => b.status === 'occupied').length || 0), 0);
  const availBeds    = wards.reduce((s, w) => s + (w.beds?.filter(b => b.status === 'available').length || 0), 0);
  const maintBeds    = wards.reduce((s, w) => s + (w.beds?.filter(b => b.status === 'maintenance').length || 0), 0);

  const handleDischarge = async (_wardId: string | number, bedId: string | number) => {
    try {
        await wardApi.updateBed(Number(bedId), 'available');
        fetchWards(); // Refresh data
        setSelectedBed(null);
    } catch (error) {
        console.error("Discharge failed:", error);
    }
  };

  const handleAddWard = async () => {
    if (!newWardForm.name || !newWardForm.department) return;
    try {
        await wardApi.create(newWardForm);
        fetchWards();
        setShowAddWard(false);
        setNewWardForm({ name: '', department: '', type: 'general', capacity: 10 });
    } catch (error) {
        console.error("Add ward failed:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[2.5rem] font-extrabold text-primary tracking-tight leading-none mb-2">Ward Management</h1>
          <p className="text-on-surface-variant font-medium">Live bed occupancy across all clinical areas</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-2xl w-64 border border-outline-variant/30">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
            <input 
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-outline"
              placeholder="Search ward or dept..."
            />
          </div>
          <SignatureButton icon="add" onClick={() => setShowAddWard(true)}>Add Ward</SignatureButton>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Beds',  value: totalBeds,    icon: 'bed',            color: 'text-primary' },
          { label: 'Occupied',    value: occupiedBeds,  icon: 'person',         color: 'text-on-surface' },
          { label: 'Available',   value: availBeds,     icon: 'check_circle',   color: 'text-secondary' },
          { label: 'Maintenance', value: maintBeds,     icon: 'build',          color: 'text-outline' },
        ].map(k => (
          <DashboardCard key={k.label} variant="low" className="p-5 flex items-center gap-4">
            <span className={`material-symbols-outlined text-3xl ${k.color}`}>{k.icon}</span>
            <div>
              <p className="text-3xl font-extrabold text-on-surface">{k.value}</p>
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest">{k.label}</p>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Ward Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredWards.map(ward => {
          const cfg = WARD_TYPE_CONFIG[ward.type];
          const occ = ward.beds?.filter(b => b.status === 'occupied').length || 0;
          const pct = Math.round((occ / ward.capacity) * 100);

          return (
            <DashboardCard key={ward.id} className="p-6 space-y-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedWard(selectedWard?.id === ward.id ? null : ward)}>
              {/* Ward header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${cfg.color}`}>
                    <span className="material-symbols-outlined text-xl">{cfg.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{ward.name}</h3>
                    <p className="text-xs text-on-surface-variant">{ward.department} · {cfg.label}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-lg">
                  {occ}/{ward.capacity}
                </span>
              </div>

              {/* Capacity bar */}
              <div>
                <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
                  <span>Occupancy</span>
                  <span className={pct > 85 ? 'text-error font-bold' : pct > 60 ? 'text-amber-600 font-bold' : 'text-secondary font-bold'}>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pct > 85 ? 'bg-error' : pct > 60 ? 'bg-amber-500' : 'bg-secondary'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Bed grid */}
              <div className="grid grid-cols-6 gap-1.5">
                {ward.beds?.map(bed => (
                  <button key={bed.id}
                    onClick={e => { e.stopPropagation(); setSelectedBed(bed); setSelectedWard(ward); }}
                    title={bed.status === 'occupied' ? `Bed ${bed.bedNumber}: ${bed.patientName}` : `Bed ${bed.bedNumber}: ${bed.status}`}
                    className={`h-8 w-full rounded-lg text-[9px] font-bold transition-all hover:scale-110 ${BED_STATUS[bed.status]}`}>
                    {bed.bedNumber}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-4 text-[10px] text-on-surface-variant">
                {[['bg-secondary', 'Available'], ['bg-primary', 'Occupied'], ['bg-outline/30', 'Maintenance']].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded ${c}`} />{l}
                  </span>
                ))}
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Bed Detail Panel */}
      {selectedBed && selectedWard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-sm border border-outline-variant/20 p-8 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">
                Bed {selectedBed.bedNumber} — {selectedWard.name}
              </h3>
              <button onClick={() => setSelectedBed(null)} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Status</span>
                <StatusChip
                  label={selectedBed.status}
                  variant={selectedBed.status === 'occupied' ? 'info' : selectedBed.status === 'available' ? 'success' : 'neutral'}
                  dot />
              </div>
              {selectedBed.patientName && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Patient</span>
                    <span className="font-bold text-on-surface">{selectedBed.patientName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Admitted</span>
                    <span className="text-on-surface">{new Date(selectedBed.admittedAt!).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {selectedBed.status === 'occupied' && (
              <button
                onClick={() => handleDischarge(selectedWard.id, selectedBed.id)}
                className="w-full py-2.5 bg-error/10 text-error border border-error/20 rounded-xl font-semibold text-sm hover:bg-error/20 transition-colors">
                Discharge Patient
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Ward Modal */}
      {showAddWard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-md border border-outline-variant/20 p-8 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-primary">Add New Ward</h3>
              <button onClick={() => setShowAddWard(false)} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Ward Name</label>
                <input type="text" placeholder="e.g. Surgical Ward C"
                  value={newWardForm.name}
                  onChange={e => setNewWardForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Department</label>
                <select 
                  value={newWardForm.department} 
                  onChange={e => setNewWardForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Type</label>
                  <select value={newWardForm.type} onChange={e => setNewWardForm(p => ({ ...p, type: e.target.value as Ward['type'] }))}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                    {Object.entries(WARD_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Beds</label>
                  <input type="number" min={1} max={50} value={newWardForm.capacity}
                    onChange={e => setNewWardForm(p => ({ ...p, capacity: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddWard(false)}
                className="flex-1 py-3 border border-outline-variant text-on-surface font-semibold rounded-xl text-sm hover:bg-surface-container-low">
                Cancel
              </button>
              <SignatureButton onClick={handleAddWard} className="flex-1">Create Ward</SignatureButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardsPage;
