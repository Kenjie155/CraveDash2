import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const links = [
  ['/', 'Dashboard'], ['/orders', 'Orders'], ['/restaurants', 'Restaurants'], ['/menu-items', 'Menu items'],
  ['/categories', 'Categories'], ['/riders', 'Riders'], ['/customers', 'Customers'],
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('cravedash-admin-theme', next); } catch { /* ignore */ }
    setDark(!dark);
  };
  return (
    <div className="shell">
      <aside className={open ? 'side open' : 'side'}>
        <div className="brand">CraveDash <span>Admin</span></div>
        <nav onClick={() => setOpen(false)}>
          {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
        </nav>
        <button className="ghost" onClick={toggleTheme}>{dark ? '☀️ Light mode' : '🌙 Dark mode'}</button>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>Log out</button>
      </aside>
      <main>
        <button className="menu-btn ghost" onClick={() => setOpen(!open)} aria-label="Toggle menu">☰ Menu</button>
        <Outlet />
      </main>
    </div>
  );
}
