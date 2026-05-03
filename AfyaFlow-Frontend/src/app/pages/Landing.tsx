import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, HeartPulse, ChevronRight, X, ChevronDown,
  Phone, Mail, MapPin,
  Cpu, ShieldCheck, BarChart3, Zap,
  CalendarCheck, Ambulance, Hash, Clock,
  Ticket, ArrowRight, CheckCircle2, Sparkles,
  MousePointerClick, ListOrdered, BellRing, Star,
  Users, GraduationCap, Target, Lightbulb,
} from 'lucide-react';
import { getDepartmentsApi, getDoctorsApi, type Department, type Doctor } from '../../lib/api';

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES  (injected once via a <style> tag)
───────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  :root {
    --teal:   #0d9488;
    --teal-l: #14b8a6;
    --teal-d: #0f766e;
    --sky:    #0ea5e9;
    --ink:    #0a1628;
    --ink2:   #1e2d42;
    --mist:   #f0f7f6;
    --white:  #ffffff;
  }

  * { box-sizing: border-box; }

  body { font-family: 'DM Sans', sans-serif; }

  .afya-heading { font-family: 'Sora', sans-serif; }

  /* ── hero crossfade ── */
  .hero-slide { position: absolute; inset: 0; background-size: cover; background-position: center; transition: opacity 1.2s ease; }

  /* ── fade-up reveal ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .7s ease both; }
  .fade-up-1 { animation-delay: .1s; }
  .fade-up-2 { animation-delay: .22s; }
  .fade-up-3 { animation-delay: .36s; }
  .fade-up-4 { animation-delay: .5s; }

  /* ── nav link underline grow ── */
  .nav-link { position: relative; }
  .nav-link::after {
    content: ''; position: absolute; bottom: -2px; left: 0;
    width: 0; height: 2px; background: var(--teal-l);
    transition: width .3s ease;
  }
  .nav-link:hover::after { width: 100%; }

  /* ── card lift ── */
  .card-lift { transition: transform .35s ease, box-shadow .35s ease; }
  .card-lift:hover { transform: translateY(-6px); box-shadow: 0 24px 48px -12px rgba(13,148,136,.18); }

  /* ── pill tag ── */
  .tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'Sora', sans-serif; font-size: .7rem; font-weight: 700;
    letter-spacing: .15em; text-transform: uppercase;
    padding: 5px 14px; border-radius: 999px;
  }

  /* ── noise texture overlay for hero ── */
  .noise::before {
    content: '';
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 1;
  }

  /* ── member card ── */
  .member-card {
    border: 1px solid rgba(13,148,136,.15);
    background: linear-gradient(135deg, #f0fffe 0%, #ffffff 100%);
    transition: transform .3s, box-shadow .3s;
  }
  .member-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -10px rgba(13,148,136,.2);
    border-color: rgba(13,148,136,.35);
  }

  /* ── section divider wave ── */
  .wave-divider { display: block; width: 100%; overflow: hidden; line-height: 0; }

  /* ── pill pulse ── */
  @keyframes pulse-ring { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
  .live-dot { animation: pulse-ring 2s ease infinite; }

  /* ── teal gradient text ── */
  .grad-text {
    background: linear-gradient(135deg, var(--teal-l) 0%, var(--sky) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── service card icon ring ── */
  .icon-ring {
    width: 56px; height: 56px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--teal) 0%, var(--sky) 100%);
    box-shadow: 0 8px 20px -4px rgba(13,148,136,.4);
    flex-shrink: 0;
    transition: transform .3s;
  }
  .service-card:hover .icon-ring { transform: scale(1.1) rotate(-4deg); }

  details summary::-webkit-details-marker { display: none; }
`;

const heroImages = [
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1551076805-e1869043e560?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000',
];

const teamMembers = [
  { name: "James Brian Ndung'u", role: 'Project Lead & Backend Dev' },
  { name: 'Eric Wambua', role: 'Backend Developer' },
  { name: 'Denis Mutuku', role: 'Frontend Developer' },
  { name: 'Reagan Obadha', role: 'UI/UX Designer' },
  { name: 'Douglas Wafula', role: 'Database Engineer' },
  { name: 'Patience Mirenja', role: 'QA & Testing' },
  { name: 'Vincent Okoth', role: 'API Integration' },
  { name: 'Robert Muchiri', role: 'Systems Analyst' },
];

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export function Landing() {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showToS, setShowToS] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // inject fonts + styles
    if (!document.getElementById('afya-styles')) {
      const s = document.createElement('style');
      s.id = 'afya-styles';
      s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
    const timer = window.setInterval(() => setActiveImage(p => (p + 1) % heroImages.length), 5000);
    getDepartmentsApi().then(setDepartments).catch(console.error);
    getDoctorsApi().then(d => setDoctors(d.slice(0, 4))).catch(console.error);
    return () => window.clearInterval(timer);
  }, []);

  /* ── helpers ── */
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div style={{ background: 'var(--mist)', color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(13,148,136,.12)',
        boxShadow: '0 2px 20px rgba(0,0,0,.06)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          {/* Logo */}
          <button onClick={() => scrollTo('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#0d9488,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity style={{ color: '#fff', width: 22, height: 22 }} />
            </div>
            <span className="afya-heading" style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.03em' }}>
              Afya<span style={{ color: 'var(--teal)' }}>Flow</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', gap: 32, fontSize: '.85rem', fontWeight: 600 }} className="hidden-mobile">
            {['home', 'about', 'services', 'departments', 'team', 'contact'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink2)', textTransform: 'capitalize', fontFamily: "'DM Sans', sans-serif", fontSize: '.85rem', fontWeight: 600, padding: '4px 0' }}>
                {id === 'home' ? 'Home' : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/login')}
              style={{ padding: '8px 20px', borderRadius: 10, border: '1.5px solid var(--teal)', background: 'none', color: 'var(--teal)', fontWeight: 700, cursor: 'pointer', fontSize: '.85rem', fontFamily: "'Sora', sans-serif" }}>
              Login
            </button>
            <button onClick={() => navigate('/register')}
              style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--teal) 0%, var(--sky) 100%)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.85rem', fontFamily: "'Sora', sans-serif", boxShadow: '0 4px 16px rgba(13,148,136,.35)' }}>
              Join Free
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section id="home" className="noise" style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {heroImages.map((src, idx) => (
          <div key={idx} className="hero-slide" style={{ backgroundImage: `url(${src})`, opacity: idx === activeImage ? 1 : 0 }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(10,22,40,.85) 0%, rgba(13,148,136,.35) 60%, transparent 100%)', zIndex: 2 }} />

        <div style={{ position: 'relative', zIndex: 3, maxWidth: 1280, margin: '0 auto', padding: '80px 24px', width: '100%' }}>
          <div className="fade-up fade-up-1" style={{ marginBottom: 24 }}>
            <span className="tag" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)' }}>
              <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Egerton University · 3rd-Year Group Project
            </span>
          </div>

          <h1 className="afya-heading fade-up fade-up-2" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.08, color: '#fff', marginBottom: 24, letterSpacing: '-.04em', maxWidth: 800 }}>
            No More Endless<br />
            <span className="grad-text">Hospital Queues.</span><br />
            Ever Again.
          </h1>

          <p className="fade-up fade-up-3" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: 'rgba(255,255,255,.82)', maxWidth: 560, lineHeight: 1.7, marginBottom: 40, fontWeight: 400 }}>
            AfyaFlow is a smart hospital queue management and online appointment scheduling system —
            built by students at Egerton University to fix one of Kenya's most frustrating healthcare problems.
          </p>

          <div className="fade-up fade-up-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <button onClick={() => navigate('/book-appointment')}
              style={{ padding: '14px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, var(--teal) 0%, var(--sky) 100%)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: "'Sora', sans-serif", boxShadow: '0 8px 28px rgba(13,148,136,.45)', transition: 'transform .2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              Book Appointment →
            </button>
            <button onClick={() => scrollTo('about')}
              style={{ padding: '14px 36px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,.35)', background: 'rgba(255,255,255,.1)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: "'Sora', sans-serif" }}>
              Our Story
            </button>
          </div>

          {/* Floating stat strip */}
          <div style={{ marginTop: 60, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              { val: '8', label: 'Team Members' },
              { val: '10+', label: 'Departments' },
              { val: '0', label: 'Paper Forms' },
              { val: '100%', label: 'Digital Records' },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 22px', borderRadius: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
                <div className="afya-heading" style={{ color: 'var(--teal-l)', fontWeight: 900, fontSize: '1.4rem' }}>{s.val}</div>
                <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide dots */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 4 }}>
          {heroImages.map((_, i) => (
            <button key={i} onClick={() => setActiveImage(i)}
              style={{ width: i === activeImage ? 28 : 8, height: 8, borderRadius: 4, border: 'none', background: i === activeImage ? 'var(--teal-l)' : 'rgba(255,255,255,.4)', cursor: 'pointer', transition: 'all .4s' }} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════ */}
      <section id="about" style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tag" style={{ background: 'rgba(13,148,136,.08)', color: 'var(--teal-d)', marginBottom: 16, display: 'inline-flex' }}>Who We Are</span>
            <h2 className="afya-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-.04em', color: 'var(--ink)', marginBottom: 16, lineHeight: 1.12 }}>
              Eight Students. One Mission.<br />
              <span className="grad-text">Fix the Hospital Queue.</span>
            </h2>
            <p style={{ color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.75, fontSize: '1.05rem' }}>
              We are a group of eight third-year Computer Science students at <strong style={{ color: 'var(--teal-d)' }}>Egerton University</strong> who got tired of seeing patients wait hours on hard benches — and decided to do something about it.
            </p>
          </div>

          {/* Story cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 72 }}>
            {[
              {
                icon: Target,
                title: 'The Problem We Are Solving',
                body: "Walk into almost any public hospital in Kenya and you'll find the same scene: rows of plastic chairs, paper cards, and no idea when you'll be called. Patients miss work, doctors lose track of who's next, and records disappear into filing cabinets. AfyaFlow replaces all of that with a digital-first queue and appointment system that works the way people actually live — on their phones.",
              },
              {
                icon: Lightbulb,
                title: 'What We Built',
                body: 'AfyaFlow is a full-stack hospital management platform with an online patient portal, a receptionist dashboard, and a real-time doctor queue view. Patients book appointments online, receive a unique AFYA token, and can track their queue position from anywhere. Staff manage schedules, walk-ins, prescriptions, and referrals — all in one place, all paperless.',
              },
              {
                icon: GraduationCap,
                title: 'Built as a University Project',
                body: "This is our 3rd-year group project at Egerton University's School of Information Technology. We built it to production-grade standards: Spring Boot REST API, JWT authentication, role-based access control, a React patient portal, and a separate staff dashboard — because we believe student projects should solve real problems, not just tick academic boxes.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="card-lift" style={{ background: 'var(--mist)', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(13,148,136,.1)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--teal), var(--sky))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(13,148,136,.3)' }}>
                  <Icon style={{ color: '#fff', width: 22, height: 22 }} />
                </div>
                <h3 className="afya-heading" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)', marginBottom: 12 }}>{title}</h3>
                <p style={{ color: '#64748b', lineHeight: 1.75, fontSize: '.9rem' }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Tech pillars */}
          <div style={{ background: 'var(--ink)', borderRadius: 24, padding: '56px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <span className="tag" style={{ background: 'rgba(20,184,166,.15)', color: 'var(--teal-l)', marginBottom: 12, display: 'inline-flex' }}>Under the Hood</span>
              <h3 className="afya-heading" style={{ color: '#fff', fontWeight: 900, fontSize: '1.7rem' }}>What Makes AfyaFlow Different</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, width: '100%' }}>
              {[
                { icon: Cpu, color: '#14b8a6', title: 'Real-Time Queue', desc: 'Doctor dashboard polls every 3 s. Patients see their position update live — no refresh.' },
                { icon: ShieldCheck, color: '#38bdf8', title: 'Secure by Design', desc: 'JWT sessions, BCrypt hashing, RBAC permissions, and a full audit trail on every action.' },
                { icon: Zap, color: '#facc15', title: 'Zero Paper', desc: 'Book online, get an AFYA token instantly, walk in already in the system.' },
                { icon: BarChart3, color: '#a78bfa', title: 'Full Audit Log', desc: 'Every login, prescription, and status change is timestamped and actor-tagged forever.' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '28px 24px', transition: 'background .3s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.09)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}>
                  <Icon style={{ color, width: 28, height: 28, marginBottom: 14 }} />
                  <h4 className="afya-heading" style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', marginBottom: 8 }}>{title}</h4>
                  <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.85rem', lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════ */}
      <section id="services" style={{ padding: '100px 24px', background: 'var(--mist)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <span className="tag" style={{ background: 'rgba(13,148,136,.08)', color: 'var(--teal-d)', marginBottom: 16, display: 'inline-flex' }}>What We Offer</span>
            <h2 className="afya-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-.04em', color: 'var(--ink)', marginBottom: 16, lineHeight: 1.12 }}>
              Five Workflows.<br /><span className="grad-text">Zero Paper. Zero Waiting in the Dark.</span>
            </h2>
            <p style={{ color: '#64748b', maxWidth: 580, margin: '0 auto', lineHeight: 1.75 }}>
              AfyaFlow handles the entire patient journey end-to-end — from booking to discharge — in one connected system.
            </p>
          </div>

          {/* Service cards */}
          <div style={{ display: 'grid', gap: 24 }}>
            {/* ── S1: Online Booking ── */}
            <div className="card-lift service-card" style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(13,148,136,.1)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* text */}
              <div style={{ padding: '48px 44px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                  <div className="icon-ring"><CalendarCheck style={{ color: '#fff', width: 24, height: 24 }} /></div>
                  <span className="tag" style={{ background: 'rgba(13,148,136,.08)', color: 'var(--teal-d)' }}>24 / 7 Online</span>
                </div>
                <h3 className="afya-heading" style={{ fontWeight: 900, fontSize: '1.55rem', color: 'var(--ink)', marginBottom: 14, letterSpacing: '-.03em' }}>Online Appointment Booking</h3>
                <p style={{ color: '#64748b', lineHeight: 1.78, marginBottom: 24 }}>
                  Patients browse available departments, pick a doctor, choose a free time slot (only genuinely available ones appear), and confirm — all in under two minutes. No phone calls. No reception queues. No double-bookings. The system enforces slot uniqueness at the database level.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Live slot availability — booked times hidden automatically',
                    'Instant confirmation with a unique AFYA patient token',
                    'Works from any smartphone — no app needed',
                    'Booking draft saved so patients can resume after login',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '.875rem', color: '#475569' }}>
                      <CheckCircle2 style={{ color: 'var(--teal)', width: 17, height: 17, flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/book-appointment')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, var(--teal), var(--sky))', color: '#fff', padding: '12px 28px', borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora', sans-serif", fontSize: '.9rem' }}>
                  Book Now <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
              {/* visual */}
              <div style={{ background: 'linear-gradient(135deg, var(--teal-d) 0%, #0369a1 100%)', padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Booking Flow</p>
                {[
                  { step: '01', label: 'Choose Department', done: true },
                  { step: '02', label: 'Select Doctor', done: true },
                  { step: '03', label: 'Pick Date & Slot', done: true },
                  { step: '04', label: 'Get AFYA Token', done: false },
                ].map(({ step, label, done }) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 14, background: done ? 'rgba(255,255,255,.12)' : 'rgba(20,184,166,.3)', border: `1px solid ${done ? 'rgba(255,255,255,.2)' : 'rgba(20,184,166,.5)'}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: done ? 'rgba(255,255,255,.15)' : 'var(--teal-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.78rem', fontWeight: 900, color: done ? '#fff' : 'var(--ink)', fontFamily: "'Sora', sans-serif", flexShrink: 0 }}>{step}</div>
                    <span style={{ color: done ? 'rgba(255,255,255,.8)' : '#fff', fontWeight: 700, fontSize: '.9rem' }}>{label}</span>
                    {done && <CheckCircle2 style={{ color: 'var(--teal-l)', width: 16, height: 16, marginLeft: 'auto' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* ── S2 + S3 side by side ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Queue Token */}
              <div className="card-lift service-card" style={{ background: 'var(--ink)', borderRadius: 24, padding: '44px 40px', border: '1px solid rgba(255,255,255,.06)' }}>
                <div className="icon-ring" style={{ marginBottom: 22 }}><Ticket style={{ color: '#fff', width: 24, height: 24 }} /></div>
                <h3 className="afya-heading" style={{ fontWeight: 900, fontSize: '1.3rem', color: '#fff', marginBottom: 14, letterSpacing: '-.03em' }}>Queue Tokens &amp; Live Position</h3>
                <p style={{ color: 'rgba(255,255,255,.55)', lineHeight: 1.75, fontSize: '.875rem', marginBottom: 20 }}>
                  Every confirmed booking generates a unique AFYA token. Patients can check their live queue position from any browser — no refresh needed. Estimated wait time updates automatically every time a patient ahead is served.
                </p>
                {/* mini token mockup */}
                <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: '20px 24px', fontFamily: 'monospace' }}>
                  <div style={{ color: 'var(--teal-l)', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '.08em', marginBottom: 4 }}>AFYA-1407832147</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,.5)', fontSize: '.8rem', marginTop: 10 }}>
                    <span>Position</span><span style={{ color: 'var(--teal-l)', fontWeight: 700 }}>#3 of 11</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,.5)', fontSize: '.8rem', marginTop: 6 }}>
                    <span>Est. Wait</span><span style={{ color: '#fff', fontWeight: 700 }}>~30 min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} className="live-dot" />
                    <span style={{ color: '#4ade80', fontSize: '.8rem', fontWeight: 700 }}>Active</span>
                  </div>
                </div>
              </div>

              {/* Emergency & Walk-in */}
              <div className="card-lift service-card" style={{ background: '#fff', borderRadius: 24, padding: '44px 40px', border: '1px solid rgba(13,148,136,.1)' }}>
                <div className="icon-ring" style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 6px 16px rgba(239,68,68,.3)', marginBottom: 22 }}>
                  <Ambulance style={{ color: '#fff', width: 24, height: 24 }} />
                </div>
                <h3 className="afya-heading" style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--ink)', marginBottom: 14, letterSpacing: '-.03em' }}>Emergency &amp; Walk-in Care</h3>
                <p style={{ color: '#64748b', lineHeight: 1.75, fontSize: '.875rem', marginBottom: 20 }}>
                  Walk-in patients are registered at reception in under 60 seconds and immediately join the doctor's digital queue — no paper card, no confusion. Urgent cases can be flagged for priority positioning.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Registered by receptionist in &lt; 60 s',
                    'Instantly joins correct doctor queue',
                    'Priority flag for urgent cases',
                    'Invitation email to set up patient account later',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '.875rem', color: '#475569' }}>
                      <CheckCircle2 style={{ color: '#ef4444', width: 17, height: 17, flexShrink: 0, marginTop: 2 }} />
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── S4 + S5 side by side ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Smart Scheduling */}
              <div className="card-lift service-card" style={{ background: '#fff', borderRadius: 24, padding: '44px 40px', border: '1px solid rgba(13,148,136,.1)' }}>
                <div className="icon-ring" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 6px 16px rgba(99,102,241,.3)', marginBottom: 22 }}>
                  <ListOrdered style={{ color: '#fff', width: 24, height: 24 }} />
                </div>
                <h3 className="afya-heading" style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--ink)', marginBottom: 14, letterSpacing: '-.03em' }}>Smart Schedule Management</h3>
                <p style={{ color: '#64748b', lineHeight: 1.75, fontSize: '.875rem', marginBottom: 20 }}>
                  Each doctor gets 18 configurable half-hour slots per day. Online bookings and walk-ins feed into one unified view — visible simultaneously to doctor and receptionist. Slot conflicts are detected and blocked at the server level.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    '18 slots per doctor per day',
                    'No double-booking — server-enforced',
                    'Online + walk-in in one merged view',
                    'Full appointment history retained permanently',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '.875rem', color: '#475569' }}>
                      <CheckCircle2 style={{ color: '#6366f1', width: 17, height: 17, flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Digital Medical Records */}
              <div className="card-lift service-card" style={{ background: 'linear-gradient(135deg, #f0fffe 0%, #e0f9f7 100%)', borderRadius: 24, padding: '44px 40px', border: '1px solid rgba(13,148,136,.18)' }}>
                <div className="icon-ring" style={{ marginBottom: 22 }}>
                  <ShieldCheck style={{ color: '#fff', width: 24, height: 24 }} />
                </div>
                <h3 className="afya-heading" style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--ink)', marginBottom: 14, letterSpacing: '-.03em' }}>Secure Digital Records</h3>
                <p style={{ color: '#64748b', lineHeight: 1.75, fontSize: '.875rem', marginBottom: 20 }}>
                  Every prescription, diagnosis, and referral is attached to the patient's permanent digital profile — timestamped, encrypted, and role-gated. Only the clinical staff assigned to your care can open your file.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'JWT-secured sessions + BCrypt passwords',
                    'Role-based access for every staff tier',
                    'Full audit trail: who did what and when',
                    'No record ever gets "lost in the filing cabinet"',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '.875rem', color: '#475569' }}>
                      <CheckCircle2 style={{ color: 'var(--teal)', width: 17, height: 17, flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DEPARTMENTS
      ══════════════════════════════════════════ */}
      <section id="departments" style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tag" style={{ background: 'rgba(13,148,136,.08)', color: 'var(--teal-d)', marginBottom: 16, display: 'inline-flex' }}>Clinical Departments</span>
            <h2 className="afya-heading" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-.04em', color: 'var(--ink)', lineHeight: 1.15 }}>
              Expert Care Across<br /><span className="grad-text">All Specialties</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {departments.slice(0, 6).map(dept => (
              <div key={dept.id} className="card-lift" style={{ borderRadius: 20, padding: '32px 28px', background: 'var(--mist)', border: '1px solid rgba(13,148,136,.1)' }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, var(--teal), var(--sky))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <HeartPulse style={{ color: '#fff', width: 24, height: 24 }} />
                </div>
                <h4 className="afya-heading" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)', marginBottom: 10 }}>{dept.name}</h4>
                <p style={{ color: '#64748b', fontSize: '.875rem', lineHeight: 1.7, marginBottom: 20 }}>
                  {(dept as any).description || `Specialized diagnostic and treatment services in ${dept.name} using modern clinical technology.`}
                </p>
                <button onClick={() => navigate('/book-appointment')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 700, cursor: 'pointer', fontSize: '.875rem', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
                  Book Consultation <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}
            {departments.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                Loading clinical departments…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TEAM — THE 8 MEMBERS
      ══════════════════════════════════════════ */}
      <section id="team" style={{ padding: '100px 24px', background: 'var(--mist)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tag" style={{ background: 'rgba(13,148,136,.08)', color: 'var(--teal-d)', marginBottom: 16, display: 'inline-flex' }}>Meet the Team</span>
            <h2 className="afya-heading" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-.04em', color: 'var(--ink)', marginBottom: 14, lineHeight: 1.15 }}>
              The Eight Who Built This
            </h2>
            <p style={{ color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
              Third-year Computer Science students at <strong style={{ color: 'var(--teal-d)' }}>Egerton University</strong>, united by one goal: make hospital visits less painful for everyone.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {teamMembers.map((member, idx) => (
              <div key={member.name} className="member-card" style={{ borderRadius: 20, padding: '28px 22px', textAlign: 'center' }}>
                {/* Avatar */}
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${idx * 45},60%,45%) 0%, hsl(${idx * 45 + 40},60%,60%) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 6px 20px hsla(${idx * 45},60%,45%,.3)`, fontSize: '1.25rem', fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                  {member.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <h4 className="afya-heading" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)', marginBottom: 6, lineHeight: 1.3 }}>{member.name}</h4>
                <p style={{ color: 'var(--teal-d)', fontSize: '.8rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{member.role}</p>
                <div style={{ marginTop: 14, fontSize: '.75rem', color: '#94a3b8', fontWeight: 600 }}>Egerton University</div>
              </div>
            ))}
          </div>

          {/* Medical staff section */}
          {doctors.length > 0 && (
            <>
              <div style={{ textAlign: 'center', margin: '80px 0 48px' }}>
                <span className="tag" style={{ background: 'rgba(13,148,136,.08)', color: 'var(--teal-d)', marginBottom: 16, display: 'inline-flex' }}>Medical Experts</span>
                <h2 className="afya-heading" style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.03em', color: 'var(--ink)' }}>Our Hospital Specialists</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                {doctors.map(dr => (
                  <div key={dr.id} style={{ textAlign: 'center' }}>
                    <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16, aspectRatio: '1', background: '#e2e8f0' }}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dr.name)}&background=0d9488&color=fff&size=400`} alt={dr.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h4 className="afya-heading" style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '1rem' }}>{dr.name}</h4>
                    <p style={{ color: 'var(--teal-d)', fontSize: '.82rem', fontWeight: 600 }}>{dr.specialization || (dr as any).department?.name || 'Specialist'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BANNER
      ══════════════════════════════════════════ */}
      <div style={{ background: 'linear-gradient(135deg, var(--teal-d) 0%, #0369a1 100%)', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40 }}>
          {[
            { val: '8', label: 'Student Developers' },
            { val: '98%', label: 'Patient Satisfaction (Target)' },
            { val: '10+', label: 'Clinical Departments' },
            { val: '0', label: 'Paper Forms Required' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div className="afya-heading" style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-.05em' }}>{s.val}</div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="tag" style={{ background: 'rgba(13,148,136,.08)', color: 'var(--teal-d)', marginBottom: 16, display: 'inline-flex' }}>FAQ</span>
            <h2 className="afya-heading" style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-.04em', color: 'var(--ink)' }}>Got Questions? We Have Answers.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'Who built AfyaFlow?', a: "AfyaFlow was built by eight third-year Computer Science students at Egerton University as a group project: James Brian Ndung'u, Eric Wambua, Denis Mutuku, Reagan Obadha, Douglas Wafula, Patience Mirenja, Vincent Okoth, and Robert Muchiri. Reach the team at afyaflow@gmail.com or call +254 794 523 302." },
              { q: 'How do I book an appointment?', a: "Click 'Book Appointment', choose your department, select a doctor, pick an available date and time slot (only open slots are shown), and confirm. You'll receive your unique AFYA token instantly — no phone call needed." },
              { q: 'What is the AFYA patient token?', a: 'Your AFYA token (format: AFYA-XXXXXXXXXX) is your unique identifier in the system. It tracks your queue position in real time, links to your prescription records, and stays attached to your appointment history permanently.' },
              { q: 'Can walk-in patients use AfyaFlow?', a: 'Yes. Receptionists register walk-in patients in under 60 seconds. The patient is immediately placed in the correct doctor queue and receives an invitation to create their own online account.' },
              { q: 'Is my medical data secure?', a: 'Absolutely. AfyaFlow uses JWT-secured sessions, BCrypt password hashing, and strict role-based access control. Only clinical staff assigned to your care can access your medical records. Every action is audit-logged.' },
              { q: 'What problem does AfyaFlow solve?', a: 'The endless wait in hospital corridors with no idea when you will be called. AfyaFlow replaces paper cards and manual queues with a fully digital system — patients book online, get a token, and track their position from anywhere.' },
            ].map(faq => (
              <details key={faq.q} style={{ borderRadius: 16, border: '1px solid rgba(13,148,136,.12)', background: 'var(--mist)', padding: '20px 24px', cursor: 'pointer' }}>
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', fontWeight: 700, color: 'var(--ink)', fontSize: '1rem', fontFamily: "'Sora', sans-serif" }}>
                  {faq.q}
                  <ChevronDown style={{ width: 18, height: 18, color: 'var(--teal)', flexShrink: 0, marginLeft: 12 }} />
                </summary>
                <p style={{ marginTop: 14, color: '#64748b', lineHeight: 1.78, fontSize: '.9rem' }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════ */}
      <section id="contact" style={{ padding: '100px 24px', background: 'var(--ink)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tag" style={{ background: 'rgba(20,184,166,.15)', color: 'var(--teal-l)', marginBottom: 16, display: 'inline-flex' }}>Get in Touch</span>
            <h2 className="afya-heading" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-.04em', color: '#fff', lineHeight: 1.15 }}>
              Questions About AfyaFlow?<br /><span className="grad-text">We'd Love to Hear From You.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.55)', maxWidth: 480, margin: '16px auto 0', lineHeight: 1.75 }}>
              Whether you're a patient, a hospital administrator, or a fellow student curious about the project — reach out.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { icon: MapPin, title: 'Hospital Location', body: 'Egerton University\nNakuru, Kenya' },
                { icon: Mail, title: 'Email Us', body: 'afyaflow@gmail.com' },
                { icon: Phone, title: 'Call Us', body: '+254 794 523 302' },
                { icon: GraduationCap, title: 'Institution', body: 'Egerton University\nSchool of Information Technology &amp; Applied Sciences' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(20,184,166,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ color: 'var(--teal-l)', width: 22, height: 22 }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: 4, fontFamily: "'Sora', sans-serif" }}>{title}</p>
                    <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', lineHeight: 1.65, whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: body }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: '44px 40px' }}>
              <h4 className="afya-heading" style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', marginBottom: 28 }}>Send Us a Message</h4>
              <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { type: 'text', placeholder: 'Your Full Name' },
                  { type: 'email', placeholder: 'Email Address' },
                ].map(inp => (
                  <input key={inp.placeholder} type={inp.type} placeholder={inp.placeholder}
                    style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, padding: '14px 18px', color: '#fff', fontSize: '.9rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", width: '100%' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--teal-l)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)')} />
                ))}
                <textarea placeholder="Your message…" rows={5}
                  style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, padding: '14px 18px', color: '#fff', fontSize: '.9rem', outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif", width: '100%' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--teal-l)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)')} />
                <button type="submit"
                  style={{ background: 'linear-gradient(135deg, var(--teal), var(--sky))', border: 'none', borderRadius: 12, padding: '15px', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: "'Sora', sans-serif", boxShadow: '0 6px 20px rgba(13,148,136,.4)' }}>
                  Send Message →
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ background: '#060d1a', padding: '64px 24px 32px', color: 'rgba(255,255,255,.4)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 56 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--teal), var(--sky))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity style={{ color: '#fff', width: 20, height: 20 }} />
                </div>
                <span className="afya-heading" style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-.03em' }}>AfyaFlow</span>
              </div>
              <p style={{ lineHeight: 1.75, maxWidth: 340, fontSize: '.875rem' }}>
                A hospital queue management and appointment scheduling system built by students at Egerton University — proving that smart software can make healthcare better for everyone.
              </p>
            </div>
            <div>
              <h5 className="afya-heading" style={{ color: '#fff', fontWeight: 800, fontSize: '.75rem', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 20 }}>Navigate</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '.875rem', fontWeight: 600 }}>
                {['about', 'services', 'departments', 'team', 'contact'].map(id => (
                  <button key={id} onClick={() => scrollTo(id)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '.875rem', fontWeight: 600, textTransform: 'capitalize', padding: 0, transition: 'color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal-l)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.45)')}>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h5 className="afya-heading" style={{ color: '#fff', fontWeight: 800, fontSize: '.75rem', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 20 }}>Staff Portal</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '.875rem', fontWeight: 600 }}>
                <a href="http://localhost:5174/login" style={{ color: 'var(--teal-l)', textDecoration: 'none', fontWeight: 700 }}>Professional Portal</a>
                <a href="http://localhost:5174/login" style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal-l)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.45)')}>Doctor Login</a>
                <a href="http://localhost:5174/login" style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal-l)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.45)')}>Admin Login</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontSize: '.8rem', fontWeight: 600 }}>
            <p>© {new Date().getFullYear()} AfyaFlow — Egerton University Group Project. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 24 }}>
              <button onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '.8rem' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.4)')}>Privacy Policy</button>
              <button onClick={() => setShowToS(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '.8rem' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.4)')}>Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════
          LEGAL MODALS
      ══════════════════════════════════════════ */}
      {(showToS || showPrivacy) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(10,22,40,.85)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(0,0,0,.35)', overflow: 'hidden' }}>
            <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="afya-heading" style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--ink)' }}>{showToS ? 'Terms of Service' : 'Privacy Statement'}</h2>
              <button onClick={() => { setShowToS(false); setShowPrivacy(false); }}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontSize: '.9rem', lineHeight: 1.75, color: '#64748b' }}>
              {showToS ? (
                <>
                  <p style={{ fontWeight: 700, color: 'var(--ink)' }}>By using AfyaFlow, you agree to the following terms:</p>
                  {[
                    ['1. Medical Services', 'AfyaFlow is a hospital management platform. Appointments are subject to doctor availability and hospital policies. Emergency cases should proceed directly to the ER.'],
                    ['2. User Accounts', 'Users are responsible for maintaining the confidentiality of their login credentials. Any activity under your account is your responsibility.'],
                    ['3. Cancellation Policy', 'Appointments should be cancelled at least 2 hours in advance. Repeated no-shows may result in temporary suspension of booking privileges.'],
                    ['4. Liability', 'While we strive for 100% uptime, AfyaFlow is not liable for system outages that may delay booking confirmations.'],
                  ].map(([h, b]) => <div key={h}><h4 style={{ color: 'var(--ink)', fontWeight: 800, marginBottom: 6 }}>{h}</h4><p>{b}</p></div>)}
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 700, color: 'var(--ink)' }}>Your privacy is our priority. Here is how we handle your data:</p>
                  {[
                    ['1. Data Collection', 'We collect personal information such as name, contact details, and date of birth to facilitate medical registration and appointment booking.'],
                    ['2. Medical Records', 'Your medical history, prescriptions, and consultation notes are strictly confidential and only accessible by authorized medical personnel assigned to your care.'],
                    ['3. Data Security', 'We use JWT-secured sessions and BCrypt password hashing. Role-based access control ensures only authorized staff can view records.'],
                    ['4. Third-Party Sharing', 'We do not sell your personal or medical data to third parties. Data may only be shared with insurance providers upon your explicit written authorization.'],
                  ].map(([h, b]) => <div key={h}><h4 style={{ color: 'var(--ink)', fontWeight: 800, marginBottom: 6 }}>{h}</h4><p>{b}</p></div>)}
                </>
              )}
            </div>
            <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowToS(false); setShowPrivacy(false); }}
                style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--teal), var(--sky))', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}