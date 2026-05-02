import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, HeartPulse, Stethoscope, Users, Building2, Quote, Phone, Mail, MapPin, ChevronRight, X, ChevronDown } from 'lucide-react';
import { getDepartmentsApi, getDoctorsApi, type Department, type Doctor } from '../../lib/api';
const heroImages = [
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=2000', // Black female doctor
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=2000', // Black male doctor smiling
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=2000', // Modern hospital
  'https://images.unsplash.com/photo-1551076805-e1869043e560?auto=format&fit=crop&q=80&w=2000', // Hospital tech/lab
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000', // Hospital interior
];





export function Landing() {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showToS, setShowToS] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    
    // Fetch real-time data
    getDepartmentsApi().then(setDepartments).catch(console.error);
    getDoctorsApi().then(d => setDoctors(d.slice(0, 4))).catch(console.error);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-50 border-b border-white/30 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold tracking-tight text-slate-900">AfyaFlow</span>
          </button>
          <nav className="hidden gap-8 text-sm font-semibold md:flex">
            <a href="#home" className="hover:text-blue-600 transition-colors">Home</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
            <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#departments" className="hover:text-blue-600 transition-colors">Departments</a>
            <a href="#team" className="hover:text-blue-600 transition-colors">Medical Team</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </nav>
          <div className="flex gap-3">
            <button onClick={() => navigate('/login')} className="rounded-xl border border-blue-600/30 px-5 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50">
              Login
            </button>
            <button onClick={() => navigate('/register')} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:scale-105">
              Join Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative isolate min-h-[85vh] overflow-hidden flex items-center">
        {heroImages.map((src, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === activeImage ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-blue-900/60 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-6 py-24">
          <div className="max-w-3xl animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-md border border-white/20">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Modernizing Healthcare Operations
            </div>
            <h1 className="mb-8 text-5xl font-black leading-tight text-white md:text-7xl tracking-tighter">
              The Future of <span className="text-cyan-400">Digital Care</span> is Here.
            </h1>
            <p className="mb-10 text-xl text-blue-50/90 leading-relaxed md:text-2xl font-medium">
              AfyaFlow powers Kenya's leading hospitals with smart queue orchestration, 
              secure medical records, and a seamless patient experience from booking to discharge.
            </p>
            <div className="flex flex-wrap gap-5">
              <button
                onClick={() => navigate('/book-appointment')}
                className="rounded-2xl bg-cyan-400 px-10 py-4 text-lg font-black text-slate-900 shadow-2xl shadow-cyan-400/40 transition hover:bg-cyan-300 hover:-translate-y-1"
              >
                Book Appointment
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-2xl border border-white/40 bg-white/10 px-10 py-4 text-lg font-black text-white backdrop-blur-xl transition hover:bg-white/20 hover:-translate-y-1"
              >
                Join as Patient
              </button>
            </div>
            <div className="mt-12 flex items-center gap-6 text-white/70">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">P{i}</div>
                ))}
              </div>
              <p className="text-sm font-bold">Joined by <span className="text-cyan-400">10k+</span> active patients this month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Clinical Departments</h2>
            <h3 className="text-4xl font-black text-slate-900 md:text-5xl tracking-tight">Expert Care Across All Specialties</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {departments.slice(0, 6).map((dept, idx) => (
              <div key={dept.id} className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-600/30 hover:bg-white hover:shadow-2xl transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  <HeartPulse className="h-7 w-7" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-3">{dept.name}</h4>
                <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                  {dept.description || `Providing specialized diagnostic and treatment services with state-of-the-art technology in ${dept.name}.`}
                </p>
                <button 
                  onClick={() => navigate('/book-appointment')}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:gap-3 transition-all"
                >
                  Book Consultation <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
            {departments.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium italic">
                Loading clinical departments...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Medical Team Section [NEW] */}
      <section id="team" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Medical Experts</h2>
              <h3 className="text-4xl font-black text-slate-900 md:text-5xl tracking-tight">Consult with Kenya's Finest Specialists</h3>
            </div>
            <button 
              onClick={() => navigate('/doctors')}
              className="rounded-xl border-2 border-slate-900/10 px-6 py-3 font-bold hover:bg-white transition-all"
            >
              View All Doctors
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {doctors.map((dr, idx) => (
              <div key={dr.id} className="text-center group">
                <div className="mb-6 aspect-square overflow-hidden rounded-3xl bg-slate-200 shadow-xl shadow-slate-200/50 transition-transform duration-500 group-hover:-translate-y-2">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dr.name)}&background=random&size=400`} 
                    alt={dr.name} 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <h4 className="text-lg font-black text-slate-900">{dr.name}</h4>
                <p className="text-sm font-bold text-blue-600">{dr.specialization || dr.department?.name || 'Specialist'}</p>
              </div>
            ))}
            {doctors.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium italic">
                Our specialists are being loaded...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: 'Successful Appointments', val: '50k+' },
            { label: 'Patient Satisfaction', val: '98%' },
            { label: 'Licensed Doctors', val: '120+' },
            { label: 'Active Departments', val: '15' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl font-black text-white mb-2 tracking-tighter">{stat.val}</p>
              <p className="text-sm font-bold text-blue-100 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section [NEW] */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-16 text-center">
             <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 mb-4">FAQ</h2>
             <h3 className="text-4xl font-black text-slate-900 tracking-tight">Got Questions? We Have Answers.</h3>
          </div>
          <div className="space-y-4">
            {[
              { q: 'How do I book an appointment?', a: 'Simply click the "Book Appointment" button, select your department and doctor, and choose a convenient time slot. You will receive a confirmation instantly.' },
              { q: 'Can I reschedule my appointment?', a: 'Yes, log in to your patient dashboard, find your upcoming appointment, and click "Reschedule" to pick a new date or time.' },
              { q: 'Is my medical data secure?', a: 'Absolutely. AfyaFlow uses industry-standard encryption and role-based access control to ensure your data is only accessible by you and your authorized care team.' },
              { q: 'Do you accept insurance?', a: 'Yes, we work with all major Kenyan and international insurance providers. You can provide your insurance details during registration.' },
            ].map((faq, idx) => (
              <details key={idx} className="group rounded-2xl bg-slate-50 p-6 border border-slate-100 cursor-pointer">
                <summary className="flex items-center justify-between font-black text-slate-900 list-none">
                  <span>{faq.q}</span>
                  <ChevronDown className="h-5 w-5 text-slate-400 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-slate-600 font-medium leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-16 text-slate-400">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-8 w-8 text-cyan-400" />
                <span className="text-3xl font-black text-white tracking-tighter">AfyaFlow</span>
              </div>
              <p className="text-lg max-w-md font-medium leading-relaxed text-slate-300">
                Leading the digital transformation of healthcare in East Africa.
                Providing reliable, secure, and efficient hospital management solutions.
              </p>
            </div>
            <div>
              <h5 className="font-black text-white mb-6 uppercase tracking-widest text-xs">Quick Links</h5>
              <ul className="space-y-4 font-bold text-sm">
                <li><a href="#about" className="hover:text-cyan-400 transition-colors">About AfyaFlow</a></li>
                <li><a href="#services" className="hover:text-cyan-400 transition-colors">Our Services</a></li>
                <li><a href="#team" className="hover:text-cyan-400 transition-colors">Medical Experts</a></li>
                <li><a href="/register" className="hover:text-cyan-400 transition-colors">Patient Registration</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-black text-white mb-6 uppercase tracking-widest text-xs">Medical Professional Portal</h5>
              <ul className="space-y-4 font-bold text-sm">
                <li><a href="http://localhost:5174/login" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                  Professional Portal
                </a></li>
                <li><a href="http://localhost:5174/login" className="hover:text-cyan-400 transition-colors">Doctor Portal</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-bold">
            <p>&copy; {new Date().getFullYear()} AfyaFlow Healthcare. All rights reserved.</p>
            <div className="flex gap-8">
              <button onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => setShowToS(true)} className="hover:text-white transition-colors">Terms of Service</button>
              <a href="#contact" className="hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black mb-8 tracking-tight">Visit Us Today</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-bold text-xl">Hospital Location</p>
                    <p className="text-slate-400">Afya Complex, Upper Hill District<br />Nairobi, Kenya</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-bold text-xl">Emergency Contact</p>
                    <p className="text-slate-400">+254 700 000 000 (24/7 Line)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-bold text-xl">General Inquiries</p>
                    <p className="text-slate-400">info@afyaflow.co.ke</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
              <h4 className="text-2xl font-bold mb-6">Quick Message</h4>
              <form className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full bg-white/10 border border-white/20 p-4 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors" />
                <input type="email" placeholder="Your Email" className="w-full bg-white/10 border border-white/20 p-4 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors" />
                <textarea placeholder="How can we help?" rows={4} className="w-full bg-white/10 border border-white/20 p-4 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors resize-none"></textarea>
                <button className="w-full bg-cyan-400 text-slate-900 py-4 rounded-xl font-black text-lg hover:bg-cyan-300 transition-all">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Modals */}
      {(showToS || showPrivacy) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {showToS ? 'Terms of Service' : 'Privacy Statement'}
              </h2>
              <button onClick={() => { setShowToS(false); setShowPrivacy(false); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none">
              {showToS ? (
                <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
                  <p className="font-bold text-slate-900">Welcome to AfyaFlow. By using our platform, you agree to the following terms:</p>
                  <h4 className="text-slate-900 font-black">1. Medical Services</h4>
                  <p>AfyaFlow is a hospital management platform. Appointments booked via this platform are subject to doctor availability and hospital policies. Emergency cases should proceed directly to the ER.</p>
                  <h4 className="text-slate-900 font-black">2. User Accounts</h4>
                  <p>Users are responsible for maintaining the confidentiality of their login credentials. Any activity under your account is your responsibility.</p>
                  <h4 className="text-slate-900 font-black">3. Cancellation Policy</h4>
                  <p>Appointments should be cancelled at least 2 hours in advance. Repeated no-shows may lead to temporary suspension of booking privileges.</p>
                  <h4 className="text-slate-900 font-black">4. Liability</h4>
                  <p>While we strive for 100% uptime, AfyaFlow is not liable for system outages that may delay booking confirmations.</p>
                </div>
              ) : (
                <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
                  <p className="font-bold text-slate-900">Your privacy is our priority. Here is how we handle your data:</p>
                  <h4 className="text-slate-900 font-black">1. Data Collection</h4>
                  <p>We collect personal information such as name, contact details, and date of birth to facilitate medical registration and appointment booking.</p>
                  <h4 className="text-slate-900 font-black">2. Medical Records</h4>
                  <p>Your medical history, prescriptions, and consultation notes are strictly confidential and only accessible by authorized medical personnel assigned to your care.</p>
                  <h4 className="text-slate-900 font-black">3. Data Security</h4>
                  <p>We use industry-standard encryption (AES-256) and secure socket layers (SSL) to protect your information during transmission and storage.</p>
                  <h4 className="text-slate-900 font-black">4. Third-Party Sharing</h4>
                  <p>We do not sell your personal or medical data to third parties. Data may only be shared with insurance providers upon your explicit authorization.</p>
                </div>
              )}
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => { setShowToS(false); setShowPrivacy(false); }}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

