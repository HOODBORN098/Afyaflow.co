import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, HeartPulse, Stethoscope, Users, Building2, Quote, Phone, Mail, MapPin } from 'lucide-react';
import bed from '../../assets/bed.jpg';
import download1 from '../../assets/download (1).jpg';
import download2 from '../../assets/download (2).jpg';
import download3 from '../../assets/download.jpg';
import images from '../../assets/images.jpg';

const heroImages = [
  download1,
  download2,
  download3,
  images,
  download1,
  download2,
  download3,
  images,
];





export function Landing() {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-50 border-b border-white/30 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold tracking-tight">AfyaFlow</span>
          </button>
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <a href="#home" className="hover:text-blue-600 transition-colors">Home</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
            <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </nav>
          <div className="flex gap-3">
            <button onClick={() => navigate('/login')} className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
              Login
            </button>
            <button onClick={() => navigate('/register')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Register
            </button>
          </div>
        </div>
      </header>

      <section id="home" className="relative isolate min-h-[78vh] overflow-hidden">
        {heroImages.map((src, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === activeImage ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-blue-900/55 to-cyan-800/50" />
        <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-medium text-white backdrop-blur">
              Trusted digital healthcare operations
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
              Quality Healthcare, Anytime, Anywhere
            </h1>
            <p className="mb-8 text-lg text-blue-50 md:text-xl">
              AfyaFlow powers modern hospitals with secure appointment scheduling, smart queue orchestration, and role-based workflows for patients and clinical teams.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/book-appointment')}
                className="rounded-xl bg-cyan-400 px-7 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-300"
              >
                Book Appointment
              </button>
              <button
                onClick={() => navigate('/login')}
                className="rounded-xl border border-white/70 bg-white/10 px-7 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 md:p-12">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">About AfyaFlow</p>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">A mission-driven healthcare platform</h2>
            <p className="text-slate-600">
              We help hospitals and clinics deliver faster, safer, and more predictable patient experiences. AfyaFlow combines digital registration, role-based operations, and real-time queue intelligence to improve care outcomes.
            </p>
          </div>
          <div className="space-y-4 text-slate-700">
            <div className="rounded-xl bg-blue-50 p-4">
              <h3 className="font-semibold">Patient-first operations</h3>
              <p className="text-sm text-slate-600">Less waiting, clearer scheduling, and better communication across each care touchpoint.</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <h3 className="font-semibold">Clinical workflow efficiency</h3>
              <p className="text-sm text-slate-600">Doctors, receptionists, and admins work with synchronized queue and appointment data.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-gradient-to-b from-white to-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Services</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Built for every role in the hospital</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Patients', icon: HeartPulse, desc: 'Fast registration, appointment booking, and queue visibility.' },
              { title: 'Doctors', icon: Stethoscope, desc: 'Structured queue handling and consultation workflow control.' },
              { title: 'Receptionists', icon: Users, desc: 'Patient intake, scheduling support, and queue desk operations.' },
              { title: 'Departments', icon: Building2, desc: 'Coordinated service lines with accountable clinical flow.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg">
                <item.icon className="mb-4 h-9 w-9 text-blue-600" />
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Testimonials</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Success stories from healthcare teams</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            '"AfyaFlow reduced our front-desk congestion and improved patient satisfaction significantly."',
            '"Queue visibility helps us maintain better consultation flow and less idle time."',
            '"Administrative oversight is now data-driven, secure, and far more efficient."',
          ].map((quote, idx) => (
            <div key={idx} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <Quote className="mb-3 h-6 w-6 text-cyan-600" />
              <p className="text-slate-700">{quote}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-slate-900 py-20 text-slate-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Contact Us</p>
            <h2 className="mt-2 text-3xl font-bold">Let’s modernize your care delivery</h2>
            <div className="mt-6 space-y-3 text-slate-300">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> +254 794523302</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> afyaflow@gmail.com</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Nakuru, Kenya</p>
            </div>
          </div>
          <form className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <div className="grid gap-4">
              <input className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 placeholder:text-slate-300" placeholder="Your name" />
              <input className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 placeholder:text-slate-300" placeholder="Email address" type="email" />
              <textarea className="min-h-28 rounded-lg border border-white/20 bg-white/10 px-4 py-3 placeholder:text-slate-300" placeholder="How can we help?" />
              <button type="button" className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-900 transition hover:bg-cyan-300">
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
