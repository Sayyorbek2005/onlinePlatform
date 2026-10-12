# Kurslar va talabalar — v3

Admin bosh sahifasi va Darslar sahifasida Yangi dars yonida Yangi kurs mavjud. Kurs nomi, butun so‘mdagi narxi va tavsifini kiriting. Kurslar ro‘yxatidan tahrirlash mumkin. Yangi dars yaratishda kursni tanlang.

O‘quvchi qo‘shishda kursni tanlang: uning kurs narxi shaxsiy to‘lov hisobiga ko‘chadi. Saqlashdan so‘ng /admin/students/:id sahifasi avtomatik ochiladi. Keyin ro‘yxatdagi ismni bosib kirasiz. O‘quvchilar soniga dasturiy limit yo‘q; demo saqlash hajmi brauzer kvotasiga bog‘liq.

Bu versiyada har bir talaba bitta kursga biriktiriladi. Kursdagi darslar va 70% dan yuqori test orqali keyingi darsni ochish boshqa kurslardan ajratilgan. Kurs narxini o‘zgartirish avvalgi talabalar bilan kelishilgan narxni o‘zgartirmaydi. To‘lov yozuvi mavjud talabaning kursini almashtirish bloklangan — to‘lov boshqa kursga tasodifan o‘tmaydi. Shaxsiy sahifada kelishilgan narxni tahrirlash mumkin.

Avvalgi o‘quvchi/darslar avtomatik AI kursiga biriktiriladi, ma’lumotlar o‘chmaydi. Supabase hali ulanmagan, brauzer demo rejimi.

ZIPdagi src papkasini loyihangizdagi src o‘rniga qo‘ying. npm start; deploy: npm run build. Paketlar o‘zgarmagan.

Tekshiruv: CRA production build, no-undef tekshiruvi, kursga kirishni ajratish va eski ma’lumot migratsiyasi. Interaktiv browser QA bajarilmadi.

# Barcha JSX, CSS va JS kodlari

## src/App.jsx

```jsx
import { Routes, Route, Navigate, Outlet, Link } from "react-router-dom";
import { useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Course from "./pages/Course";
import Lesson from "./pages/Lesson";
import Certificate from "./pages/Certificate";
import Support from "./pages/Support";
import Admin from "./pages/Admin";
import AdminLessons from "./pages/AdminLessons";
import AdminStudents from "./pages/AdminStudents";
import AdminReviews from "./pages/AdminReviews";
import AdminSupport from "./pages/AdminSupport";
import StudentDetail from "./pages/StudentDetail";
function Protected({ role }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role)
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />
    );
  return <Outlet />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<Protected role="student" />}>
        <Route path="/student" element={<Layout />}>
          <Route index element={<Course />} />
          <Route path="lesson/:id" element={<Lesson />} />
          <Route path="certificate" element={<Certificate />} />
          <Route path="support" element={<Support />} />
        </Route>
      </Route>
      <Route element={<Protected role="admin" />}>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Admin />} />
          <Route path="lessons" element={<AdminLessons />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="students/:studentId" element={<StudentDetail />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="support" element={<AdminSupport />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <div className="empty">
            <h1>404</h1>
            <p>Sahifa topilmadi.</p>
            <Link to="/login">Bosh sahifaga qaytish</Link>
          </div>
        }
      />
    </Routes>
  );
}

```

## src/components/CourseManager.jsx

```jsx
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { uid } from "../services/db";
export default function CourseManager() {
  const { data, update, notify } = useApp();
  const [draft, setDraft] = useState(null);
  function save(e) {
    e.preventDefault();
    const title = draft.title.trim(),
      price = Number(draft.price);
    if (title.length < 2 || !Number.isSafeInteger(price) || price < 0)
      return notify("Kurs nomi va narxini to‘g‘ri kiriting.");
    if (
      data.courses.some(
        (c) =>
          c.id !== draft.id && c.title.toLowerCase() === title.toLowerCase(),
      )
    )
      return notify("Bu nomdagi kurs mavjud.");
    if (
      update((d) => {
        const i = d.courses.findIndex((c) => c.id === draft.id);
        const course = { ...draft, title, price };
        if (i < 0) d.courses.push(course);
        else d.courses[i] = course;
      })
    ) {
      setDraft(null);
      notify("Kurs saqlandi.");
    }
  }
  return (
    <>
      <button
        className="secondary"
        onClick={() =>
          setDraft({ id: uid(), title: "", price: "", description: "" })
        }
      >
        + Yangi kurs
      </button>
      <details className="course-manager">
        <summary>Kurslar ({data.courses.length})</summary>
        {data.courses.map((c) => (
          <div className="row" key={c.id}>
            <span>
              {c.title} · {Number(c.price).toLocaleString("uz-UZ")} so‘m ·{" "}
              {
                data.users.filter(
                  (u) => u.role === "student" && u.courseId === c.id,
                ).length
              }{" "}
              talaba
            </span>
            <button className="secondary" onClick={() => setDraft({ ...c })}>
              Tahrirlash
            </button>
          </div>
        ))}
      </details>
      {draft && (
        <div className="modal-backdrop">
          <section
            className="modal narrow"
            role="dialog"
            aria-modal="true"
            aria-label="Kurs yaratish"
          >
            <div className="row">
              <h2>Kurs ma’lumotlari</h2>
              <button className="ghost" onClick={() => setDraft(null)}>
                ×
              </button>
            </div>
            <form onSubmit={save}>
              <label>
                Kurs nomi
                <input
                  required
                  minLength={2}
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </label>
              <label>
                Narxi (so‘m)
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={draft.price}
                  onChange={(e) =>
                    setDraft({ ...draft, price: e.target.value })
                  }
                />
              </label>
              <label>
                Tavsif
                <textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </label>
              <p className="muted small">
                Narx o‘zgarishi avval qo‘shilgan talabalar kelishilgan narxini
                o‘zgartirmaydi.
              </p>
              <button className="primary">Saqlash</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

```

## src/components/Layout.css

```css
.app-shell {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 246px;
  background: #fff;
  border-right: 1px solid var(--line);
  padding: 36px 22px 20px;
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0 auto 0 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.6px;
}
.brand > span {
  background: var(--purple);
  color: white;
  border-radius: 10px;
  padding: 8px 7px;
  font-size: 15px;
  box-shadow: 0 4px 12px #6738ee30;
}
.brand i {
  color: var(--purple);
  font-style: normal;
}
.nav-label {
  font-size: 10px;
  letter-spacing: 1.3px;
  color: #9993ac;
  margin: 45px 10px 17px;
}
.sidebar nav {
  display: grid;
  gap: 8px;
}
.sidebar nav a {
  display: flex;
  gap: 12px;
  align-items: center;
  color: #77718a;
  padding: 13px 12px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
}
.sidebar nav a.active {
  color: var(--purple);
  background: #ede7ff;
}
.sidebar-bottom {
  margin-top: auto;
}
.mini-card {
  padding: 18px;
  background: #f7f4ff;
  border: 1px solid #eee7ff;
  border-radius: 12px;
  margin: 30px 0;
}
.mini-card span {
  font-size: 12px;
  font-weight: 700;
}
.mini-card p {
  font-size: 11px;
  line-height: 1.8;
  color: var(--muted);
}
.mini-card svg {
  color: var(--purple);
}
.account {
  display: flex;
  gap: 9px;
  align-items: center;
  border-top: 1px solid var(--line);
  padding-top: 22px;
}
.avatar,
.top-avatar {
  background: #e9defe;
  color: #6033bd;
  display: grid;
  place-items: center;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-weight: 700;
}
.account strong {
  display: block;
  font-size: 11px;
}
.account small {
  font-size: 10px;
  color: var(--muted);
}
.logout {
  background: none;
  color: #b55c68;
  font-size: 12px;
  padding: 20px 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.main-wrap {
  margin-left: 246px;
  flex: 1;
  min-width: 0;
}
.topbar {
  height: 81px;
  background: #ffffffb5;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 43px;
  color: var(--muted);
  font-size: 12px;
}
.topbar > div {
  display: flex;
  gap: 10px;
  align-items: center;
}
.top-avatar {
  width: 31px;
  height: 31px;
  margin-left: 15px;
}
.mode-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a995e7;
}
main {
  max-width: 1200px;
  margin: auto;
  padding: 38px 43px 50px;
  min-height: calc(100vh - 140px);
}
footer {
  display: flex;
  justify-content: space-between;
  padding: 18px 43px;
  font-size: 10px;
  color: #9a94a7;
}
footer span {
  display: flex;
  align-items: center;
  gap: 5px;
}
@media (max-width: 800px) {
  .sidebar {
    position: relative;
    width: 100%;
    padding: 16px;
  }
  .app-shell {
    display: block;
  }
  .nav-label,
  .mini-card,
  .account {
    display: none;
  }
  .sidebar nav {
    display: flex;
    overflow: auto;
    margin-top: 20px;
    gap: 4px;
  }
  .sidebar nav a {
    white-space: nowrap;
    font-size: 11px;
    padding: 10px;
  }
  .sidebar-bottom {
    position: absolute;
    right: 20px;
    top: 0;
  }
  .logout {
    padding: 20px 0;
  }
  .main-wrap {
    margin: 0;
  }
  .topbar {
    height: 55px;
    padding: 0 20px;
  }
  main {
    padding: 25px 18px;
  }
  .topbar > span {
    font-size: 10px;
  }
  footer {
    padding: 18px;
  }
}

```

## src/components/Layout.jsx

```jsx
import { NavLink, Outlet, Navigate } from "react-router-dom";
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
      <span>AI</span> AI Academy<i>•</i>
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

```

## src/context/AppContext.jsx

```jsx
import { createContext, useContext, useRef, useState } from "react";
import { read, write } from "../services/db";
const Context = createContext(null);
const KEY = "academy-user";
export function AppProvider({ children }) {
  const [data, setData] = useState(read);
  const current = useRef(data);
  const [session, setSession] = useState(
    () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY),
  );
  const [notice, setNotice] = useState("");
  const user = data.users.find((u) => u.id === session && u.active);
  function update(callback) {
    try {
      const next = structuredClone(current.current);
      callback(next);
      write(next);
      current.current = next;
      setData(next);
      return true;
    } catch (error) {
      setNotice(error.message || "Ma’lumot saqlanmadi.");
      return false;
    }
  }
  function login(email, password, remember = true) {
    const account = current.current.users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password &&
        u.active,
    );
    if (!account)
      throw Error("Email yoki parol noto‘g‘ri, yoki hisob bloklangan.");
    write(current.current);
    (remember ? localStorage : sessionStorage).setItem(KEY, account.id);
    (remember ? sessionStorage : localStorage).removeItem(KEY);
    setSession(account.id);
    setNotice("");
    return account;
  }
  function logout() {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    setSession(null);
    setNotice("");
  }
  return (
    <Context.Provider
      value={{ data, user, update, login, logout, notify: setNotice }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Yopish">
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);

```

## src/index.css

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
:root {
  font-family: Inter, Arial, sans-serif;
  color: #292235;
  background: #f8f7fc;
  font-synthesis: none;
  --purple: #6838ec;
  --muted: #92889f;
  --line: #eeeaf4;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
button,
input,
select,
textarea {
  font: inherit;
}
button,
a,
input,
textarea,
select {
  -webkit-tap-highlight-color: transparent;
}
button {
  cursor: pointer;
  border: 0;
  border-radius: 7px;
}
button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
a {
  text-decoration: none;
  color: inherit;
}
button,
a {
  transition:
    background 0.18s,
    box-shadow 0.18s,
    transform 0.18s;
}
a:hover {
  color: var(--purple);
}
button:hover:not(:disabled) {
  filter: brightness(0.97);
}
input,
textarea,
select {
  width: 100%;
  background: #fbfaff;
  border: 1px solid #e8e2f0;
  border-radius: 7px;
  padding: 12px;
  color: #453b52;
  font-size: 12px;
}
input::placeholder,
textarea::placeholder {
  color: #aaa1b6;
}
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid #b497f1;
  outline-offset: 1px;
}
textarea {
  resize: vertical;
  min-height: 115px;
  line-height: 1.7;
}
button:focus-visible,
a:focus-visible {
  outline: 3px solid #b69be8;
  outline-offset: 3px;
}
.primary {
  background: linear-gradient(105deg, #7543f2, #6230e5);
  color: white;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 18px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 7px;
  box-shadow: 0 3px 7px #6638e419;
}
.primary:hover {
  color: white;
  box-shadow: 0 5px 15px #6738ee25;
}
.secondary {
  background: #eee8fa;
  color: #7149ac;
  padding: 12px 16px;
  font-size: 12px;
}
.compact {
  padding: 10px 13px;
  font-size: 10px;
  white-space: nowrap;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.page-heading h1 {
  font-size: 29px;
  letter-spacing: -1px;
  margin: 10px 0;
}
.page-heading p {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.8;
  margin: 0;
}
.page-heading .eyebrow {
  font-size: 8px;
}
.pill {
  display: flex;
  gap: 7px;
  align-items: center;
  background: white;
  border: 1px solid var(--line);
  border-radius: 30px;
  font-size: 10px;
  color: #8b759e;
  padding: 10px 14px;
}
.panel {
  background: white;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.purple {
  color: var(--purple);
}
.muted {
  color: var(--muted);
}
.small {
  font-size: 10px;
}
.badge {
  display: inline-flex;
  font-size: 9px;
  white-space: nowrap;
  padding: 5px 8px;
  border-radius: 5px;
  background: #f0eafc;
  color: #8a67af;
}
.badge.green {
  color: #31915d;
  background: #eaf7ef;
}
.empty {
  padding: 60px 25px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}
.empty a {
  color: var(--purple);
}
.error {
  color: #bf526a !important;
  background: #fff0f3;
  padding: 12px;
  border-radius: 7px;
  font-size: 12px !important;
}
.toast {
  position: fixed;
  bottom: 25px;
  right: 25px;
  max-width: calc(100vw - 40px);
  background: #31223f;
  color: white;
  padding: 15px 20px;
  border-radius: 10px;
  font-size: 12px;
  box-shadow: 0 8px 40px #20103130;
  z-index: 50;
  display: flex;
  gap: 15px;
  align-items: center;
}
.toast button {
  background: none;
  color: white;
  font-size: 20px;
}
.ghost {
  background: #f4effa;
  color: #846e9d;
  padding: 4px 12px;
  font-size: 24px;
}
.section-title {
  font-size: 16px;
  margin-top: 30px;
}
h1,
h2,
h3 {
  overflow-wrap: anywhere;
}
@media (max-width: 600px) {
  .page-heading {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .page-heading h1 {
    font-size: 25px;
  }
  .page-heading p {
    font-size: 11px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}

```

## src/index.jsx

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./index.css";
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </BrowserRouter>,
);

```

## src/pages/Admin.css

```css
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 17px;
  margin: 28px 0;
}
.stat {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stat svg {
  color: var(--purple);
}
.stat strong {
  font-size: 30px;
  letter-spacing: -1px;
}
.stat span {
  font-size: 11px;
  color: var(--muted);
}
.table-panel {
  padding: 23px;
}
.table-panel h3 {
  font-size: 15px;
}
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 12px;
}
th {
  font-size: 10px;
  letter-spacing: 0.3px;
  color: #9790a5;
  font-weight: 500;
  padding: 18px 10px;
  border-bottom: 1px solid var(--line);
}
td {
  padding: 20px 10px;
  border-bottom: 1px solid #f1edf6;
}
td small {
  display: block;
  color: var(--muted);
  font-size: 10px;
  margin-top: 6px;
}
td .progress {
  min-width: 90px;
}
.admin-note {
  padding: 24px;
  background: #eee8fc;
  display: flex;
  gap: 19px;
  align-items: center;
  border-radius: 12px;
  margin-top: 25px;
  color: #7757a6;
}
.admin-note strong {
  font-size: 13px;
}
.admin-note p {
  font-size: 11px;
  line-height: 1.8;
}
.admin-note a {
  margin-left: auto;
}
.admin-lessons {
  display: grid;
  gap: 14px;
  margin-top: 28px;
}
.admin-lesson {
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 17px;
}
.admin-lesson h3 {
  font-size: 14px;
  margin: 0;
}
.admin-lesson p {
  font-size: 11px;
  color: var(--muted);
}
.grow {
  flex: 1;
}
.actions {
  display: flex;
  gap: 6px;
}
.actions button {
  padding: 8px;
  background: #f5f2fb;
  color: #8b77ac;
  display: grid;
  place-items: center;
}
.actions .danger {
  color: #c46778;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: #20133170;
  z-index: 10;
  padding: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.modal {
  background: white;
  width: 680px;
  max-height: 92vh;
  overflow: auto;
  border-radius: 16px;
  padding: 29px;
  box-shadow: 0 30px 100px #21113340;
}
.modal.narrow {
  width: 450px;
}
.modal h2 {
  font-size: 21px;
}
.modal form > label,
.review label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin: 18px 0;
}
.modal label input,
.modal label textarea,
.modal label select,
.review label textarea {
  margin-top: 8px;
}
.modal form > .primary {
  margin-top: 20px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  font-size: 12px;
}
.question-editor {
  background: #f8f6fc;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  margin: 15px 0;
}
.question-editor strong {
  font-size: 12px;
}
.question-editor > label {
  display: block;
  font-size: 11px;
  margin-top: 15px;
}
.question-editor .option-editor {
  display: flex;
  align-items: center;
  gap: 10px;
}
.option-editor input[type="radio"] {
  width: 15px;
  accent-color: var(--purple);
}
.question-editor small {
  font-size: 9px;
  color: var(--muted);
}
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 25px 0;
  max-width: 440px;
  color: #9287a4;
}
.review {
  padding: 25px;
  margin: 20px 0;
}
.review h3 {
  font-size: 14px;
  margin: 0;
}
.review p {
  font-size: 12px;
  color: var(--muted);
}
.answer-text {
  background: #f8f6fb;
  border: 1px solid var(--line);
  padding: 20px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.8;
  margin: 22px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.button-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.review form > .primary {
  margin-top: 15px;
}
@media (max-width: 1000px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .admin-lesson {
    flex-wrap: wrap;
  }
  .admin-lesson .actions {
    margin-left: 50px;
  }
  .modal-backdrop {
    padding: 10px;
  }
  .modal {
    padding: 20px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .table-panel {
    padding: 15px;
  }
  .stats {
    gap: 10px;
  }
  .stat {
    padding: 17px;
  }
}

.course-manager {
  font-size: 12px;
  max-width: 400px;
}
.course-manager summary {
  cursor: pointer;
  padding: 12px;
}
.course-manager .row {
  padding: 10px;
  border-bottom: 1px solid var(--line);
}

```

## src/pages/Admin.jsx

```jsx
import CourseManager from "../components/CourseManager";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { completed } from "../services/db";
import "./Admin.css";
export default function Admin() {
  const { data } = useApp();
  const students = data.users.filter((u) => u.role === "student");
  const lessons = data.lessons.filter((l) => l.published);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">AI ACADEMY · ADMIN</div>
          <h1>Umumiy ko‘rinish</h1>
          <p>Ta’lim jarayoni va o‘quvchilar natijalari bir joyda.</p>
        </div>
        <div className="button-row">
          <CourseManager />
          <Link className="primary" to="/admin/lessons">
            + Dars qo‘shish
          </Link>
        </div>
      </div>
      <div className="stats">
        {[
          [Users, "O‘quvchilar", students.length, "/admin/students"],
          [
            BookOpen,
            "E’lon qilingan darslar",
            lessons.length,
            "/admin/lessons",
          ],
          [
            ClipboardCheck,
            "Kutilayotgan vazifalar",
            data.submissions.filter((s) => s.status === "pending").length,
            "/admin/reviews",
          ],
          [
            MessageSquare,
            "Yangi murojaatlar",
            data.tickets.filter((t) => !t.reply).length,
            "/admin/support",
          ],
        ].map(([Icon, title, n, to]) => (
          <Link className="panel stat" to={to} key={title}>
            <Icon size={21} />
            <strong>{n}</strong>
            <span>{title}</span>
          </Link>
        ))}
      </div>
      <section className="panel table-panel">
        <div className="row">
          <h3>O‘quvchilar progressi</h3>
          <Link className="purple small" to="/admin/students">
            Barchasi →
          </Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>O‘quvchi</th>
                <th>Holat</th>
                <th>Yakunlangan darslar</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {students.map((u) => {
                const n = lessons.filter(
                  (l) =>
                    l.courseId === u.courseId && completed(data, u.id, l.id),
                ).length;
                return (
                  <tr key={u.id}>
                    <td>
                      <Link className="purple" to={"/admin/students/" + u.id}>
                        <strong>{u.name} →</strong>
                      </Link>
                      <small>{u.email}</small>
                    </td>
                    <td>
                      <span className={"badge " + (u.active ? "green" : "")}>
                        {u.active ? "Faol" : "Bloklangan"}
                      </span>
                    </td>
                    <td>
                      {n}/
                      {lessons.filter((l) => l.courseId === u.courseId).length}
                    </td>
                    <td>
                      <div className="progress">
                        <i
                          style={{
                            width:
                              (lessons.length
                                ? (n /
                                    (lessons.filter(
                                      (l) => l.courseId === u.courseId,
                                    ).length || 1)) *
                                  100
                                : 0) + "%",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <div className="admin-note">
        <BookOpen size={22} />
        <div>
          <strong>Kursingizni ishga tushiring</strong>
          <p>
            Darsga video yuklang, test kiriting va e’lon qiling. O‘quvchilar
            vazifalarini “Vazifalar” bo‘limida tekshiring.
          </p>
        </div>
        <Link to="/admin/lessons">
          <ArrowRight size={20} />
        </Link>
      </div>
    </>
  );
}

```

## src/pages/AdminLessons.jsx

```jsx
import CourseManager from "../components/CourseManager";
import { useState } from "react";
import { Pencil, Trash2, Plus, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import { uid, putFile } from "../services/db";
import "./Admin.css";
const blank = () => ({
  id: uid(),
  title: "",
  description: "",
  duration: 15,
  task: "",
  video: "",
  fileId: "",
  published: false,
  questions: [],
});
export default function AdminLessons() {
  const { data, update, notify } = useApp();
  const [draft, setDraft] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function edit(l) {
    setDraft(structuredClone(l));
    setFile(null);
    setError("");
  }
  function field(k, v) {
    setDraft({ ...draft, [k]: v });
  }
  function question(id, k, v) {
    setDraft({
      ...draft,
      questions: draft.questions.map((q) =>
        q.id === id ? { ...q, [k]: v } : q,
      ),
    });
  }
  async function save(e) {
    e.preventDefault();
    setError("");
    if (!data.courses.some((c) => c.id === draft.courseId)) {
      setError("Kursni tanlang.");
      return;
    }
    if (draft.video && !/^https:\/\//i.test(draft.video)) {
      setError("Video manzili https:// bilan boshlanishi kerak.");
      return;
    }
    if (
      file &&
      (!file.type.startsWith("video/") || file.size > 200 * 1024 * 1024)
    ) {
      setError("200 MB gacha video fayl tanlang.");
      return;
    }
    if (draft.published && !draft.questions.length) {
      setError("Faol dars uchun kamida bitta test savoli kiriting.");
      return;
    }
    setBusy(true);
    try {
      const next = {
        ...draft,
        title: draft.title.trim(),
        duration: Number(draft.duration),
      };
      if (file) {
        next.fileId = await putFile(file);
        next.video = "";
      }
      update((d) => {
        const i = d.lessons.findIndex((l) => l.id === next.id);
        if (i < 0) d.lessons.push(next);
        else d.lessons[i] = next;
      });
      setDraft(null);
      notify("Dars saqlandi.");
    } catch {
      setError(
        "Fayl saqlanmadi. Brauzer xotirasi yoki fayl hajmini tekshiring.",
      );
    } finally {
      setBusy(false);
    }
  }
  function remove(l) {
    if (
      !confirm("“" + l.title + "” darsi o‘chirilsinmi? Test tarixi saqlanadi.")
    )
      return;
    update((d) => {
      d.lessons = d.lessons.filter((x) => x.id !== l.id);
      d.submissions = d.submissions.filter((x) => x.lessonId !== l.id);
      // Topshirilgan testlar tarixini saqlab qolamiz.
      Object.keys(d.testSessions).forEach((k) => {
        if (d.testSessions[k].lessonId === l.id) delete d.testSessions[k];
      });
      Object.values(d.progress).forEach((p) => delete p[l.id]);
    });
  }
  function move(i, by) {
    update((d) => {
      const j = i + by;
      if (j < 0 || j >= d.lessons.length) return;
      [d.lessons[i], d.lessons[j]] = [d.lessons[j], d.lessons[i]];
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Darslar va testlar</h1>
          <p>Video, amaliy vazifa va testlarni boshqaring.</p>
        </div>
        <div className="button-row">
          <CourseManager />
          <button
            className="primary"
            onClick={() =>
              edit({ ...blank(), courseId: data.courses[0]?.id || "" })
            }
          >
            <Plus size={16} /> Yangi dars
          </button>
        </div>
      </div>
      <div className="admin-lessons">
        {data.lessons.map((l, i) => (
          <article className="panel admin-lesson" key={l.id}>
            <span className="lesson-number">{i + 1}</span>
            <div className="grow">
              <h3>{l.title}</h3>
              <small>
                {data.courses.find((c) => c.id === l.courseId)?.title}
              </small>
              <p>
                {l.duration} daqiqa · {l.questions.length} ta savol ·{" "}
                {l.fileId || l.video ? "Video bor" : "Video yo‘q"}
              </p>
              <span className={"badge " + (l.published ? "green" : "")}>
                {l.published ? "Faol" : "Nofaol"}
              </span>
            </div>
            <div className="actions">
              <button
                type="button"
                onClick={() => {
                  if (!l.published && !l.questions.length) {
                    notify("Avval test kiriting.");
                    return;
                  }
                  update((d) => {
                    const item = d.lessons.find((x) => x.id === l.id);
                    item.published = !item.published;
                  });
                }}
              >
                {l.published ? "Nofaollash" : "Faollash"}
              </button>
              <button
                aria-label="Yuqoriga"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp size={15} />
              </button>
              <button
                aria-label="Pastga"
                disabled={i === data.lessons.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown size={15} />
              </button>
              <button aria-label="Tahrirlash" onClick={() => edit(l)}>
                <Pencil size={15} />
              </button>
              <button
                aria-label="O‘chirish"
                className="danger"
                onClick={() => remove(l)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {draft && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            className="modal"
          >
            <div className="row">
              <h2 id="edit-title">Darsni sozlash</h2>
              <button
                disabled={busy}
                className="ghost"
                onClick={() => setDraft(null)}
                aria-label="Yopish"
              >
                ×
              </button>
            </div>
            <form onSubmit={save}>
              <label>
                Kurs
                <select
                  required
                  value={draft.courseId || ""}
                  onChange={(e) => field("courseId", e.target.value)}
                >
                  <option value="">Kursni tanlang</option>
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dars nomi
                <input
                  required
                  maxLength={150}
                  value={draft.title}
                  onChange={(e) => field("title", e.target.value)}
                />
              </label>
              <label>
                Qisqa tavsif
                <input
                  required
                  value={draft.description}
                  onChange={(e) => field("description", e.target.value)}
                />
              </label>
              <div className="form-grid">
                <label>
                  Davomiyligi (daqiqa)
                  <input
                    type="number"
                    min="1"
                    max="600"
                    required
                    value={draft.duration}
                    onChange={(e) => field("duration", e.target.value)}
                  />
                </label>
                <label>
                  Holati
                  <select
                    value={String(draft.published)}
                    onChange={(e) =>
                      field("published", e.target.value === "true")
                    }
                  >
                    <option value="false">Nofaol</option>
                    <option value="true">Faol</option>
                  </select>
                </label>
              </div>
              <label>
                Video yuklash (maks. 200 MB)
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </label>
              {draft.fileId && (
                <div className="row small">
                  <span>Saqlangan video mavjud</span>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => field("fileId", "")}
                  >
                    Videoni olib tashlash
                  </button>
                </div>
              )}
              <label>
                Yoki to‘g‘ridan-to‘g‘ri HTTPS video URL (MP4/WebM)
                <input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={draft.video}
                  onChange={(e) =>
                    setDraft({ ...draft, video: e.target.value, fileId: "" })
                  }
                />
              </label>
              <small className="muted">
                YouTube sahifa havolasi emas, video fayl manzilini kiriting.
              </small>
              <label>
                Amaliy vazifa
                <textarea
                  required
                  value={draft.task}
                  onChange={(e) => field("task", e.target.value)}
                />
              </label>
              <div className="row">
                <h3>Test savollari</h3>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    field("questions", [
                      ...draft.questions,
                      {
                        id: uid(),
                        text: "",
                        options: ["", "", "", ""],
                        correct: 0,
                      },
                    ])
                  }
                >
                  + Savol
                </button>
              </div>
              {draft.questions.map((q, i) => (
                <div className="question-editor" key={q.id}>
                  <div className="row">
                    <strong>{i + 1}-savol</strong>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() =>
                        field(
                          "questions",
                          draft.questions.filter((x) => x.id !== q.id),
                        )
                      }
                    >
                      O‘chirish
                    </button>
                  </div>
                  <label>
                    Savol matni
                    <input
                      required
                      value={q.text}
                      onChange={(e) => question(q.id, "text", e.target.value)}
                    />
                  </label>
                  {q.options.map((o, j) => (
                    <label className="option-editor" key={j}>
                      <input
                        aria-label={j + 1 + "-variant to‘g‘ri"}
                        type="radio"
                        name={"correct-" + q.id}
                        checked={q.correct === j}
                        onChange={() => question(q.id, "correct", j)}
                      />
                      <input
                        aria-label={j + 1 + "-javob"}
                        required
                        placeholder={j + 1 + "-variant"}
                        value={o}
                        onChange={(e) =>
                          question(
                            q.id,
                            "options",
                            q.options.map((v, k) =>
                              k === j ? e.target.value : v,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <small>To‘g‘ri javob yonidagi doirani belgilang.</small>
                </div>
              ))}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary" disabled={busy}>
                <Upload size={16} />
                {busy ? "Saqlanmoqda…" : "Darsni saqlash"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

```

## src/pages/AdminReviews.jsx

```jsx
import { useState } from "react";
import { useApp } from "../context/AppContext";
import "./Admin.css";
export default function AdminReviews() {
  const { data, update, notify } = useApp();
  const [filter, setFilter] = useState("pending");
  const [feedback, setFeedback] = useState({});
  function review(id, status) {
    update((d) => {
      const s = d.submissions.find((x) => x.id === id);
      s.status = status;
      s.feedback = feedback[id] ?? s.feedback ?? "";
    });
    notify(
      status === "approved"
        ? "Vazifa tasdiqlandi."
        : "Vazifa qayta ishlashga yuborildi.",
    );
  }
  const items = data.submissions.filter(
    (s) => filter === "all" || s.status === filter,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Vazifalarni tekshirish</h1>
          <p>O‘quvchilarga fikr bildiring va natijalarini tasdiqlang.</p>
        </div>
      </div>
      <div className="tabs">
        {[
          ["pending", "Kutilayotgan"],
          ["approved", "Tasdiqlangan"],
          ["rejected", "Qaytarilgan"],
          ["all", "Barchasi"],
        ].map(([k, v]) => (
          <button
            key={k}
            className={filter === k ? "active" : ""}
            onClick={() => setFilter(k)}
          >
            {v}
          </button>
        ))}
      </div>
      {!items.length && (
        <div className="panel empty">Bu bo‘limda vazifalar yo‘q.</div>
      )}
      {items.map((s) => (
        <article className="panel review" key={s.id}>
          <div className="row">
            <div>
              <h3>
                {data.users.find((u) => u.id === s.userId)?.name ||
                  "O‘chirilgan o‘quvchi"}
              </h3>
              <p>{data.lessons.find((l) => l.id === s.lessonId)?.title}</p>
            </div>
            <span className="badge">
              {
                {
                  pending: "Kutilmoqda",
                  approved: "Tasdiqlangan",
                  rejected: "Qaytarilgan",
                }[s.status]
              }
            </span>
          </div>
          <div className="answer-text">{s.answer}</div>
          <label>
            O‘quvchiga izoh
            <textarea
              value={feedback[s.id] ?? s.feedback}
              onChange={(e) =>
                setFeedback({ ...feedback, [s.id]: e.target.value })
              }
              placeholder="Tavsiyangizni yozing…"
            />
          </label>
          <div className="button-row">
            <button
              className="primary"
              onClick={() => review(s.id, "approved")}
            >
              ✓ Tasdiqlash
            </button>
            <button
              className="secondary"
              onClick={() => review(s.id, "rejected")}
            >
              Qayta ishlashga yuborish
            </button>
          </div>
        </article>
      ))}
    </>
  );
}

```

## src/pages/AdminStudents.jsx

```jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { useApp } from "../context/AppContext";
import { uid, completed } from "../services/db";
import "./Admin.css";
export default function AdminStudents() {
  const { data, update, notify } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const lessons = data.lessons.filter((l) => l.published);
  function save(e) {
    e.preventDefault();
    const email = draft.email.trim().toLowerCase();
    if (
      data.users.some(
        (u) => u.id !== draft.id && u.email.toLowerCase() === email,
      )
    ) {
      setError("Ushbu email allaqachon mavjud.");
      return;
    }
    const course = data.courses.find((c) => c.id === draft.courseId);
    if (!course) {
      setError("Kursni tanlang.");
      return;
    }
    const previous = data.users.find((u) => u.id === draft.id);
    if (
      previous &&
      previous.courseId !== draft.courseId &&
      data.payments.some((p) => p.userId === draft.id)
    ) {
      setError("To‘lovli hisobning kursini almashtirib bo‘lmaydi.");
      return;
    }
    const ok = update((d) => {
      const u = {
        ...draft,
        email,
        name: draft.name.trim(),
        courseFee:
          previous?.courseId === course.id
            ? (previous.courseFee ?? course.price)
            : course.price,
      };
      const i = d.users.findIndex((x) => x.id === u.id);
      if (i < 0) d.users.push(u);
      else d.users[i] = u;
    });
    if (ok) {
      setDraft(null);
      notify("O‘quvchi saqlandi.");
      navigate("/admin/students/" + draft.id);
    }
  }
  function remove(u) {
    if (!confirm(u.name + " va uning barcha natijalari o‘chirilsinmi?")) return;
    update((d) => {
      d.users = d.users.filter((x) => x.id !== u.id);
      delete d.progress[u.id];
      Object.keys(d.testSessions).forEach((k) => {
        if (d.testSessions[k].userId === u.id) delete d.testSessions[k];
      });
      for (const k of ["submissions", "attempts", "tickets", "payments"])
        d[k] = d[k].filter((x) => x.userId !== u.id);
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>O‘quvchilar</h1>
          <p>
            {data.users.filter((u) => u.role === "student").length} ta o‘quvchi
            · Hisoblar va natijalar nazorati
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setError("");
            setDraft({
              id: uid(),
              name: "",
              email: "",
              password: "",
              role: "student",
              courseId: data.courses[0]?.id || "",
              createdAt: new Date().toISOString(),
              active: true,
            });
          }}
        >
          + O‘quvchi qo‘shish
        </button>
      </div>
      <div className="search-box">
        <Search size={17} />
        <input
          aria-label="O‘quvchini qidirish"
          placeholder="Ism yoki email bo‘yicha qidirish…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="panel table-panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>O‘quvchi</th>
              <th>Progress</th>
              <th>Eng yaxshi test</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {data.users
              .filter(
                (u) =>
                  u.role === "student" &&
                  (u.name + " " + u.email)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link className="purple" to={"/admin/students/" + u.id}>
                      <strong>{u.name} →</strong>
                    </Link>
                    <small>{u.email}</small>
                    <small>
                      {data.courses.find((c) => c.id === u.courseId)?.title}
                    </small>
                  </td>
                  <td>
                    {
                      lessons.filter(
                        (l) =>
                          l.courseId === u.courseId &&
                          completed(data, u.id, l.id),
                      ).length
                    }
                    /{lessons.filter((l) => l.courseId === u.courseId).length}{" "}
                    dars
                  </td>
                  <td>
                    {data.attempts.some((a) => a.userId === u.id)
                      ? Math.max(
                          ...data.attempts
                            .filter((a) => a.userId === u.id)
                            .map((a) => a.score),
                        ) + "%"
                      : "—"}
                  </td>
                  <td>
                    <span className={"badge " + (u.active ? "green" : "")}>
                      {u.active ? "Faol" : "Bloklangan"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        aria-label="Tahrirlash"
                        onClick={() => {
                          setDraft({ ...u });
                          setError("");
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label="O‘chirish"
                        className="danger"
                        onClick={() => remove(u)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {draft && (
        <div className="modal-backdrop">
          <section
            className="modal narrow"
            role="dialog"
            aria-modal="true"
            aria-label="O‘quvchi hisobi"
          >
            <div className="row">
              <h2>O‘quvchi hisobi</h2>
              <button className="ghost" onClick={() => setDraft(null)}>
                ×
              </button>
            </div>
            <form onSubmit={save}>
              <label>
                Kurs
                <select
                  required
                  value={draft.courseId || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, courseId: e.target.value })
                  }
                >
                  <option value="">Kursni tanlang</option>
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {Number(c.price).toLocaleString("uz-UZ")} so‘m
                    </option>
                  ))}
                </select>
              </label>
              <label>
                To‘liq ism
                <input
                  required
                  minLength={3}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={draft.email}
                  onChange={(e) =>
                    setDraft({ ...draft, email: e.target.value })
                  }
                />
              </label>
              <label>
                Demo parol
                <input
                  required
                  minLength={8}
                  type="password"
                  value={draft.password}
                  onChange={(e) =>
                    setDraft({ ...draft, password: e.target.value })
                  }
                />
              </label>
              <label>
                Holat
                <select
                  value={String(draft.active)}
                  onChange={(e) =>
                    setDraft({ ...draft, active: e.target.value === "true" })
                  }
                >
                  <option value="true">Faol</option>
                  <option value="false">Bloklangan</option>
                </select>
              </label>
              {error && <p className="error">{error}</p>}
              <button className="primary">Saqlash</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

```

## src/pages/AdminSupport.jsx

```jsx
import { useApp } from "../context/AppContext";
import "./Admin.css";
export default function AdminSupport() {
  const { data, update, notify } = useApp();
  function reply(e, id) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("reply").trim();
    update((d) => {
      d.tickets.find((t) => t.id === id).reply = value;
    });
    notify("Javob saqlandi. O‘quvchi yordam sahifasida ko‘radi.");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Murojaatlar</h1>
          <p>O‘quvchilar savollariga shu yerdan javob bering.</p>
        </div>
      </div>
      {!data.tickets.length && (
        <div className="panel empty">Hozircha murojaatlar yo‘q.</div>
      )}
      {data.tickets.map((t) => (
        <article className="panel review" key={t.id}>
          <div className="row">
            <h3>{t.subject}</h3>
            <span className={"badge " + (t.reply ? "green" : "")}>
              {t.reply ? "Javob berildi" : "Yangi"}
            </span>
          </div>
          <p className="muted small">
            {data.users.find((u) => u.id === t.userId)?.name} ·{" "}
            {new Date(t.createdAt).toLocaleString("uz-UZ")}
          </p>
          <div className="answer-text">{t.message}</div>
          <form onSubmit={(e) => reply(e, t.id)}>
            <textarea
              aria-label="Admin javobi"
              name="reply"
              required
              minLength={3}
              defaultValue={t.reply}
              placeholder="Javobingizni yozing…"
            />
            <button className="primary">Javobni saqlash</button>
          </form>
        </article>
      ))}
    </>
  );
}

```

## src/pages/Certificate.css

```css
.certificate-layout {
  max-width: 900px;
  margin: 35px auto;
}
.certificate {
  padding: 38px 30px;
  text-align: center;
  background: linear-gradient(135deg, #fbfaff, #fff);
  border: 8px double #bba2e7;
  outline: 1px solid #e0d4f1;
  outline-offset: 5px;
  position: relative;
}
.cert-brand {
  color: var(--purple);
  font-size: 17px;
  font-weight: 800;
}
.cert-overline {
  font-size: 8px;
  letter-spacing: 2px;
  display: block;
  margin-top: 30px;
  color: #8d7ba7;
}
.certificate h2 {
  font-size: 34px;
  letter-spacing: 6px;
  margin: 18px 0 25px;
}
.certificate p {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}
.certificate h3 {
  font-size: 27px;
  margin: 18px 0;
  border-bottom: 1px solid #e4d9f0;
  padding-bottom: 20px;
}
.cert-bottom {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 27px 0;
}
.cert-bottom strong {
  font-size: 11px;
}
.cert-bottom small {
  display: block;
  font-size: 9px;
  color: var(--muted);
  margin-top: 5px;
}
.seal {
  background: #fff2ce;
  color: #bd8a27;
  border: 3px double #dfba67;
  border-radius: 50%;
  padding: 16px;
}
.certificate > small {
  font-size: 8px;
  color: #a89ab8;
}
.cert-requirements {
  padding: 25px;
  margin-top: 30px;
}
.cert-requirements h3 {
  font-size: 15px;
}
.cert-requirements p {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: var(--muted);
}
.cert-requirements svg {
  color: #46a378;
}
.cert-requirements > small {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-top: 14px;
}
@media print {
  .sidebar,
  .topbar,
  footer,
  .page-heading,
  .cert-requirements,
  .toast {
    display: none !important;
  }
  .main-wrap {
    margin: 0;
  }
  main {
    padding: 25px;
  }
  .certificate-layout {
    width: 100%;
  }
  .certificate {
    break-inside: avoid;
  }
}

```

## src/pages/Certificate.jsx

```jsx
import { Award, CheckCircle, Lock, Printer } from "lucide-react";
import { useApp } from "../context/AppContext";
import { studentLessons, completed } from "../services/db";
import "./Certificate.css";
export default function Certificate() {
  const { data, user } = useApp();
  const lessons = studentLessons(data, user.id).filter((l) => l.published);
  const count = lessons.filter((l) => completed(data, user.id, l.id)).length;
  const ready =
    lessons.length > 0 &&
    count === lessons.length &&
    lessons.every(
      (l) =>
        data.progress[user.id]?.[l.id]?.watched &&
        data.submissions.some(
          (s) =>
            s.userId === user.id &&
            s.lessonId === l.id &&
            s.status === "approved",
        ),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">NATIJANGIZGA MUNOSIB E’TIROF</div>
          <h1>Sertifikat</h1>
          <p>Kursni muvaffaqiyatli yakunlang va yutug‘ingizni nishonlang.</p>
        </div>
        <Award className="purple" size={30} />
      </div>
      <div className="certificate-layout">
        <div className={"certificate " + (!ready ? "preview" : "")}>
          <div className="cert-brand">✦ AI Academy</div>
          <span className="cert-overline">
            MUVAFFAQIYATLI TAMOMLAGANLIK UCHUN
          </span>
          <h2>SERTIFIKAT</h2>
          <p>Ushbu sertifikat egasi</p>
          <h3>{user.name}</h3>
          <p>
            «{data.courses.find((c) => c.id === user.courseId)?.title}»
            kursidagi barcha darslar,
            <br />
            amaliy vazifalar va testlarni muvaffaqiyatli yakunladi.
          </p>
          <div className="cert-bottom">
            <div>
              <strong>
                {ready ? new Date().toLocaleDateString("uz-UZ") : "—"}
              </strong>
              <small>Sana</small>
            </div>
            <div className="seal">
              <Award size={35} />
            </div>
            <div>
              <strong>AI Academy</strong>
              <small>Ta’lim jamoasi</small>
            </div>
          </div>
          <small>
            ID: AI-{user.id.slice(0, 8).toUpperCase()} ·{" "}
            {ready ? "Demo sertifikat" : "NAMUNA — HALI BERILMAGAN"}
          </small>
        </div>
        <div className="panel cert-requirements">
          <h3>Sertifikat olish shartlari</h3>
          <p>
            <CheckCircle size={17} /> Barcha videolarni oxirigacha ko‘rish
          </p>
          <p>
            <CheckCircle size={17} /> Testlardan 70% dan yuqori olish
          </p>
          <p>
            <CheckCircle size={17} /> Vazifalarni admin tasdiqlashi
          </p>
          <div className="progress">
            <i
              style={{
                width:
                  (lessons.length ? (count / lessons.length) * 100 : 0) + "%",
              }}
            />
          </div>
          <p>
            {count}/{lessons.length} dars to‘liq yakunlangan
          </p>
          <button
            className="primary"
            disabled={!ready}
            onClick={() => window.print()}
          >
            {ready ? <Printer size={16} /> : <Lock size={16} />}{" "}
            {ready ? "Sertifikatni PDF saqlash" : "Hozircha yopiq"}
          </button>
          <small>
            Ochilgach, chop etish oynasida “Save as PDF” ni tanlang.
          </small>
        </div>
      </div>
    </>
  );
}

```

## src/pages/Course.css

```css
.course-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 34px;
  background: linear-gradient(112deg, #eee8fc, #f3efff 60%, #e9ddff);
  border: 1px solid #e7dff5;
  border-radius: 15px;
  margin: 27px 0;
}
.hero-tag {
  font-size: 9px;
  color: #805abb;
  letter-spacing: 1.3px;
}
.course-hero h2 {
  font-size: 26px;
  line-height: 1.4;
  letter-spacing: -0.6px;
  margin: 12px 0;
}
.course-hero p {
  font-size: 12px;
  color: #827197;
}
.hero-details {
  display: flex;
  gap: 20px;
  margin-top: 24px;
  color: #7a668f;
  font-size: 10px;
}
.hero-details span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hero-ai {
  font-size: 76px;
  font-weight: 700;
  letter-spacing: -5px;
  background: linear-gradient(140deg, #b897ee, #6540b9);
  color: #f6edff;
  padding: 19px 29px;
  border-radius: 23px;
  transform: rotate(-9deg);
  border: 3px solid #c8b0ef;
  box-shadow:
    9px 9px 0 #c5b0e4,
    18px 20px 35px #8e6ac536;
  margin: 0 40px;
}
.hero-ai small {
  display: block;
  font-size: 5px;
  letter-spacing: 1.3px;
}
.course-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 236px;
  gap: 24px;
}
.progress-card {
  padding: 22px;
}
.progress-card strong {
  font-size: 12px;
}
.progress {
  height: 7px;
  background: #eeeaf4;
  border-radius: 10px;
  overflow: hidden;
  margin: 17px 0 11px;
}
.progress i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #8656ff, #6332e6);
  border-radius: 10px;
  transition: width 0.3s;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 27px 0 16px;
}
.section-heading h3 {
  font-size: 15px;
  margin: 0;
}
.section-heading span {
  font-size: 11px;
  color: var(--muted);
}
.lesson-list {
  display: grid;
  gap: 11px;
}
.lesson-row {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fff;
  border: 1px solid var(--line);
  padding: 19px 17px;
  border-radius: 12px;
  min-height: 85px;
}
.lesson-row.current {
  border-color: #bba1f4;
  box-shadow: 0 3px 14px #6d37ee06;
}
.lesson-number {
  background: #f0edf5;
  color: #7b748c;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.current .lesson-number {
  background: var(--purple);
  color: white;
  box-shadow: 0 0 0 4px #eee7ff;
}
.lesson-number.done {
  background: #e4f6ec;
  color: #269761;
}
.lesson-text {
  flex: 1;
}
.lesson-text h3 {
  font-size: 12px;
  margin: 0 0 9px;
}
.lesson-text p {
  font-size: 9px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
}
.lesson-text b {
  font-weight: 400;
}
.lesson-row.locked {
  background: #f7f6fa;
}
.lesson-row > svg {
  color: #a29aad;
}
.done-link {
  color: #309564;
  font-size: 10px;
  display: flex;
  gap: 6px;
}
.next-card {
  padding: 22px;
}
.next-card h3,
.certificate-teaser h3 {
  font-size: 14px;
}
.next-card p,
.certificate-teaser p {
  font-size: 11px;
  line-height: 1.9;
  color: var(--muted);
}
.quote-line {
  height: 1px;
  background: var(--line);
  margin: 20px 0;
}
.next-card small {
  font-size: 8px;
  letter-spacing: 1.2px;
  color: #a097b0;
}
.certificate-teaser {
  padding: 24px 20px;
  margin-top: 20px;
  background: #f0eafb;
  border: 1px solid #e7ddf8;
  border-radius: 12px;
}
.certificate-teaser > svg {
  color: #9165d9;
}
.certificate-teaser a {
  display: flex;
  gap: 7px;
  align-items: center;
  font-size: 11px;
  color: var(--purple);
  margin-top: 19px;
}
@media (max-width: 1100px) {
  .course-columns {
    grid-template-columns: 1fr;
  }
  .course-columns > aside {
    display: none;
  }
  .hero-ai {
    margin: 0 10px;
  }
  .compact {
    font-size: 10px !important;
  }
}
@media (max-width: 600px) {
  .course-hero {
    padding: 22px;
  }
  .course-hero h2 {
    font-size: 21px;
  }
  .hero-ai {
    display: none;
  }
  .hero-details {
    gap: 12px;
  }
  .lesson-row {
    flex-wrap: wrap;
    padding: 17px 13px;
    gap: 11px;
  }
  .lesson-row .primary {
    margin-left: 44px;
  }
  .page-heading > .pill {
    display: none;
  }
}

```

## src/pages/Course.jsx

```jsx
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Lock,
  Play,
  Clock,
  Sparkles,
  BookOpen,
  Award,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { studentLessons, completed, unlocked } from "../services/db";
import "./Course.css";
export default function Course() {
  const { data, user } = useApp();
  const list = studentLessons(data, user.id).filter((l) => l.published);
  const count = list.filter((l) => completed(data, user.id, l.id)).length;
  const percent = list.length ? Math.round((count / list.length) * 100) : 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SIZNING BILIM SARI YO‘LINGIZ</div>
          <h1>
            {data.courses.find((c) => c.id === user.courseId)?.title ||
              "Mening kursim"}
          </h1>
          <p>
            Yangi bilimlar, yangi imkoniyatlar. Bugun ham bir qadam oldinga.
          </p>
        </div>
        <span className="pill">
          <Sparkles size={14} />{" "}
          {data.courses.find((c) => c.id === user.courseId)?.title}
        </span>
      </div>
      <section className="course-hero">
        <div>
          <span className="hero-tag">AMALIY ONLAYN KURS</span>
          <h2>
            Sun’iy intellektni
            <br />
            o‘z imkoniyatingizga aylantiring.
          </h2>
          <p>G‘oyadan ilk loyihangizgacha — birgalikda.</p>
          <div className="hero-details">
            <span>
              <BookOpen size={14} /> {list.length} ta dars
            </span>
            <span>
              <Clock size={14} />{" "}
              {list.reduce((s, l) => s + Number(l.duration), 0)} daqiqa
            </span>
            <span>
              <Award size={14} /> Sertifikat
            </span>
          </div>
        </div>
        <div className="hero-ai">
          AI<small>THE FUTURE IS YOURS</small>
        </div>
      </section>
      <div className="course-columns">
        <div>
          <section className="panel progress-card">
            <div className="row">
              <strong>Umumiy progress</strong>
              <span className="purple">{percent}%</span>
            </div>
            <div className="progress">
              <i style={{ width: percent + "%" }} />
            </div>
            <div className="row muted small">
              <span>
                {count}/{list.length} dars yakunlandi
              </span>
              <span>
                {percent === 100
                  ? "Ajoyib natija!"
                  : "Davom eting, siz uddalaysiz!"}
              </span>
            </div>
          </section>
          <div className="section-heading">
            <h3>Kurs dasturi</h3>
            <span>{list.length} ta dars</span>
          </div>
          <div className="lesson-list">
            {list.map((l, i) => {
              const done = completed(data, user.id, l.id);
              const open = unlocked(data, user.id, l.id);
              return (
                <article
                  className={
                    "lesson-row " +
                    (open && !done ? "current" : "") +
                    (open ? "" : " locked")
                  }
                  key={l.id}
                >
                  <span className={"lesson-number " + (done ? "done" : "")}>
                    {done ? (
                      <Check size={16} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <div className="lesson-text">
                    <h3>{l.title}</h3>
                    <p>
                      <Play size={11} /> Video dars <b>·</b> {l.duration} daqiqa{" "}
                      <b>·</b> Vazifa va test
                    </p>
                  </div>
                  {open ? (
                    <Link
                      className={done ? "done-link" : "primary compact"}
                      to={"/student/lesson/" + l.id}
                    >
                      {done ? "Qayta ko‘rish" : "Darsni boshlash"}
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Lock size={17} />
                  )}
                </article>
              );
            })}
            {!list.length && (
              <div className="empty">Hozircha darslar e’lon qilinmagan.</div>
            )}
          </div>
        </div>
        <aside>
          <div className="panel next-card">
            <span className="small-icon">
              <Sparkles size={20} />
            </span>
            <h3>O‘zingizga ishoning.</h3>
            <p>
              Har bir yangi ko‘nikma sizga yangi eshiklarni ochadi. Bugungi
              kichik qadam — ertangi katta natija.
            </p>
            <div className="quote-line" />
            <small>O‘RGANISHNI TO‘XTATMANG</small>
          </div>
          <div className="certificate-teaser">
            <Award size={29} />
            <h3>Mehnatingiz e’tirofi</h3>
            <p>
              Barcha dars va vazifalarni yakunlang, shaxsiy sertifikatingizni
              oling.
            </p>
            <Link to="/student/certificate">
              Sertifikat haqida <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

```

## src/pages/Lesson.css

```css
.back {
  display: flex;
  gap: 7px;
  align-items: center;
  color: var(--muted);
  font-size: 11px;
  margin-bottom: 22px;
}
.lesson-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 23px;
  margin-top: 26px;
}
.video {
  width: 100%;
  aspect-ratio: 16/9;
  background: #201532;
  border-radius: 13px;
}
.video-empty {
  aspect-ratio: 16/9;
  border-radius: 14px;
  background: radial-gradient(ellipse at 70% 20%, #65458b, #21152e 80%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f0e7ff;
  padding: 20px;
  text-align: center;
}
.video-empty svg {
  color: #c8a5ff;
}
.video-empty h3 {
  font-size: 21px;
}
.video-empty p {
  font-size: 12px;
  color: #cab8df;
}
.video-empty small {
  font-size: 10px;
  color: #9883ad;
}
.video-note {
  margin: 13px 0 24px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin: 20px 0;
}
.tabs button {
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  padding: 10px 18px;
}
.tabs .active {
  background: #eae2fc;
  color: var(--purple);
}
.task-panel {
  padding: 23px;
}
.task-panel h3 {
  font-size: 14px;
}
.task-panel p {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.8;
  white-space: pre-wrap;
}
.task-panel form > .primary {
  margin: 16px 0 0 auto;
}
.contents {
  padding: 21px;
  height: fit-content;
}
.contents h3 {
  font-size: 13px;
  margin-bottom: 22px;
}
.contents > div {
  display: flex;
  gap: 10px;
  padding: 13px 5px;
  align-items: center;
  font-size: 10px;
  color: var(--muted);
  line-height: 1.6;
}
.contents > div span {
  background: #f0edf7;
  border-radius: 50%;
  padding: 4px 8px;
}
.contents .selected {
  color: var(--purple);
}
.submission {
  padding: 15px;
  background: #f7f5fb;
  border-radius: 8px;
  margin: 20px 0;
}
.test-option {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  font-size: 12px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.test-option input {
  width: 16px;
  accent-color: var(--purple);
}
fieldset {
  border: 0;
  padding: 10px 0;
  margin: 15px 0;
}
legend {
  font-size: 13px;
  font-weight: 600;
}
.result {
  background: #eee8fc;
  padding: 15px;
  margin-top: 20px;
  border-radius: 8px;
  color: var(--purple);
}
@media (max-width: 1000px) {
  .lesson-columns {
    grid-template-columns: 1fr;
  }
  .contents {
    display: none;
  }
}

.protected-video {
  position: relative;
  background: #201532;
  border-radius: 13px;
  overflow: hidden;
}
.video-watermark {
  position: absolute;
  top: 15%;
  left: 8%;
  z-index: 2;
  pointer-events: none;
  color: #ffffff90;
  text-shadow: 0 1px 3px #000;
  font-size: 12px;
  max-width: 85%;
  overflow-wrap: anywhere;
}
.task-panel {
  margin-top: 20px;
}
.attempt-history {
  margin-top: 20px;
  font-size: 12px;
}
.attempt-history summary {
  cursor: pointer;
  padding: 12px 0;
}
.result {
  margin-bottom: 15px;
}

```

## src/pages/Lesson.jsx

```jsx
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  studentLessons,
  getFile,
  uid,
  unlocked,
  passed,
  attemptPassed,
  recordAttempt,
} from "../services/db";
import "./Lesson.css";
function Player({ lesson, onEnd, watermark }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      objectUrl;
    setSrc("");
    setError("");
    if (lesson.fileId) {
      getFile(lesson.fileId)
        .then((file) => {
          if (!active) return;
          if (!file) {
            setError(
              "Video bu brauzerda topilmadi. Admin videoni qayta yuklashi kerak.",
            );
            return;
          }
          objectUrl = URL.createObjectURL(file);
          setSrc(objectUrl);
        })
        .catch(() => active && setError("Video faylini ochib bo‘lmadi."));
    } else setSrc(lesson.video);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [lesson.fileId, lesson.video]);
  return src && !error ? (
    <div className="protected-video" onContextMenu={(e) => e.preventDefault()}>
      <div className="video-watermark">{watermark}</div>
      <video
        className="video"
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        onEnded={onEnd}
        onError={() =>
          setError("Video ochilmadi. Manzil va formatni tekshiring.")
        }
        src={src}
      />
    </div>
  ) : (
    <div className="video-empty">
      <PlayCircle size={52} />
      <h3>Bilim sari birinchi qadam</h3>
      <p>{error || "Admin ushbu dars videosini hali yuklamagan."}</p>
      <small>Video yuklangach, shu yerda tomosha qilasiz.</small>
    </div>
  );
}

export default function Lesson() {
  const { id } = useParams();
  const { data, user, update, notify } = useApp();
  const [answer, setAnswer] = useState("");
  const submitting = useRef(false);
  useEffect(() => {
    setAnswer("");
    submitting.current = false;
  }, [id]);
  const lesson = data.lessons.find((l) => l.id === id && l.published);
  if (!lesson || !unlocked(data, user.id, id))
    return (
      <div className="empty">
        <h2>Dars yopiq yoki mavjud emas</h2>
        <p>Oldingi faol darslar testidan 70% dan yuqori oling.</p>
        <Link to="/student">Kursga qaytish</Link>
      </div>
    );
  const key = user.id + ":" + id;
  const session = data.testSessions[key];
  const attempts = data.attempts.filter(
    (a) => a.userId === user.id && a.lessonId === id,
  );
  const latest = attempts[attempts.length - 1];
  const sub = data.submissions.find(
    (s) => s.userId === user.id && s.lessonId === id,
  );
  function startTest() {
    if (!lesson.questions.length) return notify("Admin hali test kiritmagan.");
    update((d) => {
      if (d.testSessions[key]) return;
      d.testSessions[key] = {
        id: uid(),
        userId: user.id,
        lessonId: id,
        lessonTitle: lesson.title,
        startedAt: new Date().toISOString(),
        questions: structuredClone(lesson.questions),
        answers: {},
      };
    });
  }
  function choose(questionId, value) {
    update((d) => {
      if (d.testSessions[key]?.id === session.id)
        d.testSessions[key].answers[questionId] = value;
    });
  }
  function finish(e) {
    e.preventDefault();
    if (submitting.current || !session) return;
    submitting.current = true;
    const ok = update((d) =>
      recordAttempt(d, session, d.testSessions[key]?.answers || {}),
    );
    submitting.current = false;
    if (ok)
      notify("Natija saqlandi. Topshirilgan javoblarni o‘zgartirib bo‘lmaydi.");
  }
  function watchedEnd() {
    update((d) => {
      d.progress[user.id] ??= {};
      d.progress[user.id][id] = {
        ...d.progress[user.id][id],
        watched: true,
        watchedAt: new Date().toISOString(),
      };
    });
  }
  function submitTask(e) {
    e.preventDefault();
    if (answer.trim().length < 5) return notify("Kamida 5 ta belgi yozing.");
    const ok = update((d) => {
      d.submissions = d.submissions.filter(
        (s) => !(s.userId === user.id && s.lessonId === id),
      );
      d.submissions.push({
        id: uid(),
        userId: user.id,
        lessonId: id,
        answer: answer.trim(),
        status: "pending",
        feedback: "",
        createdAt: new Date().toISOString(),
      });
    });
    if (ok) {
      setAnswer("");
      notify("Vazifa yuborildi.");
    }
  }
  return (
    <>
      <Link className="back" to="/student">
        <ArrowLeft size={15} /> Kursga qaytish
      </Link>
      <div className="page-heading">
        <div>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
        </div>
        {passed(data, user.id, id) && (
          <span className="badge green">Testdan o‘tilgan</span>
        )}
      </div>
      <div className="lesson-columns">
        <section>
          <Player
            key={id}
            lesson={lesson}
            onEnd={watchedEnd}
            watermark={user.name + " · " + user.email}
          />
          <p className="small muted">
            {data.progress[user.id]?.[id]?.watched
              ? "✓ Video yakunlangan"
              : "Video oxirida ko‘rilganlik saqlanadi."}
          </p>
          <section className="panel task-panel">
            <h3>Dars testi</h3>
            <p>
              Keyingi dars uchun natija 70% dan yuqori bo‘lishi kerak. 70%
              yetarli emas.
            </p>
            {session ? (
              <form onSubmit={finish}>
                {session.questions.map((q, i) => (
                  <fieldset key={q.id}>
                    <legend>
                      {i + 1}. {q.text}
                    </legend>
                    {q.options.map((option, j) => (
                      <label className="test-option" key={j}>
                        <input
                          type="radio"
                          required
                          name={q.id}
                          checked={session.answers[q.id] === j}
                          onChange={() => choose(q.id, j)}
                        />
                        {option}
                      </label>
                    ))}
                  </fieldset>
                ))}
                <button className="primary">Testni yakunlash</button>
              </form>
            ) : (
              <>
                {latest && (
                  <div className="result">
                    Oxirgi natija: {latest.score.toFixed(2)}% —{" "}
                    {attemptPassed(latest) ? "O‘tdingiz" : "O‘tmadingiz"}.
                    Natija o‘zgartirilmaydi.
                  </div>
                )}
                <button
                  className="primary"
                  disabled={!lesson.questions.length}
                  onClick={startTest}
                >
                  {latest
                    ? "Testni boshidan qayta boshlash"
                    : "Testni boshlash"}
                </button>
                {!lesson.questions.length && (
                  <p>
                    Test hali kiritilmagan. Administratorga murojaat qiling.
                  </p>
                )}
              </>
            )}
            {attempts.length > 0 && (
              <details className="attempt-history">
                <summary>Urinishlar tarixi ({attempts.length})</summary>
                {[...attempts].reverse().map((a) => (
                  <div className="submission" key={a.id}>
                    <strong>
                      {a.score.toFixed(2)}% ·{" "}
                      {attemptPassed(a) ? "O‘tdi" : "O‘tmadi"}
                    </strong>
                    <p>{new Date(a.createdAt).toLocaleString("uz-UZ")}</p>
                    {a.questions?.map((q, i) => (
                      <p key={q.id}>
                        {i + 1}. {q.text}
                        <br />
                        Javobingiz: {q.options[a.answers?.[q.id]] ?? "—"}
                      </p>
                    ))}
                  </div>
                ))}
              </details>
            )}
          </section>
          <section className="panel task-panel">
            <h3>Amaliy vazifa</h3>
            <p>{lesson.task}</p>
            {sub && (
              <div className="submission">
                <strong>
                  {
                    {
                      pending: "Tekshirilmoqda",
                      approved: "Tasdiqlandi",
                      rejected: "Qayta ishlash kerak",
                    }[sub.status]
                  }
                </strong>
                <p>{sub.answer}</p>
                <p>{sub.feedback}</p>
              </div>
            )}
            {sub?.status !== "approved" && (
              <form onSubmit={submitTask}>
                <textarea
                  required
                  minLength={5}
                  maxLength={10000}
                  aria-label="Vazifa javobi"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <button className="primary">Vazifani topshirish</button>
              </form>
            )}
          </section>
        </section>
        <aside className="panel contents">
          <h3>Kurs darslari</h3>
          {studentLessons(data, user.id)
            .filter((l) => l.published)
            .map((l, i) => (
              <div key={l.id} className={l.id === id ? "selected" : ""}>
                <span>{i + 1}</span>
                {unlocked(data, user.id, l.id) ? (
                  <Link to={"/student/lesson/" + l.id}>{l.title}</Link>
                ) : (
                  <small>🔒 {l.title}</small>
                )}
              </div>
            ))}
        </aside>
      </div>
    </>
  );
}

```

## src/pages/Login.css

```css
.login-page {
  max-width: 1440px;
  margin: auto;
  min-height: 100vh;
  padding: 35px 65px 20px;
  background:
    radial-gradient(ellipse at 12% 48%, #eae2ff 0, transparent 55%), #faf9fd;
}
.login-brand {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.login-brand > span {
  font-size: 11px;
  color: var(--muted);
}
.login-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 60px;
  min-height: calc(100vh - 130px);
}
.login-story {
  padding: 45px 0 10px 35px;
}
.eyebrow {
  display: flex;
  gap: 7px;
  align-items: center;
  font-size: 10px;
  color: var(--purple);
  letter-spacing: 1px;
  font-weight: 700;
}
.login-story h1 {
  font-size: 58px;
  letter-spacing: -2.8px;
  line-height: 1.1;
  margin: 24px 0 18px;
}
.login-story em {
  color: var(--purple);
  font-style: normal;
}
.login-story > p {
  font-size: 15px;
  color: var(--muted);
  line-height: 1.8;
}
.ai-art {
  position: relative;
  width: 310px;
  height: 245px;
  margin: 15px 0;
}
.ai-cube {
  position: absolute;
  left: 90px;
  top: 28px;
  width: 147px;
  height: 163px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 70px;
  font-weight: 600;
  letter-spacing: -5px;
  color: #efeaff;
  border: 5px solid #9a7ce7;
  border-radius: 24px;
  background: linear-gradient(135deg, #a98aec, #603ab4 48%, #35205f);
  transform: rotate(-12deg) skewY(5deg);
  box-shadow:
    14px 16px 0 #33225d,
    24px 28px 30px #7650b54d,
    inset 0 0 25px #c3adff;
}
.ai-cube span {
  font-size: 9px;
  letter-spacing: 1px;
  font-weight: 400;
}
.art-base {
  position: absolute;
  width: 235px;
  height: 22px;
  bottom: 10px;
  left: 49px;
  border-radius: 50%;
  background: #ddd0f7;
  box-shadow: 0 0 30px #c6b2f5;
}
.orbit {
  position: absolute;
  border: 1px solid #d9cdf3;
  border-radius: 50%;
  width: 275px;
  height: 190px;
  top: 20px;
  left: 20px;
  transform: rotate(-30deg);
}
.orbit-two {
  transform: rotate(32deg);
}
.float-icon {
  position: absolute;
  padding: 10px;
  background: #ffffffad;
  border: 1px solid white;
  border-radius: 13px;
  color: #9270df;
  box-shadow: 0 8px 25px #8a65d51c;
}
.float-icon.one {
  right: 5px;
  top: 5px;
}
.float-icon.two {
  left: 3px;
  top: 135px;
}
.story-note {
  font-size: 11px;
  color: var(--muted);
}
.story-note span {
  color: #9878d8;
  margin-right: 8px;
}
.login-form-wrap {
  max-width: 450px;
  width: 100%;
  margin: auto;
}
.login-form {
  padding: 36px;
  background: #fff;
  border: 1px solid #eee9f5;
  border-radius: 18px;
  box-shadow: 0 15px 65px #35246006;
}
.small-icon {
  display: grid;
  place-items: center;
  background: #f0eaff;
  color: var(--purple);
  width: 43px;
  height: 43px;
  border-radius: 12px;
  margin-bottom: 22px;
}
.login-form h2 {
  font-size: 27px;
  letter-spacing: -0.8px;
  margin: 0 0 8px;
}
.login-form > p {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 30px;
}
.login-form > label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-top: 20px;
}
.input-icon {
  position: relative;
  margin-top: 9px;
}
.input-icon > svg {
  position: absolute;
  left: 13px;
  top: 15px;
  color: #9790a7;
}
.input-icon input {
  padding-left: 40px;
  height: 47px;
  padding-right: 40px;
}
.eye {
  position: absolute;
  right: 12px;
  top: 14px;
  background: none;
  color: var(--muted);
  padding: 0;
}
.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 25px;
  font-size: 10px;
}
.check {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
}
.check input {
  width: 13px;
  accent-color: var(--purple);
}
.text-btn {
  color: var(--purple);
  font-size: 10px;
  background: none;
  padding: 0;
}
.login-submit {
  width: 100%;
  height: 45px;
  justify-content: center;
}
.demo-access {
  border-top: 1px solid var(--line);
  margin-top: 25px;
  padding-top: 20px;
  text-align: center;
}
.demo-access > span {
  font-size: 9px;
  letter-spacing: 1.4px;
  color: #aaa2b9;
}
.demo-access > div {
  display: flex;
  gap: 10px;
  margin: 13px 0;
}
.demo-access button {
  width: 50%;
  background: #f8f6fc;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px;
  color: #716780;
  font-size: 11px;
}
.demo-access small {
  font-size: 9px;
  color: #a69db3;
}
.form-bottom {
  font-size: 11px;
  display: flex;
  justify-content: center;
  gap: 7px;
  color: #a69db3;
  margin: 20px;
}
.login-footer {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #aaa2b5;
}
@media (max-width: 800px) {
  .login-page {
    padding: 24px;
  }
  .login-brand > span {
    display: none;
  }
  .login-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .login-story {
    padding: 35px 0 0;
  }
  .login-story h1 {
    font-size: 41px;
  }
  .ai-art,
  .story-note {
    display: none;
  }
  .login-story > p {
    font-size: 13px;
  }
  .login-form {
    padding: 25px;
  }
  .login-footer {
    margin-top: 25px;
  }
  .eyebrow {
    font-size: 8px;
  }
}

```

## src/pages/Login.jsx

```jsx
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Mail,
  LockKeyhole,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Brand } from "../components/Layout";
import "./Login.css";
export default function Login() {
  const { user, login } = useApp();
  const go = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  if (user)
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />
    );
  function submit(e) {
    e.preventDefault();
    try {
      const u = login(email, password, remember);
      go(u.role === "admin" ? "/admin" : "/student");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="login-page">
      <div className="login-brand">
        <Brand />
        <span>Yangi imkoniyatlar shu yerdan boshlanadi</span>
      </div>
      <div className="login-grid">
        <section className="login-story">
          <div className="eyebrow">
            <Sparkles size={14} /> KELAJAK KO‘NIKMALARINI O‘RGANING
          </div>
          <h1>
            AI bilan
            <br />
            <em>kelajagingizni</em>
            <br />
            yarating.
          </h1>
          <p>
            Amaliy bilimlar. Real loyihalar.
            <br />
            Sizning muvaffaqiyatingiz uchun.
          </p>
          <div className="ai-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="float-icon one">
              <Sparkles />
            </div>
            <div className="float-icon two">
              <BookOpen />
            </div>
            <div className="ai-cube">
              AI<span>your next chapter</span>
            </div>
            <div className="art-base" />
          </div>
          <div className="story-note">
            <span>✦</span> Birinchi qadamingiz — eng muhim qadam.
          </div>
        </section>
        <section className="login-form-wrap">
          <form className="login-form" onSubmit={submit}>
            <div className="small-icon">
              <LockKeyhole size={21} />
            </div>
            <h2>Tizimga kirish</h2>
            <p>Hisobingizga kiring, o‘rganishni davom ettiring.</p>
            <label>
              Email yoki login
              <div className="input-icon">
                <Mail size={17} />
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="siz@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>
            <label>
              Parol
              <div className="input-icon">
                <LockKeyhole size={17} />
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Parolingizni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye"
                  aria-label="Parolni ko‘rsatish"
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="login-options">
              <label className="check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{" "}
                Meni eslab qolish
              </label>
              <button
                type="button"
                className="text-btn"
                onClick={() =>
                  setError(
                    "Demo parollar quyida. Yangi hisob yoki parol uchun administratorga murojaat qiling.",
                  )
                }
              >
                Parolni unutdingizmi?
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary login-submit">
              Kirish <ArrowRight size={17} />
            </button>
            <div className="demo-access">
              <span>DEMO HISOBNI TANLANG</span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("student@academy.uz");
                    setPassword("Student123!");
                  }}
                >
                  <BookOpen size={15} /> O‘quvchi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@academy.uz");
                    setPassword("Admin123!");
                  }}
                >
                  <ShieldCheck size={15} /> Admin
                </button>
              </div>
              <small>Sinov rejimi • Ma’lumotlar shu brauzerda saqlanadi</small>
            </div>
          </form>
          <p className="form-bottom">
            <ShieldCheck size={14} /> Bilim sari ishonchli qadam
          </p>
        </section>
      </div>
      <div className="login-footer">
        © 2026 AI Academy <span>O‘zingizga sarmoya kiriting.</span>
      </div>
    </div>
  );
}

```

## src/pages/StudentDetail.css

```css
.detail-panel {
  padding: 25px;
  margin: 22px 0;
}
.detail-panel h3 {
  font-size: 16px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin: 20px 0;
}
.detail-grid label {
  font-size: 12px;
  font-weight: 600;
}
.detail-grid input,
.detail-grid select,
.detail-grid textarea {
  display: block;
  margin-top: 8px;
}
.payment-totals {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 22px 0;
}
.payment-totals > span {
  background: #f5f0ff;
  padding: 16px;
  border-radius: 10px;
  font-size: 11px;
  color: #81728e;
}
.payment-totals strong {
  display: block;
  font-size: 16px;
  color: #453251;
  margin-top: 10px;
  overflow-wrap: anywhere;
}
.attempt-detail {
  border-bottom: 1px solid var(--line);
  padding: 18px 0;
  font-size: 12px;
}
.attempt-detail summary {
  cursor: pointer;
  font-weight: 600;
  line-height: 1.8;
}
.attempt-detail p,
.detail-panel .submission p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.8;
}
.detail-panel td {
  max-width: 320px;
  overflow-wrap: anywhere;
}
@media (max-width: 700px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .payment-totals {
    grid-template-columns: 1fr 1fr;
  }
  .detail-panel {
    padding: 17px;
  }
}

```

## src/pages/StudentDetail.jsx

```jsx
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  studentLessons,
  uid,
  attemptPassed,
  passed,
  paymentSummary,
} from "../services/db";
import "./StudentDetail.css";
const money = (n) => new Intl.NumberFormat("uz-UZ").format(n) + " so‘m";
export default function StudentDetail() {
  const { studentId } = useParams();
  const { data, update, notify, user: admin } = useApp();
  const student = data.users.find(
    (u) => u.id === studentId && u.role === "student",
  );
  if (!student)
    return (
      <div className="empty">
        O‘quvchi topilmadi. <Link to="/admin/students">Ro‘yxatga qaytish</Link>
      </div>
    );
  const lessons = studentLessons(data, studentId);
  const payments = data.payments.filter((p) => p.userId === studentId);
  const attempts = data.attempts.filter((a) => a.userId === studentId);
  const progress = data.progress[studentId] || {};
  const watched = lessons.filter((l) => progress[l.id]?.watched).length;
  const totals = paymentSummary(data, student);
  function saveProfile(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = f.get("name").trim(),
      email = f.get("email").trim().toLowerCase(),
      fee = Number(f.get("courseFee"));
    if (name.length < 3) return notify("Ism kamida 3 ta belgi bo‘lsin.");
    if (!Number.isSafeInteger(fee) || fee < 0)
      return notify("Kurs narxini butun so‘mda kiriting.");
    if (
      data.users.some(
        (u) => u.id !== studentId && u.email.toLowerCase() === email,
      )
    )
      return notify("Ushbu email band.");
    if (
      update((d) =>
        Object.assign(
          d.users.find((u) => u.id === studentId),
          {
            name,
            email,
            phone: f.get("phone").trim(),
            courseFee: fee,
            notes: f.get("notes").trim(),
            active: f.get("active") === "true",
          },
        ),
      )
    )
      notify("O‘quvchi ma’lumotlari saqlandi.");
  }
  function addPayment(e) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      amount = Number(f.get("amount"));
    if (!Number.isSafeInteger(amount) || amount <= 0)
      return notify("Musbat, butun so‘m miqdorini kiriting.");
    if (!f.get("date")) return notify("To‘lov sanasini kiriting.");
    if (
      update((d) =>
        d.payments.push({
          id: uid(),
          userId: studentId,
          amount,
          date: f.get("date"),
          method: f.get("method"),
          note: f.get("note").trim(),
          createdAt: new Date().toISOString(),
          createdBy: admin.id,
        }),
      )
    ) {
      form.reset();
      notify("To‘lov qayd etildi.");
    }
  }
  function removePayment(payment) {
    if (
      !window.confirm(money(payment.amount) + " to‘lov yozuvi o‘chirilsinmi?")
    )
      return;
    update((d) => {
      d.payments = d.payments.filter((p) => p.id !== payment.id);
    });
  }
  return (
    <>
      <Link className="back" to="/admin/students">
        ← O‘quvchilar ro‘yxati
      </Link>
      <div className="page-heading">
        <div>
          <h1>{student.name}</h1>
          <p>
            {student.email} ·{" "}
            {student.active ? "Faol hisob" : "Bloklangan hisob"}
          </p>
        </div>
        <span className="badge">O‘quvchi tafsilotlari</span>
      </div>
      <div className="stats">
        <div className="panel stat">
          <strong>
            {watched}/{lessons.length}
          </strong>
          <span>Video oxirigacha ko‘rilgan</span>
        </div>
        <div className="panel stat">
          <strong>
            {lessons.filter((l) => passed(data, studentId, l.id)).length}
          </strong>
          <span>Testdan o‘tilgan darslar</span>
        </div>
        <div className="panel stat">
          <strong>{attempts.length}</strong>
          <span>Test urinishlari</span>
        </div>
        <div className="panel stat">
          <strong>
            {attempts.length
              ? Math.max(...attempts.map((a) => a.score)).toFixed(2) + "%"
              : "—"}
          </strong>
          <span>Eng yaxshi natija</span>
        </div>
      </div>
      <section className="panel detail-panel">
        <h3>Shaxsiy ma’lumotlar</h3>
        <p>
          Kurs:{" "}
          <strong>
            {data.courses.find((c) => c.id === student.courseId)?.title ||
              "Biriktirilmagan"}
          </strong>
        </p>
        <form onSubmit={saveProfile} key={studentId}>
          <div className="detail-grid">
            <label>
              To‘liq ism
              <input
                name="name"
                required
                minLength={3}
                defaultValue={student.name}
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                defaultValue={student.email}
              />
            </label>
            <label>
              Telefon
              <input
                name="phone"
                type="tel"
                maxLength={30}
                defaultValue={student.phone || ""}
              />
            </label>
            <label>
              Kurs umumiy narxi (so‘m)
              <input
                name="courseFee"
                type="number"
                min="0"
                step="1"
                required
                defaultValue={student.courseFee || 0}
              />
            </label>
            <label>
              Holat
              <select name="active" defaultValue={String(student.active)}>
                <option value="true">Faol</option>
                <option value="false">Bloklangan</option>
              </select>
            </label>
            <label>
              Admin izohi
              <textarea
                name="notes"
                maxLength={5000}
                defaultValue={student.notes || ""}
              />
            </label>
          </div>
          <button className="primary">Ma’lumotlarni saqlash</button>
        </form>
      </section>
      <section className="panel detail-panel">
        <h3>To‘lovlar</h3>
        <p className="muted small">
          Bu qo‘lda yuritiladigan hisob. Tugma bank orqali pul yechmaydi.
        </p>
        <div className="payment-totals">
          <span>
            Kurs narxi<strong>{money(totals.fee)}</strong>
          </span>
          <span>
            To‘langan<strong>{money(totals.paid)}</strong>
          </span>
          <span>
            Qarzdorlik<strong>{money(totals.debt)}</strong>
          </span>
          <span>
            Ortiqcha to‘lov<strong>{money(totals.credit)}</strong>
          </span>
        </div>
        <form onSubmit={addPayment}>
          <div className="detail-grid">
            <label>
              Miqdor (so‘m)
              <input name="amount" type="number" min="1" step="1" required />
            </label>
            <label>
              Sana
              <input
                name="date"
                type="date"
                required
                defaultValue={new Date().toLocaleDateString("en-CA")}
              />
            </label>
            <label>
              To‘lov usuli
              <select name="method">
                <option>Naqd</option>
                <option>Karta</option>
                <option>Bank o‘tkazmasi</option>
              </select>
            </label>
            <label>
              Izoh
              <input name="note" maxLength={500} />
            </label>
          </div>
          <button className="primary">+ To‘lovni qayd etish</button>
        </form>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Miqdor</th>
                <th>Usul</th>
                <th>Izoh</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {[...payments]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.date}</td>
                    <td>{money(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{p.note || "—"}</td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => removePayment(p)}
                      >
                        O‘chirish
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!payments.length && (
            <p className="muted small">To‘lovlar hali yo‘q.</p>
          )}
        </div>
      </section>
      <section className="panel detail-panel">
        <h3>Darslar va ko‘rilgan videolar</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Dars</th>
                <th>Holat</th>
                <th>Video</th>
                <th>Ko‘rilgan sana</th>
                <th>Test</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id}>
                  <td>{l.title}</td>
                  <td>{l.published ? "Faol" : "Nofaol"}</td>
                  <td>
                    {progress[l.id]?.watched ? "Yakunlangan" : "Yakunlanmagan"}
                  </td>
                  <td>
                    {progress[l.id]?.watchedAt
                      ? new Date(progress[l.id].watchedAt).toLocaleString(
                          "uz-UZ",
                        )
                      : "—"}
                  </td>
                  <td>
                    {passed(data, studentId, l.id) ? "O‘tilgan" : "O‘tilmagan"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel detail-panel">
        <h3>Test natijalari va javoblar</h3>
        {!attempts.length && (
          <p className="muted small">Hali test topshirilmagan.</p>
        )}
        {[...attempts].reverse().map((a, i) => (
          <details className="attempt-detail" key={a.id}>
            <summary>
              #{attempts.length - i} ·{" "}
              {a.lessonTitle ||
                data.lessons.find((l) => l.id === a.lessonId)?.title ||
                "O‘chirilgan dars"}{" "}
              · {a.score.toFixed(2)}% · {attemptPassed(a) ? "O‘tdi" : "O‘tmadi"}
            </summary>
            <p>
              {new Date(a.createdAt).toLocaleString("uz-UZ")} ·{" "}
              {a.total
                ? `${a.correctCount}/${a.total} to‘g‘ri javob`
                : "Eski natija"}
            </p>
            {a.questions?.map((q, index) => (
              <div className="submission" key={q.id}>
                <strong>
                  {index + 1}. {q.text}
                </strong>
                <p>Tanlangan javob: {q.options[a.answers?.[q.id]] ?? "—"}</p>
                <p>To‘g‘ri javob: {q.options[q.correct]}</p>
              </div>
            ))}
            {!a.questions && (
              <p>Eski versiyada javoblar tafsiloti saqlanmagan.</p>
            )}
          </details>
        ))}
      </section>
      <section className="panel detail-panel">
        <h3>Amaliy vazifalar</h3>
        {data.submissions
          .filter((s) => s.userId === studentId)
          .map((s) => (
            <div className="submission" key={s.id}>
              <strong>
                {data.lessons.find((l) => l.id === s.lessonId)?.title ||
                  "O‘chirilgan dars"}
              </strong>
              <p>{s.answer}</p>
              <span className="badge">
                {
                  {
                    pending: "Kutilmoqda",
                    approved: "Tasdiqlangan",
                    rejected: "Qaytarilgan",
                  }[s.status]
                }
              </span>
              <p>{s.feedback}</p>
            </div>
          ))}
        <Link className="purple small" to="/admin/reviews">
          Vazifalarni tekshirish →
        </Link>
      </section>
    </>
  );
}

```

## src/pages/Support.css

```css
.support-content {
  max-width: 720px;
}
.support-form {
  padding: 27px;
}
.support-form h3 {
  margin: 0 0 25px;
  font-size: 16px;
}
.support-form label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin: 20px 0;
}
.support-form select,
.support-form textarea {
  margin-top: 9px;
}
.support-form textarea {
  min-height: 150px;
}
.support-form .primary {
  width: 100%;
  justify-content: center;
}
.ticket {
  padding: 22px;
  margin: 15px 0;
}
.ticket strong {
  font-size: 12px;
}
.ticket p {
  font-size: 12px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ticket small {
  font-size: 10px;
  color: var(--muted);
}
.reply {
  background: #f5f0ff;
  padding: 15px;
  border-radius: 9px;
  margin: 15px 0;
}
.faq {
  padding: 25px;
}
.faq details {
  border-bottom: 1px solid var(--line);
  padding: 20px 0;
}
.faq summary {
  font-size: 13px;
  cursor: pointer;
}
.faq p {
  font-size: 12px;
  line-height: 1.9;
  color: var(--muted);
}

```

## src/pages/Support.jsx

```jsx
import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { uid } from "../services/db";
import "./Support.css";
export default function Support() {
  const { data, user, update, notify } = useApp();
  const [tab, setTab] = useState("message");
  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    update((d) =>
      d.tickets.unshift({
        id: uid(),
        userId: user.id,
        subject: f.get("subject"),
        message: f.get("message").trim(),
        reply: "",
        createdAt: new Date().toISOString(),
      }),
    );
    e.currentTarget.reset();
    notify("Xabaringiz yuborildi. Javob shu sahifada chiqadi.");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BIZ SIZ BILAN BIRGAMIZ</div>
          <h1>Qo‘llab-quvvatlash</h1>
          <p>Savollaringiz bormi? O‘rganish yo‘lida yordam beramiz.</p>
        </div>
        <MessageCircle className="purple" size={29} />
      </div>
      <div className="support-content">
        <div className="tabs">
          <button
            className={tab === "message" ? "active" : ""}
            onClick={() => setTab("message")}
          >
            Xabar yuborish
          </button>
          <button
            className={tab === "faq" ? "active" : ""}
            onClick={() => setTab("faq")}
          >
            Tez-tez so‘raladigan savollar
          </button>
        </div>
        {tab === "message" ? (
          <>
            <form className="panel support-form" onSubmit={submit}>
              <h3>Bizga xabar yuboring</h3>
              <label>
                Mavzu
                <select name="subject" required defaultValue="">
                  <option value="" disabled>
                    Mavzuni tanlang
                  </option>
                  <option>Darslar bo‘yicha savol</option>
                  <option>Texnik muammo</option>
                  <option>Sertifikat</option>
                  <option>Boshqa</option>
                </select>
              </label>
              <label>
                Xabaringiz
                <textarea
                  name="message"
                  required
                  minLength={5}
                  maxLength={5000}
                  placeholder="Savolingizni shu yerga yozing…"
                />
              </label>
              <button className="primary">
                <Send size={15} /> Yuborish
              </button>
            </form>
            <h3 className="section-title">Mening murojaatlarim</h3>
            {data.tickets
              .filter((t) => t.userId === user.id)
              .map((t) => (
                <article className="panel ticket" key={t.id}>
                  <div className="row">
                    <strong>{t.subject}</strong>
                    <span className={"badge " + (t.reply ? "green" : "")}>
                      {t.reply ? "Javob berildi" : "Kutilmoqda"}
                    </span>
                  </div>
                  <p>{t.message}</p>
                  {t.reply && (
                    <div className="reply">
                      <strong>Admin javobi</strong>
                      <p>{t.reply}</p>
                    </div>
                  )}
                  <small>{new Date(t.createdAt).toLocaleString("uz-UZ")}</small>
                </article>
              ))}
            {!data.tickets.some((t) => t.userId === user.id) && (
              <p className="muted small">Hozircha murojaatlar yo‘q.</p>
            )}
          </>
        ) : (
          <div className="panel faq">
            {[
              [
                "Keyingi dars qanday ochiladi?",
                "Oldingi faol darslar testidan 70% dan yuqori oling. Aynan 70% yetarli emas. Videoni ko‘rish va vazifani tasdiqlash sertifikat uchun talab qilinadi.",
              ],
              [
                "Sertifikatni qanday olaman?",
                "Barcha e’lon qilingan darslarni yakunlasangiz, Sertifikat sahifasida PDF saqlash tugmasi ochiladi.",
              ],
              [
                "Nega boshqa qurilmada ma’lumot yo‘q?",
                "Hozir demo rejimi ishlamoqda. Ma’lumotlar va videolar faqat ushbu brauzerda saqlanadi. Supabase keyingi bosqichda ulanadi.",
              ],
              [
                "Parolni qanday tiklayman?",
                "Demo rejimida administratorga murojaat qiling. U hisobingiz parolini yangilashi mumkin.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

```

## src/services/db.js

```js
export const KEY = "ai-academy-v1";
export const uid = () => crypto.randomUUID();
export const seed = {
  courses: [
    {
      id: "course-ai",
      title: "Sun’iy intellekt asoslari",
      price: 0,
      description: "AI Foundation",
    },
  ],
  users: [
    {
      id: "admin",
      name: "Sayyorbek",
      email: "admin@academy.uz",
      password: "Admin123!",
      role: "admin",
      active: true,
    },
    {
      id: "student",
      courseId: "course-ai",
      name: "Abdullayev Behzod",
      email: "student@academy.uz",
      password: "Student123!",
      role: "student",
      active: true,
    },
  ],
  lessons: [
    [
      "Kirish darsi: AI nima?",
      "Sun’iy intellekt bilan tanishing",
      12,
      "AI yordamida o‘zingizni tanishtiruvchi prompt yozing.",
    ],
    [
      "Prompt yozish asoslari",
      "Aniq savol — yaxshi natija",
      15,
      "Maqsad, kontekst va formatdan iborat prompt yozing.",
    ],
    [
      "AI yordamida matn yaratish",
      "G‘oyalarni so‘zlarga aylantiring",
      18,
      "AI yordamida mahsulot uchun qisqa matn tayyorlang.",
    ],
    [
      "Rasm generatsiya qilish",
      "Tasavvuringizga shakl bering",
      20,
      "Rasm yaratish uchun batafsil prompt tuzing.",
    ],
    [
      "Amaliy loyiha: Mini chatbot",
      "Birinchi loyihangizni yarating",
      25,
      "Chatbot loyihangiz va ishlash tartibini tushuntiring.",
    ],
  ].map((x, i) => ({
    id: "lesson-" + i,
    courseId: "course-ai",
    title: x[0],
    description: x[1],
    duration: x[2],
    task: x[3],
    video: "",
    fileId: "",
    published: true,
    questions: [
      {
        id: "q-" + i,
        text:
          i === 0
            ? "AI nimani anglatadi?"
            : "Yaxshi prompt nimadan boshlanadi?",
        options:
          i === 0
            ? [
                "Sun’iy intellekt",
                "Internet tezligi",
                "Kompyuter xotirasi",
                "Dastur hajmi",
              ]
            : [
                "Aniq maqsaddan",
                "Tasodifiy so‘zlardan",
                "Faqat emojidan",
                "Bo‘sh matndan",
              ],
        correct: 0,
      },
    ],
  })),
  progress: {},
  submissions: [],
  attempts: [],
  tickets: [],
  payments: [],
  testSessions: {},
};
export function read() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d?.users || !d?.lessons) return structuredClone(seed);
    return {
      ...structuredClone(seed),
      ...d,
      courses: d.courses || structuredClone(seed.courses),
      users: d.users.map((u) =>
        u.role === "student" ? { courseId: "course-ai", ...u } : u,
      ),
      lessons: d.lessons.map((l) => ({ courseId: "course-ai", ...l })),
      payments: d.payments || [],
      testSessions: d.testSessions || {},
    };
  } catch {
    return structuredClone(seed);
  }
}
export function write(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}
// Test sharti: aynan 70% yetarli emas. Xom nisbat bo‘yicha tekshiriladi.
export function attemptPassed(a) {
  return Number.isInteger(a.correctCount) && a.total > 0
    ? a.correctCount * 100 > a.total * 70
    : a.score > 70;
}
export function passed(d, userId, lessonId) {
  return d.attempts.some(
    (a) => a.userId === userId && a.lessonId === lessonId && attemptPassed(a),
  );
}
export function completed(d, userId, lessonId) {
  return passed(d, userId, lessonId);
}
export function unlocked(d, userId, lessonId) {
  const list = studentLessons(d, userId).filter((l) => l.published);
  const index = list.findIndex((l) => l.id === lessonId);
  return (
    index >= 0 && list.slice(0, index).every((l) => passed(d, userId, l.id))
  );
}
export function gradeAttempt(session, answers) {
  const questions = session.questions;
  if (!questions.length) throw Error("Test savollari yo‘q.");
  if (
    questions.some(
      (q) =>
        !Number.isInteger(answers[q.id]) ||
        answers[q.id] < 0 ||
        answers[q.id] >= q.options.length,
    )
  )
    throw Error("Barcha savollarga javob bering.");
  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correct,
  ).length;
  return {
    ...session,
    answers: { ...answers },
    total: questions.length,
    correctCount,
    score: (correctCount / questions.length) * 100,
    createdAt: new Date().toISOString(),
  };
}
export function recordAttempt(d, session, answers) {
  const key = session.userId + ":" + session.lessonId;
  if (d.attempts.some((a) => a.id === session.id)) return;
  if (d.testSessions[key]?.id !== session.id)
    throw Error("Test sessiyasi o‘zgargan. Sahifani yangilang.");
  d.attempts.push(gradeAttempt(session, answers));
  delete d.testSessions[key];
}
export function paymentSummary(d, user) {
  const paid = (d.payments || [])
    .filter((x) => x.userId === user.id)
    .reduce((n, x) => n + Number(x.amount), 0);
  const fee = Number(user.courseFee) || 0;
  return {
    fee,
    paid,
    debt: Math.max(0, fee - paid),
    credit: Math.max(0, paid - fee),
  };
}
const open = () =>
  new Promise((res, rej) => {
    const r = indexedDB.open("academy-media", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
export async function putFile(file) {
  const db = await open();
  const id = uid();
  return new Promise((res, rej) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => {
      db.close();
      res(id);
    };
    tx.onerror = () => {
      db.close();
      rej(tx.error);
    };
  });
}
export async function getFile(id) {
  const db = await open();
  return new Promise((res, rej) => {
    const r = db.transaction("files").objectStore("files").get(id);
    r.onsuccess = () => {
      db.close();
      res(r.result);
    };
    r.onerror = () => {
      db.close();
      rej(r.error);
    };
  });
}

export function studentLessons(d, userId) {
  const user = d.users.find((u) => u.id === userId);
  return user?.courseId
    ? d.lessons.filter((l) => l.courseId === user.courseId)
    : [];
}

```

## src/services/supabase.js

```js
import { createClient } from "@supabase/supabase-js";
const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
// Keyingi bosqich: demo repository o‘rniga Supabase Auth, RLS va Storage adapteri ulanadi.

```
