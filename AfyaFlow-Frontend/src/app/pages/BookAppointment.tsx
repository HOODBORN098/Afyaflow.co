import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Activity, ArrowLeft, Check, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDepartmentsApi,
  getDoctorsByDepartmentApi,
  getQueueApi,
  bookAppointmentApi,
  Department,
  Doctor,
  QueueApiResponse
} from '../../lib/api';
import { getAccessToken } from '../../lib/authStorage';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { 
  saveBookingData, 
  getBookingData, 
  clearBookingData, 
  hasBookingData,
  getBookingAge 
} from '../../lib/bookingService';

// Hardcoded hospital time slots
const HOSPITAL_TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

type BookingStep = 'department' | 'doctor' | 'date' | 'time' | 'confirm';

type DoctorWithQueue = Doctor & {
  queueCount: number;
  availability: 'available' | 'in-surgery' | 'absent';
};

export function BookAppointment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<BookingStep>('department');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorWithQueue[]>([]);
  const [queueData, setQueueData] = useState<QueueApiResponse[]>([]);

  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const [showResumeOption, setShowResumeOption] = useState(false);
  const [departmentNames, setDepartmentNames] = useState<Record<number, string>>({});
  const [doctorNames, setDoctorNames] = useState<Record<number, string>>({});

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // ========== CHECK FOR EXISTING BOOKING DRAFT ON LOAD ==========
  useEffect(() => {
    const draft = getBookingData();
    if (draft && draft.selectedDepartment) {
      setShowResumeOption(true);
    }
  }, []);

  // ========== AUTO-SAVE BOOKING PROGRESS ==========
  // Whenever user makes a selection, save it to localStorage
  useEffect(() => {
    saveBookingData({
      selectedDepartment,
      selectedDoctor,
      selectedDate,
      selectedTime,
      departmentName: departmentNames[selectedDepartment || 0],
      doctorName: doctorNames[selectedDoctor || 0],
    });
  }, [selectedDepartment, selectedDoctor, selectedDate, selectedTime, departmentNames, doctorNames]);

  // Load departments
  useEffect(() => {
    getDepartmentsApi()
      .then(depts => {
        setDepartments(depts);
        // Build department name map
        const names: Record<number, string> = {};
        depts.forEach(d => names[d.id] = d.name);
        setDepartmentNames(names);
      })
      .catch(() => toast.error('Failed to load departments'));
  }, []);

  // Load queue data
  useEffect(() => {
    getQueueApi()
      .then(setQueueData)
      .catch(() => console.error('Failed to load queue'));
  }, []);

  // Load doctors when department is selected
  useEffect(() => {
    if (selectedDepartment) {
      getDoctorsByDepartmentApi(selectedDepartment)
        .then(doctorList => {
          const doctorsWithQueue = doctorList.map(doctor => {
            const queueCount = queueData.filter(q => q.patient?.firstName)?.length || 0;
            const currentHour = new Date().getHours();
            let availability: 'available' | 'in-surgery' | 'absent' = 'available';
            if (currentHour >= 12 && currentHour < 14) {
              availability = 'in-surgery';
            } else if (currentHour >= 17) {
              availability = 'absent';
            }
            
            return {
              ...doctor,
              queueCount,
              availability,
            };
          });
          setDoctors(doctorsWithQueue);
          // Build doctor name map
          const names: Record<number, string> = {};
          doctorList.forEach(d => names[d.id] = d.name);
          setDoctorNames(names);
        })
        .catch(() => toast.error('Failed to load doctors'));
    }
  }, [selectedDepartment, queueData]);

  // ========== RESUME PREVIOUS BOOKING ==========
  /**
   * Restores previous booking selections if user has pending draft.
   * Skips to current step in booking process.
   */
  const handleResumeBooking = () => {
    const draft = getBookingData();
    if (draft) {
      setSelectedDepartment(draft.selectedDepartment);
      setSelectedDoctor(draft.selectedDoctor);
      setSelectedDate(draft.selectedDate);
      setSelectedTime(draft.selectedTime);
      
      // Determine what step to show
      if (draft.selectedTime) {
        setCurrentStep('confirm');
      } else if (draft.selectedDate) {
        setCurrentStep('time');
      } else if (draft.selectedDoctor) {
        setCurrentStep('date');
      } else if (draft.selectedDepartment) {
        setCurrentStep('doctor');
      }
      
      setShowResumeOption(false);
      toast.success('Booking resumed!');
    }
  };

  // ========== START NEW BOOKING ==========
  /**
   * Clears previous draft and starts fresh.
   */
  const handleStartNew = () => {
    clearBookingData();
    setSelectedDepartment(null);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep('department');
    setShowResumeOption(false);
    toast.info('Starting new booking');
  };

  const handleConfirmBooking = async () => {
    if (!selectedDepartment || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Please complete all steps');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      // Save booking data before redirecting to login
      saveBookingData({
        selectedDepartment,
        selectedDoctor,
        selectedDate,
        selectedTime,
        departmentName: departmentNames[selectedDepartment],
        doctorName: doctorNames[selectedDoctor],
      });
      setShowAuthModal(true);
      return;
    }

    try {
      const result = await bookAppointmentApi({ 
        departmentId: selectedDepartment,
        doctorId: selectedDoctor,
        date: selectedDate, 
        time: selectedTime 
      });
      console.log('Booking successful:', result);
      
      // Clear saved data only after successful booking
      clearBookingData();
      
      toast.success('Appointment booked successfully!');
      setIsBookingComplete(true);
      setTimeout(() => navigate('/patient'), 2000);
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to book appointment. Please check your connection.';
      toast.error(errorMessage);
    }
  };

  const handleDepartmentSelect = (departmentId: number) => {
    setSelectedDepartment(departmentId);
    setSelectedDoctor(null);
    setCurrentStep('doctor');
  };

  const handleDoctorSelect = (doctorId: number) => {
    setSelectedDoctor(doctorId);
    setCurrentStep('date');
  };

  const steps = [
    { id: 'department', label: 'Department', completed: selectedDepartment !== null },
    { id: 'doctor', label: 'Doctor', completed: selectedDoctor !== null },
    { id: 'date', label: 'Date', completed: selectedDate !== '' },
    { id: 'time', label: 'Time', completed: selectedTime !== '' },
    { id: 'confirm', label: 'Confirm', completed: false },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary animate-spin-slow" />
            <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
          </div>
        </div>
      </header>

      {/* RESUME BOOKING BANNER */}
      {showResumeOption && (
        <div className="bg-blue-50 border-b-2 border-blue-200">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-bold text-blue-900">You have a previous booking in progress</p>
                <p className="text-xs text-blue-700">Your selections have been saved from {getBookingAge()} hour{getBookingAge() !== 1 ? 's' : ''} ago</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResumeBooking}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={handleStartNew}
                className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Start New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  step.completed ? 'bg-secondary text-white' :
                  currentStep === step.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {step.completed ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <p className={`text-sm mt-2 ${currentStep === step.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && <div className={`h-1 flex-1 transition-colors duration-300 ${step.completed ? 'bg-secondary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Step 1: Department */}
        {currentStep === 'department' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Select Department</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => handleDepartmentSelect(dept.id)}
                  className="bg-white rounded-xl border-2 border-border p-8 hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col items-center justify-center gap-4 group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                     <Activity className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-center">{dept.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Doctor */}
        {currentStep === 'doctor' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Select Doctor</h2>
            {doctors.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor, index) => {
                  const isRecommended = index === 0 || doctor.availability === 'available';
                  const doctorInitials = (doctor.name || 'Dr').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  
                  return (
                    <button
                      key={doctor.id}
                      onClick={() => handleDoctorSelect(doctor.id)}
                      className="bg-white rounded-2xl border-2 border-border p-6 hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
                    >
                      {isRecommended && (
                        <div className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <span>⭐</span> Recommended
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center group-hover:shadow-lg transition-shadow flex-shrink-0 overflow-hidden">
                          {doctor.profileImage ? (
                            <img src={doctor.profileImage} alt={doctor.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-sm">{doctorInitials}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground">{doctor.name}</h3>
                          <p className="text-sm text-muted-foreground">{doctor.specialization || 'Specialist'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Queue: </span>
                          <span className="font-semibold text-foreground">{doctor.queueCount} patients</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          <span className={`font-semibold px-2 py-1 rounded-full text-xs uppercase ${
                            doctor.availability === 'available' 
                              ? 'bg-green-100 text-green-700'
                              : doctor.availability === 'in-surgery'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {doctor.availability === 'available' ? '✓ Available' : 
                             doctor.availability === 'in-surgery' ? 'In Surgery' : 
                             'Absent'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">Click to select</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-border p-12 text-center">
                <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No doctors available for this department</p>
              </div>
            )}
            <div className="mt-8">
              <button
                onClick={() => setCurrentStep('department')}
                className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Date */}
        {currentStep === 'date' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Select Date</h2>
            <div className="bg-white p-8 rounded-2xl border-2 border-border shadow-sm">
              <input
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full p-6 border-2 border-border rounded-xl text-xl focus:border-primary focus:outline-none transition-colors"
              />
              {selectedDate && (
                <button
                  className="mt-8 w-full py-4 bg-primary text-white rounded-xl text-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  onClick={() => setCurrentStep('time')}
                >
                  Next <ArrowLeft className="w-6 h-6 rotate-180" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Time */}
        {currentStep === 'time' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Select Time Slot</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HOSPITAL_TIME_SLOTS.map(slot => (
                <button
                  key={slot}
                  onClick={() => { setSelectedTime(slot); setCurrentStep('confirm'); }}
                  className="bg-white rounded-xl border-2 border-border p-5 hover:border-primary hover:shadow-lg hover:bg-primary/5 transition-all font-bold text-lg text-center"
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {currentStep === 'confirm' && !isBookingComplete && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-primary">Booking Summary</h2>
            <div className="bg-white rounded-3xl border-2 border-border p-10 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              
              <div className="space-y-6">
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span className="text-muted-foreground font-medium">Department</span>
                  <span className="font-bold text-xl">{departments.find(d => d.id === selectedDepartment)?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span className="text-muted-foreground font-medium">Doctor</span>
                  <span className="font-bold text-xl">{doctors.find(d => d.id === selectedDoctor)?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span className="text-muted-foreground font-medium">Date</span>
                  <span className="font-bold text-xl">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-medium">Time</span>
                  <span className="font-bold text-2xl text-primary">{selectedTime}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button
                  onClick={handleConfirmBooking}
                  className="w-full py-5 bg-primary text-white rounded-2xl text-xl font-bold hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                >
                  Confirm Booking <Check className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentStep('department')}
                  className="w-full py-4 border-2 border-border rounded-xl font-semibold hover:bg-muted transition-colors text-muted-foreground"
                >
                  Change Department
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Success */}
        {isBookingComplete && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border-2 border-green-200 p-12 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-12 h-12 text-green-600" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-green-900">Booking Successful!</h2>
                <p className="text-lg text-green-700 leading-relaxed">
                  Your appointment has been confirmed. You will receive a confirmation email shortly with your appointment details and token number.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 space-y-4 border border-green-100">
                <div className="text-left space-y-4">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase">Department</p>
                    <p className="text-lg font-bold text-foreground">{departments.find(d => d.id === selectedDepartment)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase">Doctor</p>
                    <p className="text-lg font-bold text-foreground">{doctors.find(d => d.id === selectedDoctor)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase">Date & Time</p>
                    <p className="text-lg font-bold text-foreground">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at {selectedTime}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-green-700">
                <p>✓ Please arrive 10 minutes before your appointment</p>
                <p>✓ Bring your ID and insurance card</p>
                <p>✓ Your token number will be assigned at the hospital</p>
              </div>

              <button
                onClick={() => navigate('/patient')}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Auth Requirement Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-center mb-4">Login Required</h3>
            <p className="text-muted-foreground text-center mb-10 leading-relaxed">
              To confirm your appointment and receive your ticket number, you need to be signed in to your patient account.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                Sign In <LogIn className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/register?redirect=' + encodeURIComponent(window.location.pathname))}
                className="w-full py-4 border-2 border-border text-foreground rounded-2xl font-bold hover:bg-muted transition-all flex items-center justify-center gap-2"
              >
                Create Account <UserPlus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}