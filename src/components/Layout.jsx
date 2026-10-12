import { NavLink, Outlet, Navigate } from "react-router-dom";
import tat from '../assets/ittat.png'
import {
  BookOpen,
  Award,
  Headphones,
  LogOut,
  LayoutDashboard,
  Users,
  Clapperboard,
  ClipboardCheck,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import "./Layout.css";
export function Brand() {
  return (
    <div className="brand">
       <img src={tat} alt="" style={{width: '100px'}} />
    </div>
  );
}
export default function Layout() {
  const { user, logout } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  const admin = user.role === "admin";
  const links = admin
    ? [
        ["/admin", LayoutDashboard, "Umumiy ko‘rinish"],
        ["/admin/lessons", Clapperboard, "Darslar va testlar"],
        ["/admin/students", Users, "O‘quvchilar"],
        ["/admin/reviews", ClipboardCheck, "Vazifalar"],
        ["/admin/support", MessageSquare, "Murojaatlar"],
      ]
    : [
        ["/student", BookOpen, "Mening kursim"],
        ["/student/certificate", Award, "Sertifikat"],
        ["/student/support", Headphones, "Qo‘llab-quvvatlash"],
      ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="nav-label">
          {admin ? "BOSHQARUV PANELI" : "O‘QUV PLATFORMASI"}
        </div>
        <nav>
          {links.map(([to, Icon, title]) => (
            <NavLink end key={to} to={to}>
              <Icon size={19} />
              <span>{title}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {!admin && (
            <div className="mini-card">
              <span>Har kuni bir qadam ✦</span>
              <p>Katta natijalar kichik qadamlardan boshlanadi.</p>
              <BookOpen size={25} />
            </div>
          )}
          <div className="account">
            <div className="avatar">{user.name[0]}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>
          <button className="logout" onClick={logout}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <span>O‘rganing. Yarating. O‘sing.</span>
          <div>
            <span className="mode-dot" /> Demo platforma{" "}
            <span className="top-avatar">{user.name[0]}</span>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer>
          © {new Date().getFullYear()} AI Academy{" "}
          <span>
            Kelajak bugundan boshlanadi <ArrowUpRight size={13} />
          </span>
        </footer>
      </div>
    </div>
  );
}
