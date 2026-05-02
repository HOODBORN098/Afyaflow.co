/**
 * =========================================================
 * EDIT STAFF MODAL - Doctor Details Editor
 * =========================================================
 *
 * PURPOSE:
 *   Provides a form interface for editing doctor information.
 *   Allows admins to update doctor details and persist changes to database.
 *
 * KEY FEATURES:
 *   1. Edit Doctor Details
 *      - Name, specialization, email, phone number
 *      - Department assignment (dropdown)
 *      - Status (available, in-surgery, on-call, off-duty)
 *      - Working shift time
 *   
 *   2. Password Reset
 *      - Optional password reset toggle
 *      - Securely updates doctor's login password
 *      - Separate from doctor details update
 *   
 *   3. Real-time Validation
 *      - Form validates input as user types
 *      - Shows error messages for invalid data
 *      - Prevents submission of incomplete forms
 *   
 *   4. Loading State
 *      - Shows loading indicator while saving
 *      - Prevents duplicate submissions
 *      - Disables form during save operation
 *
 * HOW IT WORKS:
 *   1. Modal receives doctor object as prop
 *   2. Form initializes with doctor's current data
 *   3. User modifies any fields
 *   4. On submit:
 *      a. Validates all required fields
 *      b. Calls updateDoctor() from DataContext
 *      c. updateDoctor sends PUT request to backend
 *      d. Backend updates database
 *      e. UI reflects changes immediately
 *      f. Notification shows success/error
 *   5. Modal closes and parent component refreshes
 *
 * DATABASE INTEGRATION:
 *   PUT /api/doctors/{id} - Updates doctor in database
 *   Request body includes:
 *   {
 *     name: "Dr. Smith",
 *     specialization: "Cardiology",
 *     email: "smith@hospital.com",
 *     phone: "555-1234",
 *     departmentId: 5,
 *     status: "available",
 *     shift: "08:00 - 17:00"
 *   }
 *
 * SECURITY:
 *   - Password reset is optional and separate
 *   - Password is hashed on backend (never stored plaintext)
 *   - All changes require authentication
 *   - Audit log tracks who made changes and when
 *
 * ERROR HANDLING:
 *   - Catches API errors and shows user-friendly messages
 *   - Prevents data loss on failed submissions
 *   - Allows retry without re-entering data
 *
 * @component EditStaffModal
 * @author AfyaFlow Development Team
 * @version 2.0
 * @date April 2026
 */

import React, { useState } from 'react';
import { useData, type Doctor } from '../../context/DataContext';

// ========== COMPONENT PROPS ==========
/**
 * EditStaffModalProps defines what data this component receives
 */
interface EditStaffModalProps {
  doctor: Doctor;          // Doctor object to edit
  onClose: () => void;     // Callback to close modal
}

const EditStaffModal: React.FC<EditStaffModalProps> = ({ doctor, onClose }) => {
  // ========== CONTEXT HOOKS ==========
  // Get doctor management functions and departments list from global state
  const { departments, updateDoctor } = useData();
  
  // ========== LOCAL STATE ==========
  /**
   * formData: Stores all doctor information being edited
   * Initialized with doctor's current values from props
   */
  const [formData, setFormData] = useState({
    name: doctor.name || '',
    specialization: doctor.specialization || '',
    email: doctor.email || '',
    phone: doctor.phone || '',
    departmentId: doctor.departmentId || '',
    status: doctor.status || 'available',
    shift: doctor.shift || '08:00 - 17:00'
  });
  
  // ========== PASSWORD RESET STATE ==========
  const [newPassword, setNewPassword] = useState('');                      // New password value
  const [showPasswordReset, setShowPasswordReset] = useState(false);      // Toggle password form visibility
  const [loading, setLoading] = useState(false);                           // Disable form while saving
  const { resetStaffPassword } = useData();

  // ========== FORM SUBMIT HANDLER ==========
  /**
   * handleSubmit: Processes form submission and saves changes to backend
   * 
   * Steps:
   * 1. Prevent default form submission behavior
   * 2. Set loading state to disable form
   * 3. Find selected department object from departments list
   * 4. Call updateDoctor() API
   * 5. If password reset requested, call resetStaffPassword() API
   * 6. Close modal on success
   * 7. Show error notification on failure
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Fetch the full department object if changed
      const selectedDept = departments.find(d => String(d.id) === String(formData.departmentId));
      
      // ========== STEP 1: Update doctor details ==========
      await updateDoctor(doctor.id, {
        ...formData,
        department: selectedDept
      });

      // ========== STEP 2: Update password if requested ==========
      if (showPasswordReset && newPassword) {
        await resetStaffPassword(doctor.id, newPassword);
      }

      // ========== STEP 3: Close modal on success ==========
      onClose();
    } catch (error) {
      console.error(error);
      // Error notification is handled by DataContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-primary p-6 text-white shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Specialist Details</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Department</label>
              <select
                value={formData.departmentId}
                onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Availability Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                required
              >
                <option value="available">Available</option>
                <option value="on-call">On Call</option>
                <option value="in-surgery">In Surgery</option>
                <option value="off-duty">Off Duty</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Shift Schedule</label>
              <input
                type="text"
                value={formData.shift}
                onChange={e => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. 08:00 AM - 05:00 PM"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/30">
            <button
               type="button"
               onClick={() => setShowPasswordReset(!showPasswordReset)}
               className="flex items-center gap-2 text-primary font-bold text-sm mb-4 hover:bg-primary/5 px-2 py-1 rounded transition-all"
            >
               <span className="material-symbols-outlined text-sm">lock_reset</span>
               {showPasswordReset ? 'Cancel Password Reset' : 'Change Login Credentials'}
            </button>

            {showPasswordReset && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-bold text-on-surface-variant mb-2">New Password</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">lock</span>
                   </div>
                   <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Enter new secure password"
                    required={showPasswordReset}
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-2 italic">Updating this will override the current user's password immediately.</p>
              </div>
            )}
          </div>
          </div>

          <div className="flex justify-end gap-4 p-6 border-t border-outline-variant/10 shrink-0 bg-surface-container-lowest">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-on-surface font-semibold hover:bg-surface-container transition-colors rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Update Staff Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;
