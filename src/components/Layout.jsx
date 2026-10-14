import { useState } from "react";
import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
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
  Wallet,
  Menu,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { enrollmentsFor } from "../services/db";
import Modal from "./Modal";
import "./Layout.css";
export function Brand() {
  return (
    <div className="brand">
      <img src={logo} alt="" style={{ width: "100px", objectFit: "cover" }} />
    </div>
  );
}
export default function Layout() {
  const { data, user, logout } = useApp();
  const go = useNavigate();
  const [confirm, setConfirm] = useState(false),
    [menu, setMenu] = useState(false),
    [expanded, setExpanded] = useState(true);
  if (!user) return <Navigate to="/login" replace />;
  const admin = user.role === "admin";
  const links = admin
    ? [
        ["/admin", LayoutDashboard, "Umumiy ko‘rinish"],
        ["/admin/lessons", Clapperboard, "Kurslar va darslar"],
        ["/admin/students", Users, "Talabalar"],
        ["/admin/finance", Wallet, "Moliya"],
        ["/admin/reviews", ClipboardCheck, "Amaliy ishlar"],
        ["/admin/support", MessageSquare, "Murojaatlar"],
      ]
    : [
        ["/student", BookOpen, "Mening kurslarim"],
        ["/student/certificate", Award, "Sertifikatlar"],
        ["/student/support", Headphones, "Yordam"],
      ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="mobile-menu ghost"
          onClick={() => setMenu(!menu)}
          aria-label="Menyu"
        >
          <Menu />
        </button>
        <Brand />
        <div className="header-account">
          <span>{user.name}</span>
          <button className="secondary" onClick={() => setConfirm(true)}>
            <LogOut size={22} /> Log out
          </button>
        </div>
      </header>
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <p className="nav-label">{admin ? "ADMIN PANEL" : "O‘QUVCHI PANELI"}</p>
        <nav>
          {links.map(([to, Icon, label]) => (
            <div key={to}>
              <NavLink
                end
                to={to}
                onClick={() => {
                  setMenu(false);
                  if (to === "/student") setExpanded(true);
                }}
              >
                <Icon size={22} />
                {label}
              </NavLink>
              {to === "/student" && (
                <>
                  <button
                    className="text-btn course-toggle"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? "Kurslarni yashirish" : "Kurslarni ko‘rsatish"}
                  </button>
                  {expanded && (
                    <div className="subnav">
                      {enrollmentsFor(data, user.id).map((e) => (
                        <NavLink
                          key={e.id}
                          to={"/student/course/" + e.courseId}
                          onClick={() => setMenu(false)}
                        >
                          {data.courses.find((c) => c.id === e.courseId)
                            ?.title || "Kurs"}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="badge">Demo rejim</span>
          <p>Bilim sari yangi qadam.</p>
        </div>
      </aside>
      <div className="main-wrap">
        <main>
          <Outlet />
        </main>
        <footer>© {new Date().getFullYear()} AI Academy</footer>
      </div>
      {confirm && (
        <Modal
          title="Hisobdan chiqmoqchimisiz?"
          onClose={() => setConfirm(false)}
        >
          <p>Chiqishni tasdiqlaysizmi?</p>
          <div className="button-row">
            <button className="secondary" onClick={() => setConfirm(false)}>
              Yo‘q, qolaman
            </button>
            <button
              className="primary"
              onClick={() => {
                logout();
                go("/login", { replace: true });
              }}
            >
              Ha, chiqish
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
