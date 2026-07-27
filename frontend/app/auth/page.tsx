"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, BellRing, CheckCircle2, LockKeyhole, Radar, ShieldCheck } from 'lucide-react';

const trustItems = [
  { icon: <Radar size={18} />, label: 'Live probes' },
  { icon: <BellRing size={18} />, label: 'Smart alerts' },
  { icon: <ShieldCheck size={18} />, label: 'Secure access' },
];

export default function AuthPage() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();

  // Стейт для даних форм
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Функція для оновлення полів
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Реєстрація
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (res.ok) {
        alert("Реєстрація успішна! Тепер увійдіть.");
        setIsActive(false); // Перемикаємо на форму логіну
      } else {
        const error = await res.json();
        alert(error.message || "Помилка реєстрації");
      }
    } catch {
      alert("Сервер не відповідає");
    }
  };

  // Логін
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token); // Зберігаємо токен
        router.push('/dashboard'); // Перенаправляємо на дашборд
      } else {
        alert(data.message || "Невірний логін або пароль");
      }
    } catch {
      alert("Сервер не відповідає");
    }
  };

  return (
    <div className="auth-body">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className={`auth-wrapper ${isActive ? "panel-active" : ""}`} id="authWrapper">
        <div className="auth-brand-pill">
          <Activity size={17} />
          <span>PulseGuard Console</span>
        </div>
        
        {/* Форма реєстрації */}
        <div className="auth-form-box register-form-box">
          <form onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <p className="py-4 text-slate-400">Join PulseGuard to monitor your APIs</p>
            
            <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" required onChange={handleChange} />
            <div className="auth-strength">
              <span />
              <span />
              <span className={formData.password.length >= 8 ? 'active' : ''} />
            </div>
            <p className="auth-hint">Use 8+ characters for a stronger account.</p>
            
            <button type="submit">Sign Up</button>
            
            <div className="mobile-switch md:hidden mt-4">
              <p className="text-sm text-slate-400">Already have an account?</p>
              <button type="button" className="text-indigo-400 font-bold" onClick={() => setIsActive(false)}>
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* Форма входу */}
        <div className="auth-form-box login-form-box">
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <p className="py-4 text-slate-400">Welcome back to PulseGuard</p>
            
            <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" required onChange={handleChange} />
            <div className="auth-security-note">
              <LockKeyhole size={15} />
              Secure session for creating monitors and viewing incidents.
            </div>
            
            <button type="submit">Sign In</button>

            <div className="mobile-switch md:hidden mt-4">
              <p className="text-sm text-slate-400">Don&apos;t have an account?</p>
              <button type="button" className="text-indigo-400 font-bold" onClick={() => setIsActive(true)}>
                Sign Up
              </button>
            </div>
          </form>
        </div>

        {/* Слайд-панель */}
        <div className="slide-panel-wrapper">
          <div className="slide-panel">
            <div className="panel-content panel-content-left">
              <h1>Welcome Back!</h1>
              <p>Stay connected by logging in with your credentials</p>
              <div className="panel-mini-grid">
                {trustItems.map((item) => (
                  <span key={item.label}>{item.icon}{item.label}</span>
                ))}
              </div>
              <button type="button" className="transparent-btn" onClick={() => setIsActive(false)}>
                Sign In
              </button>
            </div>
            <div className="panel-content panel-content-right">
              <h1>Hey There!</h1>
              <p>Create monitors, receive alerts, and track uptime.</p>
              <div className="panel-status-card">
                <CheckCircle2 size={18} />
                <div>
                  <strong>99.98% uptime</strong>
                  <small>Last 30 days</small>
                </div>
              </div>
              <button type="button" className="transparent-btn" onClick={() => setIsActive(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
