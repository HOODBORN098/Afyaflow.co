import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import DashboardCard from '../ui/DashboardCard';
import type { Doctor } from '../../context/DataContext';

interface DoctorManagementModalProps {
  onClose: () => void;
}

const DoctorManagementModal: React.FC<DoctorManagementModalProps> = ({ onClose }) => {
  const { doctors, departments, updateDoctor } = useData();
  const { notify } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'departments' | 'doctors'>('departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<number | null>(null);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSearch = 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = !selectedDepartmentFilter || doc.departmentId === selectedDepartmentFilter || doc.department?.id === selectedDepartmentFilter;
      
      return matchesSearch && matchesDept;
    });
  }, [searchQuery, selectedDepartmentFilter, doctors]);

  const doctorsByDepartment = useMemo(() => {
    const grouped: Record<number, Doctor[]> = {};
    
    departments.forEach(dept => {
      grouped[dept.id] = doctors.filter(doc => doc.departmentId === dept.id || doc.department?.id === dept.id);
    });
    
    return grouped;
  }, [doctors, departments]);

  const handleSaveDoctor = (updatedDoctor: Doctor) => {
    if (updateDoctor) {
      updateDoctor(updatedDoctor.id, updatedDoctor);
      notify(`${updatedDoctor.name} updated successfully!`, 'success');
      setEditingDoctor(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <DashboardCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-outline-variant/30 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-primary">Doctor Management</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-outline-variant/30 px-6 pt-4">
          <button
            onClick={() => setActiveTab('departments')}
            className={`pb-4 px-2 font-bold relative transition-colors ${
              activeTab === 'departments'
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Departments & Doctors
            {activeTab === 'departments' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`pb-4 px-2 font-bold relative transition-colors ${
              activeTab === 'doctors'
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Doctors
            {activeTab === 'doctors' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Departments View */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              {departments.map(dept => {
                const deptDoctors = doctorsByDepartment[dept.id] || [];
                return (
                  <div key={dept.id} className="border border-outline-variant/30 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-primary">{dept.name}</h3>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                        {deptDoctors.length} Doctor{deptDoctors.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {deptDoctors.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {deptDoctors.map(doc => (
                          <div key={doc.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10 hover:border-primary/30 transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-bold text-on-surface">{doc.name}</p>
                                <p className="text-xs text-on-surface-variant">{doc.specialization}</p>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                doc.status === 'available' ? 'bg-green-100 text-green-700' :
                                doc.status === 'in-surgery' ? 'bg-yellow-100 text-yellow-700' :
                                doc.status === 'on-call' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {doc.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-on-surface-variant space-y-1 mb-4">
                              <p>Email: {doc.email}</p>
                              <p>Shift: {doc.shift}</p>
                              <p>Patients Seen: {doc.patientsSeenToday}</p>
                            </div>
                            <button
                              onClick={() => setEditingDoctor(doc)}
                              className="w-full py-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors text-sm font-bold"
                            >
                              Edit Doctor
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-on-surface-variant italic py-4">
                        No doctors assigned to this department yet
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* All Doctors View */}
          {activeTab === 'doctors' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    type="text"
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <select
                  value={selectedDepartmentFilter || ''}
                  onChange={(e) => setSelectedDepartmentFilter(e.target.value ? Number(e.target.value) : null)}
                  className="px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm font-medium"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Doctors Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/30">
                      {['Doctor Name', 'Department', 'Specialization', 'Email', 'Status', 'Shift', 'Actions'].map(h => (
                        <th key={h} className="py-3 px-4 text-left font-bold text-on-surface-variant text-xs uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredDoctors.map(doc => (
                      <tr key={doc.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-4 font-bold text-on-surface">{doc.name}</td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          {doc.department?.name || departments.find(d => d.id === doc.departmentId)?.name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">{doc.specialization}</td>
                        <td className="py-3 px-4 text-on-surface-variant text-xs">{doc.email}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            doc.status === 'available' ? 'bg-green-100 text-green-700' :
                            doc.status === 'in-surgery' ? 'bg-yellow-100 text-yellow-700' :
                            doc.status === 'on-call' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {doc.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">{doc.shift}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setEditingDoctor(doc)}
                            className="text-primary hover:text-primary/80 font-bold text-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDoctors.length === 0 && (
                  <div className="text-center py-8 text-on-surface-variant">
                    No doctors found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <DashboardCard className="w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="border-b border-outline-variant/30 p-6 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <h3 className="text-xl font-bold text-primary">Edit Doctor: {editingDoctor.name}</h3>
              <button 
                onClick={() => setEditingDoctor(null)}
                className="p-2 hover:bg-surface-container rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Name (Read-only) */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={editingDoctor.name}
                  disabled
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface-variant opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">
                  Department
                </label>
                <select
                  value={editingDoctor.departmentId || editingDoctor.department?.id || ''}
                  onChange={(e) => setEditingDoctor({ 
                    ...editingDoctor, 
                    departmentId: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-1 focus:ring-primary outline-none font-medium"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Specialization */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">
                  Specialization
                </label>
                <input
                  type="text"
                  value={editingDoctor.specialization}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* Station */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">
                  Station
                </label>
                <input
                  type="text"
                  value={editingDoctor.station}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, station: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">
                  Shift
                </label>
                <select
                  value={editingDoctor.shift}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, shift: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-1 focus:ring-primary outline-none font-medium"
                >
                  <option value="Morning">Morning (8AM - 4PM)</option>
                  <option value="Evening">Evening (4PM - 12AM)</option>
                  <option value="Night">Night (12AM - 8AM)</option>
                  <option value="On-call">On-call</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">
                  Status
                </label>
                <select
                  value={editingDoctor.status}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-1 focus:ring-primary outline-none font-medium"
                >
                  <option value="available">Available</option>
                  <option value="in-surgery">In Surgery</option>
                  <option value="on-call">On Call</option>
                  <option value="off-duty">Off Duty</option>
                </select>
              </div>

                </div>


            {/* Fixed Action Buttons */}
            <div className="p-6 border-t border-outline-variant/30 flex gap-3 bg-white sticky bottom-0 shrink-0">
              <button
                onClick={() => setEditingDoctor(null)}
                className="flex-1 px-4 py-3 border border-outline-variant/30 rounded-lg font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveDoctor(editingDoctor)}
                className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
};

export default DoctorManagementModal;
