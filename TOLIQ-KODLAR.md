# AI Academy v4.1 — barcha kodlar

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
import Finance from "./pages/Finance";
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
          <Route path="course/:courseId" element={<Course />} />
          <Route path="lesson/:id" element={<Lesson />} />
          <Route path="certificate" element={<Certificate />} />
          <Route path="certificate/:courseId" element={<Certificate />} />
          <Route path="support" element={<Support />} />
        </Route>
      </Route>
      <Route element={<Protected role="admin" />}>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Admin />} />
          <Route path="lessons" element={<AdminLessons />} />
          <Route path="finance" element={<Finance />} />
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

## src/__tests__/flows.test.jsx

```jsx
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { AppProvider } from "../context/AppContext";
import { KEY, seed, migrate } from "../services/db";
jest.mock("../services/certificate", () => ({
  downloadCertificate: jest.fn().mockResolvedValue(undefined),
}));
let host, root, data;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  data = migrate(structuredClone(seed));
  data.courses.push({
    id: "react",
    title: "React kursi",
    price: 500000,
    description: "React o‘rganish",
  });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
function render(route, user = "admin") {
  localStorage.setItem(KEY, JSON.stringify(data));
  localStorage.setItem("academy-user", user);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[route]}>
        <AppProvider>
          <App />
        </AppProvider>
      </MemoryRouter>,
    ),
  );
}
function button(text) {
  const el = [...host.querySelectorAll("button")].find(
    (e) => e.textContent === text,
  );
  if (!el) throw Error("Button not found: " + text);
  act(() => el.click());
}
function input(el, value) {
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
test("both roles confirm log out; cancel preserves session, yes returns to login", () => {
  render("/student", "student");
  expect(host.textContent).toContain("Mening kurslarim");
  button(" Log out");
  expect(host.querySelector('[role="dialog"]')).not.toBeNull();
  button("Yo‘q, qolaman");
  expect(localStorage.getItem("academy-user")).toBe("student");
  button(" Log out");
  button("Ha, chiqish");
  expect(localStorage.getItem("academy-user")).toBeNull();
  expect(host.textContent).toContain("Tizimga kirish");
});
test("admin creates student with two checked courses and opens personal page", () => {
  render("/admin/students");
  button("+ Talaba qo‘shish");
  const dialog = host.querySelector('[role="dialog"]');
  const fields = dialog.querySelectorAll("input");
  input(fields[0], "Ikki Kurs Talaba");
  input(fields[1], "ikki@test.uz");
  input(fields[2], "Password123");
  act(() =>
    dialog.querySelectorAll('input[type="checkbox"]').forEach((c) => c.click()),
  );
  act(() =>
    dialog
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(host.textContent).toContain("Ma’lumot va kurslarni tahrirlash");
  const saved = JSON.parse(localStorage.getItem(KEY));
  const student = saved.users.find((u) => u.email === "ikki@test.uz");
  expect(saved.enrollments.filter((e) => e.userId === student.id)).toHaveLength(
    2,
  );
  expect(host.textContent).toContain("React kursi");
});
test("student sees only enrolled courses; lesson has three tabs", () => {
  render("/student/lesson/lesson-0", "student");
  expect(host.querySelectorAll('[role="tab"]')).toHaveLength(3);
  button("3. Qo‘shimcha materiallar");
  expect(host.textContent).toContain("Hozircha material yuklanmagan.");
  button("2. Amaliy");
  expect(host.textContent).toContain("Amaliy ishni topshirish");
  expect(host.querySelector(".subnav").textContent).not.toContain(
    "React kursi",
  );
});
test("finance debtor button displays all debtors and personal links", () => {
  data.enrollments[0].fee = 600000;
  render("/admin/finance");
  const el = [...host.querySelectorAll("button")].find((e) =>
    e.textContent.includes("Qarzdorlar"),
  );
  act(() => el.click());
  expect(host.textContent).toContain("Barcha qarzdorlar");
  expect(
    host.querySelector('a[href="/admin/students/student"]'),
  ).not.toBeNull();
  expect(host.textContent).toContain("600");
});
test("admin logout uses same confirmation", () => {
  render("/admin");
  button(" Log out");
  expect(host.textContent).toContain("Hisobdan chiqmoqchimisiz?");
});

test('dashboard payment modal records payment and refreshes balance',()=>{
 data.enrollments[0].fee=600000;render('/admin');
 const trigger=[...host.querySelectorAll('button')].find(e=>e.textContent.includes('To‘lov qo‘shish'));act(()=>trigger.click());
 const dialog=host.querySelector('[role="dialog"]');
 function select(el,value){act(()=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));});}
 select(dialog.querySelectorAll('select')[0],'student');
 select(dialog.querySelectorAll('select')[1],'course-ai');
 input(dialog.querySelector('input[name="amount"]'),'100000');
 act(()=>dialog.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(host.querySelector('[role="dialog"]')).toBeNull();
 expect(JSON.parse(localStorage.getItem(KEY)).payments[0].amount).toBe(100000);
 expect(host.textContent).toContain('To‘lov saqlandi.');
});

test('dashboard courses card opens searchable modal and allows editing',()=>{
 render('/admin');
 const trigger=[...host.querySelectorAll('button')].find(e=>e.classList.contains('stat')&&e.textContent.includes('Kurslar'));
 act(()=>trigger.click());
 const dialog=host.querySelector('[role="dialog"]');expect(dialog.textContent).toContain('Kurslarni boshqarish');
 input(dialog.querySelector('input[aria-label="Kurslarni qidirish"]'),'React');
 expect(dialog.querySelectorAll('.course-manage-card')).toHaveLength(1);
 act(()=>dialog.querySelector('.course-manage-card button').click());
 const title=dialog.querySelector('form input');input(title,'React yangi nom');
 act(()=>dialog.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(dialog.textContent).toContain('React yangi nom');
 expect(JSON.parse(localStorage.getItem(KEY)).courses.find(c=>c.id==='react').title).toBe('React yangi nom');
});

```

## src/components/CourseManager.css

```css
.course-modal-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 24px;
}
.course-search {
  position: relative;
  flex: 1;
  min-width: 200px;
}
.course-search > svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
}
.course-search input {
  padding-left: 46px;
  margin: 0;
}
.course-modal-list {
  display: grid;
  gap: 18px;
}
.course-manage-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px;
}
.course-manage-icon {
  padding: 12px;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--primary);
  display: flex;
}
.course-manage-body {
  flex: 1;
  min-width: 180px;
}
.course-manage-body h3 {
  margin: 0 0 8px;
}
.course-manage-body p {
  color: var(--muted);
  margin: 0 0 14px;
}
.course-card-meta {
  display: flex;
  gap: 12px 20px;
  align-items: center;
  flex-wrap: wrap;
  font-size: var(--fs-base);
}
.course-card-meta strong {
  color: var(--primary);
}
.course-card-meta span,
.course-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.course-back {
  margin-top: 18px;
}
.course-manage-card > .secondary {
  margin-left: auto;
}
@media (max-width: 600px) {
  .course-manage-card {
    padding: 18px;
  }
  .course-manage-card > .secondary {
    width: 100%;
  }
  .course-modal-toolbar > .primary {
    width: 100%;
  }
}

```

## src/components/CourseManager.jsx

```jsx
import { useState } from "react";
import { BookOpen, Plus, Search, Users, Pencil, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { uid, money, integer } from "../services/db";
import Modal from "./Modal";
import "./CourseManager.css";

export default function CourseManager({ open, onOpenChange }) {
  const { data, update, notify } = useApp();
  const [localOpen, setLocalOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState("");
  const visible = open ?? localOpen;
  function show(value) {
    (onOpenChange || setLocalOpen)(value);
    if (!value) {
      setDraft(null);
      setQuery("");
    }
  }
  function create() {
    setDraft({ id: uid(), title: "", price: "", description: "" });
    show(true);
  }
  function save(e) {
    e.preventDefault();
    const title = draft.title.trim();
    if (title.length < 2)
      return notify("Kurs nomi kamida 2 belgidan iborat bo‘lsin.");
    const ok = update((d) => {
      const price = integer(draft.price);
      if (
        d.courses.some(
          (c) =>
            c.id !== draft.id && c.title.toLowerCase() === title.toLowerCase(),
        )
      )
        throw Error("Bu nomdagi kurs mavjud.");
      const course = {
        ...draft,
        title,
        price,
        description: draft.description.trim(),
      };
      const index = d.courses.findIndex((c) => c.id === draft.id);
      if (index < 0) d.courses.push(course);
      else d.courses[index] = course;
    });
    if (ok) {
      setDraft(null);
      setQuery("");
      notify("Kurs saqlandi.");
    }
  }
  const courses = data.courses.filter((c) =>
    (c.title + " " + c.description)
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          setDraft(null);
          show(true);
        }}
      >
        <BookOpen size={22} /> Kurslar ({data.courses.length})
      </button>
      <button type="button" className="secondary" onClick={create}>
        <Plus size={22} /> Yangi kurs
      </button>
      {visible && (
        <Modal
          title={draft ? "Kurs ma’lumotlari" : "Kurslarni boshqarish"}
          onClose={() => show(false)}
        >
          {draft ? (
            <>
              <button
                className="text-btn course-back"
                type="button"
                onClick={() => setDraft(null)}
              >
                <ArrowLeft size={20} /> Kurslar ro‘yxatiga
              </button>
              <form onSubmit={save}>
                <label>
                  Kurs nomi
                  <input
                    autoFocus
                    required
                    minLength={2}
                    maxLength={150}
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
                    max="1000000000000"
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
                    maxLength={3000}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                </label>
                <p className="muted">
                  Yangi narx avvalgi talabalar bilan kelishilgan narxni
                  o‘zgartirmaydi.
                </p>
                <div className="button-row">
                  <button className="primary">Saqlash</button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setDraft(null)}
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="course-modal-toolbar">
                <div className="course-search">
                  <Search size={22} />
                  <input
                    aria-label="Kurslarni qidirish"
                    placeholder="Kurs nomi bo‘yicha qidiring…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <button className="primary" onClick={create}>
                  <Plus size={22} /> Yangi kurs
                </button>
              </div>
              <p className="muted">
                {courses.length} ta kurs · narxlar va o‘quvchilar
              </p>
              <div className="course-modal-list">
                {courses.map((c) => (
                  <article className="course-manage-card" key={c.id}>
                    <div className="course-manage-icon">
                      <BookOpen size={26} />
                    </div>
                    <div className="course-manage-body">
                      <h3>{c.title}</h3>
                      <p>{c.description || "Tavsif kiritilmagan"}</p>
                      <div className="course-card-meta">
                        <strong>{money(c.price)}</strong>
                        <span>
                          <Users size={20} />{" "}
                          {
                            data.enrollments.filter((e) => e.courseId === c.id)
                              .length
                          }{" "}
                          talaba
                        </span>
                        <span>
                          {
                            data.lessons.filter(
                              (l) => l.courseId === c.id && !l.archived,
                            ).length
                          }{" "}
                          dars
                        </span>
                      </div>
                    </div>
                    <button
                      className="secondary"
                      onClick={() => setDraft({ ...c })}
                    >
                      <Pencil size={20} /> Tahrirlash
                    </button>
                  </article>
                ))}
              </div>
              {!courses.length && (
                <div className="empty">
                  {query
                    ? "Qidiruvga mos kurs topilmadi."
                    : "Hali kurs yo‘q. Yangi kurs yarating."}
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}

```

## src/components/Layout.css

```css
.topbar {
  position: fixed;
  inset: 0 0 auto 0;
  height: var(--header-height);
  z-index: 40;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 28px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--fs-h2);
  font-weight: 700;
}
.brand > span {
  padding: 4px 12px;
  border-radius: 10px;
  background: var(--primary);
  color: var(--surface);
  font-size: var(--fs-h3);
}
.header-account {
  display: flex;
  align-items: center;
  gap: 22px;
  font-size: var(--fs-base);
}
.sidebar {
  position: fixed;
  left: 0;
  top: var(--header-height);
  bottom: 0;
  width: var(--sidebar-width);
  padding: 25px 18px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  z-index: 30;
}
.nav-label {
  padding: 0 12px;
}
.sidebar nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 10px;
  font-size: var(--fs-base);
  margin: 6px 0;
}
.sidebar nav a.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}
.sidebar-bottom {
  padding: 28px 12px;
}
.subnav {
  padding-left: 18px;
  border-left: 2px solid var(--primary-border);
  margin-left: 20px;
}
.subnav a {
  overflow-wrap: anywhere;
}
.course-toggle {
  font-size: var(--fs-small);
}
.main-wrap {
  margin-left: var(--sidebar-width);
  padding-top: var(--header-height);
}
main {
  padding: 36px;
  max-width: 1500px;
  margin: auto;
  min-height: calc(100vh - var(--header-height));
}
footer {
  padding: 24px 36px;
  color: var(--muted);
  font-size: var(--fs-small);
}
.mobile-menu {
  display: none;
}
@media (max-width: 1000px) {
  .mobile-menu {
    display: inline-flex;
  }
  .sidebar {
    display: none;
    width: min(90vw, 360px);
    box-shadow: var(--shadow);
  }
  .sidebar.open {
    display: block;
  }
  .main-wrap {
    margin-left: 0;
  }
  .header-account > span {
    display: none;
  }
  .topbar {
    padding: 14px 18px;
  }
  main {
    padding: 25px 18px;
  }
  .topbar .brand {
    font-size: var(--fs-medium);
  }
  .topbar .secondary {
    padding: 10px 12px;
  }
  .brand > span {
    padding: 4px 8px;
  }
}
@media (max-width: 600px) {
  .topbar .brand > span {
    display: none;
  }
  .topbar .brand {
    font-size: var(--fs-base);
  }
  .topbar {
    gap: 8px;
  }
  .header-account {
    gap: 8px;
  }
}

```

## src/components/Layout.jsx

```jsx
import { useState } from "react";
import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
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
      <span>AI</span> Academy
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

```

## src/components/Modal.jsx

```jsx
import { useEffect, useRef } from "react";
export default function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const old = document.activeElement;
    ref.current?.focus();
    const saved = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = saved;
      old?.focus();
    };
  }, []);
  function key(e) {
    if (e.key === "Escape") onClose();
    if (e.key === "Tab") {
      const list = ref.current.querySelectorAll(
        "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
      );
      if (!list.length) return;
      const first = list[0],
        last = list[list.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        ref={ref}
        tabIndex={-1}
        onKeyDown={key}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="row">
          <h2>{title}</h2>
          <button className="ghost" aria-label="Yopish" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

```

## src/components/PaymentForm.jsx

```jsx
import { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  uid,
  enrollmentsFor,
  enrollmentSummary,
  addPayment,
  localDate,
  money,
} from "../services/db";
export default function PaymentForm({ studentId, onSaved }) {
  const { data, user, update } = useApp();
  const [selected, setSelected] = useState(studentId || ""),
    [course, setCourse] = useState(""),
    [busy, setBusy] = useState(false);
  const choices = enrollmentsFor(data, selected);
  const enrollment = choices.find((e) => e.courseId === course);
  function save(e) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget,
      f = new FormData(form);
    setBusy(true);
    const ok = update((d) =>
      addPayment(d, {
        id: uid(),
        userId: selected,
        courseId: course,
        amount: f.get("amount"),
        date: f.get("date"),
        method: f.get("method"),
        note: f.get("note").trim(),
        createdBy: user.id,
      }),
    );
    setBusy(false);
    if (ok) {
      form.reset();
      setCourse("");
      onSaved?.();
    }
  }
  return (
    <form onSubmit={save}>
      <div className="form-grid">
        {!studentId && (
          <label>
            Talaba
            <select
              required
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setCourse("");
              }}
            >
              <option value="">Talabani tanlang</option>
              {data.users
                .filter((u) => u.role === "student")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          Kurs
          <select
            required
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option value="">Kursni tanlang</option>
            {choices.map((e) => (
              <option key={e.id} value={e.courseId}>
                {data.courses.find((c) => c.id === e.courseId)?.title} · qarz{" "}
                {money(enrollmentSummary(data, e).debt)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Miqdor (so‘m)
          <input
            required
            name="amount"
            type="number"
            min="1"
            step="1"
            max={
              enrollment ? enrollmentSummary(data, enrollment).debt : undefined
            }
          />
        </label>
        <label>
          Sana
          <input
            name="date"
            type="date"
            required
            max={localDate()}
            defaultValue={localDate()}
          />
        </label>
        <label>
          Usul
          <select name="method">
            <option>Naqd</option>
            <option>Karta</option>
            <option>Bank o‘tkazmasi</option>
          </select>
        </label>
        <label>
          Izoh
          <input name="note" maxLength={1000} />
        </label>
      </div>
      <button
        className="primary"
        disabled={
          busy || !enrollment || !enrollmentSummary(data, enrollment).debt
        }
      >
        To‘lovni saqlash
      </button>
      <p className="muted">
        To‘lov yozuvi qo‘lda kiritiladi; bu bank tranzaksiyasi emas.
      </p>
    </form>
  );
}

```

## src/components/StudentForm.jsx

```jsx
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { uid, enrollmentsFor, saveStudent, money } from "../services/db";
import Modal from "./Modal";
export default function StudentForm({ student, onClose, onSaved }) {
  const { data, update } = useApp();
  const [draft, setDraft] = useState(() =>
    student
      ? { ...student }
      : {
          id: uid(),
          name: "",
          email: "",
          password: "",
          phone: "",
          notes: "",
          role: "student",
          active: true,
          createdAt: new Date().toISOString(),
        },
  );
  const [selected, setSelected] = useState(() =>
    student ? enrollmentsFor(data, student.id).map((e) => e.courseId) : [],
  );
  const [error, setError] = useState("");
  function field(k, v) {
    setDraft({ ...draft, [k]: v });
  }
  function save(e) {
    e.preventDefault();
    setError("");
    const ok = update((d) => saveStudent(d, draft, selected));
    if (ok) onSaved(draft.id);
    else setError("Saqlanmadi. Ekrandagi xabarni tekshiring.");
  }
  return (
    <Modal
      title={student ? "Talaba va kurslarni tahrirlash" : "Yangi talaba"}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <div className="form-grid">
          <label>
            To‘liq ism
            <input
              required
              minLength={3}
              value={draft.name}
              onChange={(e) => field("name", e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={draft.email}
              onChange={(e) => field("email", e.target.value)}
            />
          </label>
          <label>
            Demo parol
            <input
              type="password"
              required
              minLength={8}
              value={draft.password}
              onChange={(e) => field("password", e.target.value)}
            />
          </label>
          <label>
            Telefon
            <input
              type="tel"
              value={draft.phone || ""}
              onChange={(e) => field("phone", e.target.value)}
            />
          </label>
          <label>
            Holat
            <select
              value={String(draft.active)}
              onChange={(e) => field("active", e.target.value === "true")}
            >
              <option value="true">Faol</option>
              <option value="false">Bloklangan</option>
            </select>
          </label>
          <label>
            Izoh
            <textarea
              value={draft.notes || ""}
              onChange={(e) => field("notes", e.target.value)}
            />
          </label>
        </div>
        <fieldset>
          <legend>Kurslarni tanlang — bir nechtasini belgilash mumkin</legend>
          {data.courses.map((c) => (
            <label key={c.id} className="check-card">
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, c.id]
                      : selected.filter((id) => id !== c.id),
                  )
                }
              />
              <span>
                {c.title}
                <small>
                  {money(
                    enrollmentsFor(data, draft.id).find(
                      (e) => e.courseId === c.id,
                    )?.fee ?? c.price,
                  )}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
        <p>
          Tarixi yoki to‘lovi bor kursni olib tashlab bo‘lmaydi. Yangi kurs
          uchun amaldagi narx saqlanadi.
        </p>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={!selected.length}>
          Saqlash
        </button>
      </form>
    </Modal>
  );
}

```

## src/context/AppContext.jsx

```jsx
import { createContext, useContext, useRef, useState, useEffect } from "react";
import { read, write } from "../services/db";
const Context = createContext(null);
const KEY = "academy-user";
export function AppProvider({ children }) {
  const [data, setData] = useState(read);
  const current = useRef(data);
  const lastSaved = useRef(localStorage.getItem("ai-academy-v1"));
  const [session, setSession] = useState(
    () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY),
  );
  const [notice, setNotice] = useState("");
  const user = data.users.find((u) => u.id === session && u.active);
  useEffect(() => {
    function changed(event) {
      if (event.key === "ai-academy-v1") {
        try {
          const next = read();
          current.current = next;
          setData(next);
          lastSaved.current = event.newValue;
        } catch (e) {
          setNotice(e.message);
        }
      }
    }
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  function update(callback) {
    try {
      if (localStorage.getItem("ai-academy-v1") !== lastSaved.current) {
        const latest = read();
        current.current = latest;
        setData(latest);
        lastSaved.current = localStorage.getItem("ai-academy-v1");
        throw Error(
          "Boshqa oynada ma’lumot o‘zgardi. Tekshirib qayta saqlang.",
        );
      }
      const next = structuredClone(current.current);
      callback(next);
      write(next);
      lastSaved.current = localStorage.getItem("ai-academy-v1");
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
    lastSaved.current = localStorage.getItem("ai-academy-v1");
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
:root {
  --primary: #080acd;
  --primary-hover: #0608a7;
  --primary-soft: #eceeff;
  --primary-border: #c5c9f7;
  --background: #f4f6fc;
  --surface: #ffffff;
  --surface-soft: #f8f9fd;
  --text: #17213b;
  --muted: #59657b;
  --border: #dce2ee;
  --success: #147449;
  --success-soft: #e5f5ed;
  --danger: #ae233f;
  --danger-soft: #fff0f3;
  --warning: #875900;
  --overlay: rgba(14, 22, 49, 0.6);
  --shadow-color: rgba(12, 26, 75, 0.09);
  --video-bg: #0c1025;
  --video-text: #ffffff;
  --watermark: rgba(255, 255, 255, 0.65);
  --transparent: transparent;
  --gradient: linear-gradient(135deg, var(--primary), var(--primary-hover));
  --hero-gradient: linear-gradient(130deg, var(--primary-soft), var(--surface));
  --shadow: 0 8px 30px var(--shadow-color);
  --radius: 16px;
  --sidebar-width: 290px;
  --header-height: 88px;
  --fs-small: 18px;
  --fs-base: 18px;
  --fs-label: 18px;
  --fs-medium: 20px;
  --fs-h3: 22px;
  --fs-h2: 28px;
  --fs-title: clamp(28px, 3vw, 40px);
  --fs-stat: 32px;
  --fs-hero: clamp(36px, 5vw, 64px);
  --fs-art: 80px;
  --cert-fs-brand: 40px;
  --cert-fs-title: 80px;
  --cert-fs-subtitle: 28px;
  --cert-fs-name: 62px;
  --cert-fs-course: 44px;
  --cert-fs-score: 38px;
  --cert-fs-body: 27px;
  --cert-fs-date: 26px;
  --cert-fs-id: 22px;
  --cert-fs-footer: 24px;
  --font: Arial, Helvetica, sans-serif;
}
* {
  box-sizing: border-box;
}
html {
  scroll-padding-top: calc(var(--header-height) + 24px);
}
body {
  margin: 0;
  background: var(--background);
  color: var(--text);
  font-family: var(--font);
  font-size: var(--fs-base);
  line-height: 1.6;
}
button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}
button,
a,
input,
select,
textarea {
  -webkit-tap-highlight-color: var(--transparent);
}
button {
  cursor: pointer;
  border: 0;
  border-radius: 10px;
  min-height: 44px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
a {
  text-decoration: none;
  color: inherit;
}
a:hover {
  color: var(--primary);
}
button,
a {
  transition:
    background 0.15s,
    box-shadow 0.15s;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
summary:focus-visible {
  outline: 3px solid var(--primary-border);
  outline-offset: 3px;
}
h1 {
  font-size: var(--fs-title);
  line-height: 1.2;
  letter-spacing: -1px;
}
h2 {
  font-size: var(--fs-h2);
  line-height: 1.3;
}
h3 {
  font-size: var(--fs-h3);
  line-height: 1.4;
}
h1,
h2,
h3,
p {
  overflow-wrap: anywhere;
}
small {
  font-size: var(--fs-small);
}
label {
  font-size: var(--fs-label);
  display: block;
  font-weight: 600;
}
input,
select,
textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  font-size: var(--fs-base);
  min-height: 48px;
  margin-top: 8px;
}
input::placeholder,
textarea::placeholder {
  color: var(--muted);
}
textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}
input[type="checkbox"],
input[type="radio"] {
  width: 22px;
  height: 22px;
  min-height: 22px;
  margin: 0;
  accent-color: var(--primary);
  flex-shrink: 0;
}
form > label {
  margin: 20px 0;
}
form > .primary {
  margin-top: 20px;
}
fieldset {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}
legend {
  padding: 0 8px;
  font-weight: 600;
}
summary {
  cursor: pointer;
}
svg {
  flex-shrink: 0;
}
.primary,
.secondary,
.ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 18px;
  font-size: var(--fs-base);
  font-weight: 600;
  border-radius: 10px;
}
.primary {
  background: var(--primary);
  color: var(--surface);
}
.primary:hover {
  background: var(--primary-hover);
  color: var(--surface);
}
.secondary {
  background: var(--primary-soft);
  color: var(--primary);
}
.secondary:hover {
  background: var(--primary-border);
}
.ghost {
  background: var(--surface-soft);
  color: var(--text);
}
.text-btn {
  background: var(--transparent);
  color: var(--primary);
  font-size: var(--fs-base);
  padding: 8px;
}
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.detail-panel,
.table-panel,
.task-panel,
.review,
.support-form,
.faq {
  padding: 28px;
  margin: 24px 0;
}
.row,
.button-row,
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.button-row {
  justify-content: flex-start;
}
.page-heading {
  margin-bottom: 28px;
}
.page-heading h1 {
  margin: 0 0 12px;
}
.page-heading p {
  margin: 0;
  color: var(--muted);
}
.muted,
.small,
.nav-label {
  color: var(--muted);
  font-size: var(--fs-small);
}
.purple {
  color: var(--primary);
}
.badge,
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: var(--fs-small);
}
.badge.green {
  color: var(--success);
  background: var(--success-soft);
}
.danger,
.error {
  color: var(--danger);
}
.error {
  background: var(--danger-soft);
  padding: 16px;
  border-radius: 10px;
}
.empty {
  padding: 45px 20px;
  text-align: center;
  color: var(--muted);
}
.back {
  display: inline-flex;
  gap: 8px;
  color: var(--primary);
  margin-bottom: 20px;
}
.inline-button {
  display: inline-flex;
  margin: 24px 0;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 20px;
  margin: 28px 0;
}
.stat {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  color: var(--text);
}
.stat strong {
  font-size: var(--fs-stat);
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.stat span {
  font-size: var(--fs-small);
  color: var(--muted);
}
.form-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  margin: 20px 0;
}
.search-box {
  max-width: 650px;
  margin: 16px 0 24px;
}
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--fs-base);
}
th {
  color: var(--muted);
  font-size: var(--fs-small);
  font-weight: 600;
}
th,
td {
  padding: 18px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
  min-width: 120px;
}
td small {
  display: block;
  color: var(--muted);
  margin-top: 6px;
  overflow-wrap: anywhere;
}
td .purple {
  font-weight: 600;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  z-index: 100;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  width: 760px;
  max-width: 100%;
  max-height: 90dvh;
  overflow: auto;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 28px;
  box-shadow: var(--shadow);
}
.modal.narrow {
  width: 620px;
}
.modal h2 {
  margin: 0;
}
.toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  max-width: min(620px, calc(100vw - 48px));
  padding: 20px;
  background: var(--text);
  color: var(--surface);
  border-radius: 12px;
  box-shadow: var(--shadow);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: var(--fs-base);
}
.toast button {
  background: var(--transparent);
  color: var(--surface);
  padding: 8px 14px;
  font-size: var(--fs-h2);
}
.check-card,
.test-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin: 12px 0;
  background: var(--surface-soft);
  font-weight: 400;
}
.check-card small {
  display: block;
  color: var(--muted);
}
.tabs {
  display: flex;
  gap: 12px;
  overflow: auto;
  margin: 28px 0;
  padding-bottom: 4px;
}
.tabs button {
  white-space: nowrap;
  background: var(--surface);
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 12px 20px;
  font-size: var(--fs-base);
}
.tabs button.active {
  background: var(--primary);
  color: var(--surface);
  border-color: var(--primary);
}
.submission,
.answer-text,
.reply {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.result {
  padding: 20px;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 12px;
}
.attempt-detail {
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
}
.attempt-detail summary {
  font-weight: 600;
}
.progress {
  height: 10px;
  background: var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin: 20px 0;
}
.progress i {
  display: block;
  height: 100%;
  background: var(--primary);
  border-radius: 12px;
}
.material-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
}
.material-row span {
  overflow-wrap: anywhere;
  min-width: 0;
}
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 24px;
}
.course-card {
  display: block;
  padding: 28px;
  box-shadow: var(--shadow);
}
.course-card p {
  color: var(--muted);
}
.course-card strong {
  color: var(--primary);
}
.course-card:hover {
  border-color: var(--primary);
}
.lesson-list,
.admin-lessons {
  display: grid;
  gap: 18px;
}
.lesson-row,
.admin-lesson {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 24px;
  flex-wrap: wrap;
}
.lesson-number {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 50%;
  font-size: var(--fs-medium);
}
.grow {
  flex: 1;
  min-width: 180px;
}
.grow h3 {
  margin: 0 0 12px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.actions button {
  padding: 12px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: var(--fs-base);
}
.question-editor {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}
.question-editor > label {
  margin: 18px 0;
}
.option-editor {
  display: flex;
  gap: 12px;
  align-items: center;
}
.course-manager {
  width: 100%;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.course-manager .row {
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.course-manager summary {
  color: var(--primary);
}
.support-content {
  max-width: 900px;
}
.faq details {
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
}
.ticket {
  padding: 24px;
  margin: 18px 0;
}
.ticket p {
  white-space: pre-wrap;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary);
  font-size: var(--fs-small);
  font-weight: 600;
}
.check {
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-title {
  margin-top: 30px;
}
@media (max-width: 700px) {
  .form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .detail-panel,
  .table-panel,
  .task-panel,
  .review,
  .support-form {
    padding: 18px;
  }
  .modal-backdrop {
    padding: 12px;
  }
  .modal {
    padding: 20px;
  }
  .page-heading {
    align-items: flex-start;
  }
  .stats {
    grid-template-columns: 1fr;
  }
  .primary,
  .secondary {
    white-space: normal;
  }
  .lesson-row,
  .admin-lesson {
    padding: 18px;
  }
  th,
  td {
    padding: 14px 10px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    scroll-behavior: auto !important;
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
/* Umumiy UI stillari src/index.css ichida, ranglar va shriftlar :root orqali boshqariladi. */

```

## src/pages/Admin.jsx

```jsx
import { useState } from "react";
import { Wallet } from "lucide-react";
import Modal from "../components/Modal";
import PaymentForm from "../components/PaymentForm";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { paymentSummary, money } from "../services/db";
import CourseManager from "../components/CourseManager";
import "./Admin.css";
export default function Admin() {
  const { data, notify } = useApp();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const students = data.users.filter((u) => u.role === "student");
  const debt = students.reduce((n, u) => n + paymentSummary(data, u).debt, 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Umumiy ko‘rinish</h1>
          <p>Kurslar, talabalar va natijalar bir joyda.</p>
        </div>
        <div className="button-row">
          <button className="primary" onClick={() => setPaymentOpen(true)}>
            <Wallet size={22} /> To‘lov qo‘shish
          </button>
          <CourseManager open={coursesOpen} onOpenChange={setCoursesOpen} />
          <Link className="primary" to="/admin/lessons">
            + Yangi dars
          </Link>
        </div>
      </div>
      <div className="stats">
        {[
          [students.length, "Talabalar", "/admin/students"],
          [data.courses.length, "Kurslar", "/admin/lessons"],
          [
            data.submissions.filter((s) => s.status === "pending").length,
            "Kutilayotgan amaliy ishlar",
            "/admin/reviews",
          ],
          [money(debt), "Jami qarzdorlik", "/admin/finance"],
        ].map(([n, t, to]) =>
          t === "Kurslar" ? (
            <button
              className="panel stat"
              key={t}
              onClick={() => setCoursesOpen(true)}
            >
              <strong>{n}</strong>
              <span>{t} →</span>
            </button>
          ) : (
            <Link className="panel stat" key={t} to={to}>
              <strong>{n}</strong>
              <span>{t} →</span>
            </Link>
          ),
        )}
      </div>
      <section className="panel detail-panel">
        <h2>Talabalar</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ism</th>
                <th>Kurslar</th>
                <th>To‘lov</th>
                <th>Qarz</th>
              </tr>
            </thead>
            <tbody>
              {students.map((u) => {
                const s = paymentSummary(data, u);
                return (
                  <tr key={u.id}>
                    <td>
                      <Link className="purple" to={"/admin/students/" + u.id}>
                        {u.name} →
                      </Link>
                    </td>
                    <td>
                      {data.enrollments.filter((e) => e.userId === u.id).length}
                    </td>
                    <td>{money(s.paid)}</td>
                    <td>{money(s.debt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {paymentOpen && (
        <Modal title="To‘lov qo‘shish" onClose={() => setPaymentOpen(false)}>
          <PaymentForm
            onSaved={() => {
              setPaymentOpen(false);
              notify("To‘lov saqlandi. Dashboard va moliya yangilandi.");
            }}
          />
        </Modal>
      )}
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
  materials: [],
});
export default function AdminLessons() {
  const { data, update, notify } = useApp();
  const [draft, setDraft] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState("");
  function edit(l) {
    setDraft(structuredClone(l));
    setFile(null);
    setMaterials([]);
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
    if (
      !draft.title.trim() ||
      !draft.task.trim() ||
      draft.questions.some(
        (q) => !q.text.trim() || q.options.some((o) => !o.trim()),
      )
    ) {
      setError("Bo‘sh matn yoki javoblarni to‘ldiring.");
      return;
    }
    if (
      materials.some(
        (f) => !/\.(pdf|xlsx?)$/i.test(f.name) || f.size > 20 * 1024 * 1024,
      )
    ) {
      setError("PDF yoki Excel fayl tanlang (har biri 20 MB gacha).");
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
      next.materials = [...(draft.materials || [])];
      for (const file of materials)
        next.materials.push({
          fileId: await putFile(file),
          name: file.name,
          size: file.size,
        });
      const ok = update((d) => {
        const i = d.lessons.findIndex((l) => l.id === next.id);
        if (i < 0) d.lessons.push(next);
        else d.lessons[i] = next;
      });
      if (ok) {
        setDraft(null);
        notify("Dars saqlandi.");
      }
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
      !confirm(
        "“" +
          l.title +
          "” darsi arxivlansinmi? Barcha natijalar tarixi saqlanadi.",
      )
    )
      return;
    update((d) => {
      const item = d.lessons.find((x) => x.id === l.id);
      item.published = false;
      item.archived = true;
      // Topshirilgan testlar tarixini saqlab qolamiz.
      Object.keys(d.testSessions).forEach((k) => {
        if (d.testSessions[k].lessonId === l.id) delete d.testSessions[k];
      });
      // Video, test va amaliy ishlar tarixi saqlanadi.
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
                {l.archived ? "Arxivda" : l.published ? "Faol" : "Nofaol"}
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
                    if (item.published) item.archived = false;
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
                  disabled={data.lessons.some((l) => l.id === draft.id)}
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
              <label>
                Qo‘shimcha materiallar (PDF, Excel; har biri 20 MB gacha)
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xls,.xlsx"
                  onChange={(e) => setMaterials(Array.from(e.target.files))}
                />
              </label>
              {(draft.materials || []).map((m) => (
                <div className="material-row" key={m.fileId}>
                  <span>{m.name}</span>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      field(
                        "materials",
                        draft.materials.filter((x) => x.fileId !== m.fileId),
                      )
                    }
                  >
                    Olib tashlash
                  </button>
                </div>
              ))}
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
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { reviewPractice, downloadMaterial } from "../services/db";
import "./Admin.css";
export default function AdminReviews() {
  const { data, user, update, notify } = useApp();
  const [filter, setFilter] = useState("pending");
  const list = data.submissions.filter(
    (s) => filter === "all" || s.status === filter,
  );
  function review(e, s) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    update((d) =>
      reviewPractice(
        d,
        s.id,
        f.get("status"),
        f.get("grade"),
        f.get("feedback").trim(),
        user.id,
      ),
    );
  }
  return (
    <>
      <h1>Amaliy ishlarni tekshirish</h1>
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
      {!list.length && <div className="panel empty">Amaliy ishlar yo‘q.</div>}
      {[...list].reverse().map((s) => (
        <article className="panel detail-panel" key={s.id}>
          <Link className="purple" to={"/admin/students/" + s.userId}>
            {data.users.find((u) => u.id === s.userId)?.name} →
          </Link>
          <h2>{s.lessonTitle}</h2>
          <p className="answer-text">{s.answer}</p>
          {s.attachment && (
            <button
              className="secondary"
              onClick={() =>
                downloadMaterial(s.attachment).catch((e) => notify(e.message))
              }
            >
              {s.attachment.name} ↓
            </button>
          )}
          <p>{new Date(s.createdAt).toLocaleString("uz-UZ")}</p>
          {s.status === "pending" ? (
            <form onSubmit={(e) => review(e, s)}>
              <div className="form-grid">
                <label>
                  Baho (0–100)
                  <input
                    name="grade"
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="1"
                  />
                </label>
                <label>
                  Natija
                  <select name="status">
                    <option value="approved">Tasdiqlash</option>
                    <option value="rejected">Qayta ishlashga yuborish</option>
                  </select>
                </label>
              </div>
              <label>
                Izoh
                <textarea name="feedback" required minLength={3} />
              </label>
              <button className="primary">Natijani saqlash</button>
            </form>
          ) : (
            <>
              <p>
                Baho: {s.grade ?? "—"} / 100 ·{" "}
                {s.status === "approved" ? "Tasdiqlangan" : "Qaytarilgan"}
              </p>
              <p>{s.feedback}</p>
              <p>Bu natija tarixga saqlangan va qayta tahrirlanmaydi.</p>
            </>
          )}
        </article>
      ))}
    </>
  );
}

```

## src/pages/AdminStudents.jsx

```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { enrollmentsFor, paymentSummary, money } from "../services/db";
import StudentForm from "../components/StudentForm";
import "./Admin.css";
export default function AdminStudents() {
  const { data } = useApp();
  const go = useNavigate();
  const [query, setQuery] = useState(""),
    [draft, setDraft] = useState(undefined);
  const list = data.users.filter(
    (u) =>
      u.role === "student" &&
      (u.name + " " + u.email).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Talabalar</h1>
          <p>
            {data.users.filter((u) => u.role === "student").length} talaba · har
            biri uchun shaxsiy bo‘lim
          </p>
        </div>
        <button className="primary" onClick={() => setDraft(null)}>
          + Talaba qo‘shish
        </button>
      </div>
      <input
        className="search-box"
        aria-label="Qidirish"
        placeholder="Ism yoki email orqali qidiring"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>Talaba</th>
              <th>Kurslar</th>
              <th>Qarz</th>
              <th>Holat</th>
              <th>Amal</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link className="purple" to={"/admin/students/" + u.id}>
                    {u.name} →
                  </Link>
                  <small>{u.email}</small>
                </td>
                <td>
                  {enrollmentsFor(data, u.id)
                    .map(
                      (e) =>
                        data.courses.find((c) => c.id === e.courseId)?.title,
                    )
                    .join(", ") || "—"}
                </td>
                <td>{money(paymentSummary(data, u).debt)}</td>
                <td>{u.active ? "Faol" : "Bloklangan"}</td>
                <td>
                  <button className="secondary" onClick={() => setDraft(u)}>
                    Tahrirlash
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="empty">Talabalar topilmadi.</p>}
      </div>
      {draft !== undefined && (
        <StudentForm
          student={draft}
          onClose={() => setDraft(undefined)}
          onSaved={(id) => {
            setDraft(undefined);
            go("/admin/students/" + id);
          }}
        />
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
.certificate {
  margin: 30px 0;
  padding: 45px 25px;
  border: 8px double var(--primary-border);
  background: var(--surface);
  text-align: center;
}
.cert-brand {
  color: var(--primary);
  font-size: var(--fs-h2);
  font-weight: 700;
}
.certificate h2 {
  color: var(--primary);
  font-size: var(--fs-title);
  letter-spacing: 3px;
}
.certificate h3 {
  font-size: var(--fs-h2);
}

```

## src/pages/Certificate.jsx

```jsx
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  enrollmentsFor,
  hasCourse,
  courseResult,
  issueCertificate,
} from "../services/db";
import { downloadCertificate } from "../services/certificate";
import "./Certificate.css";
export default function Certificate() {
  const { courseId } = useParams();
  const { data, user, update, notify } = useApp();
  const [busy, setBusy] = useState(false);
  if (!courseId)
    return (
      <>
        <h1>Sertifikatlar</h1>
        <div className="course-grid">
          {enrollmentsFor(data, user.id).map((e) => {
            const result = courseResult(data, user.id, e.courseId);
            return (
              <Link
                className="panel course-card"
                key={e.id}
                to={"/student/certificate/" + e.courseId}
              >
                <h2>{data.courses.find((c) => c.id === e.courseId)?.title}</h2>
                <p>
                  {result.ready ||
                  data.certificates.some(
                    (c) => c.userId === user.id && c.courseId === e.courseId,
                  )
                    ? "Sertifikat tayyor"
                    : "Kursni yakunlang"}
                </p>
              </Link>
            );
          })}
        </div>
      </>
    );
  if (!hasCourse(data, user.id, courseId)) return <p>Kursga kirish yopiq.</p>;
  const result = courseResult(data, user.id, courseId),
    existing = data.certificates.find(
      (c) => c.userId === user.id && c.courseId === courseId,
    ),
    course = data.courses.find((c) => c.id === courseId);
  async function download() {
    setBusy(true);
    try {
      let cert = existing;
      if (!cert) {
        const ok = update((d) => {
          cert = issueCertificate(d, user.id, courseId);
        });
        if (!ok) return;
      }
      await downloadCertificate(cert);
    } catch (e) {
      notify("PDF tayyorlanmadi: " + e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back" to="/student/certificate">
        ← Sertifikatlar
      </Link>
      <h1>{course.title}</h1>
      <section className="certificate">
        <div className="cert-brand">AI Academy</div>
        <h2>SERTIFIKAT</h2>
        <p>
          {existing
            ? "Kursni muvaffaqiyatli yakunlagan"
            : "Sertifikat namunasi — hali berilmagan"}
        </p>
        <h3>{existing?.name || user.name}</h3>
        <p>{existing?.title || course.title}</p>
        <strong>
          Yakuniy test bahosi: {(existing?.score ?? result.average).toFixed(2)}%
        </strong>
        {existing && (
          <p>{new Date(existing.createdAt).toLocaleDateString("uz-UZ")}</p>
        )}
      </section>
      <section className="panel detail-panel">
        <h2>Olish shartlari</h2>
        <p>
          Testlar: {result.tests}/{result.lessons.length} — har biridan 70% dan
          yuqori.
        </p>
        <p>
          Videolar: {result.watched}/{result.lessons.length}
        </p>
        <p>
          Tasdiqlangan amaliy ishlar: {result.practical}/{result.lessons.length}
        </p>
        <p>
          Yakuniy baho — har bir darsning eng yaxshi test natijalari o‘rtachasi.
        </p>
        <button
          className="primary"
          disabled={busy || (!existing && !result.ready)}
          onClick={download}
        >
          {busy ? "PDF tayyorlanmoqda…" : "Sertifikatni PDF yuklab olish"}
        </button>
      </section>
    </>
  );
}

```

## src/pages/Course.css

```css
/* Umumiy UI stillari src/index.css ichida, ranglar va shriftlar :root orqali boshqariladi. */

```

## src/pages/Course.jsx

```jsx
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  enrollmentsFor,
  courseResult,
  unlocked,
  passed,
  hasCourse,
  money,
} from "../services/db";
import "./Course.css";
export default function Course() {
  const { courseId } = useParams();
  const { data, user } = useApp();
  if (!courseId)
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Mening kurslarim</h1>
            <p>
              Sizga biriktirilgan {enrollmentsFor(data, user.id).length} ta kurs
            </p>
          </div>
        </div>
        <div className="course-grid">
          {enrollmentsFor(data, user.id).map((e) => {
            const c = data.courses.find((c) => c.id === e.courseId);
            const r = courseResult(data, user.id, e.courseId);
            return (
              <Link
                key={e.id}
                className="panel course-card"
                to={"/student/course/" + e.courseId}
              >
                <span className="badge">{r.lessons.length} dars</span>
                <h2>{c?.title}</h2>
                <p>{c?.description}</p>
                <div className="progress">
                  <i
                    style={{
                      width:
                        (r.lessons.length
                          ? (r.tests / r.lessons.length) * 100
                          : 0) + "%",
                    }}
                  />
                </div>
                <p>
                  {r.tests}/{r.lessons.length} testdan o‘tilgan
                </p>
                <strong>Kursni ochish →</strong>
              </Link>
            );
          })}
        </div>
        {!enrollmentsFor(data, user.id).length && (
          <p className="empty">Hozircha kurs biriktirilmagan.</p>
        )}
      </>
    );
  const c = data.courses.find((c) => c.id === courseId);
  if (!c || !hasCourse(data, user.id, courseId))
    return (
      <div className="empty">
        Kursga kirish yopiq. <Link to="/student">Kurslarim</Link>
      </div>
    );
  const r = courseResult(data, user.id, courseId),
    e = enrollmentsFor(data, user.id).find((e) => e.courseId === courseId);
  return (
    <>
      <Link className="back" to="/student">
        ← Mening kurslarim
      </Link>
      <div className="page-heading">
        <div>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
        </div>
        <span className="badge">{money(e.fee)}</span>
      </div>
      <div className="stats">
        <div className="panel stat">
          <strong>
            {r.tests}/{r.lessons.length}
          </strong>
          <span>Testdan o‘tilgan</span>
        </div>
        <div className="panel stat">
          <strong>{r.watched}</strong>
          <span>Video ko‘rilgan</span>
        </div>
        <div className="panel stat">
          <strong>{r.practical}</strong>
          <span>Amaliy tasdiqlangan</span>
        </div>
      </div>
      <div className="lesson-list">
        {r.lessons.map((l, i) => {
          const open = unlocked(data, user.id, l.id);
          return (
            <article className="panel lesson-row" key={l.id}>
              <span className="lesson-number">{i + 1}</span>
              <div className="grow">
                <h3>{l.title}</h3>
                <p>
                  {l.duration} daqiqa · {l.questions.length} savol
                </p>
              </div>
              {open ? (
                <Link className="primary" to={"/student/lesson/" + l.id}>
                  {passed(data, user.id, l.id)
                    ? "Qayta ko‘rish"
                    : "Darsni ochish"}
                </Link>
              ) : (
                <span className="badge">Yopiq</span>
              )}
            </article>
          );
        })}
      </div>
      {!r.lessons.length && <p>Hozircha faol dars yo‘q.</p>}
      <Link
        className="secondary inline-button"
        to={"/student/certificate/" + courseId}
      >
        Kurs sertifikati →
      </Link>
    </>
  );
}

```

## src/pages/Finance.jsx

```jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  paymentSummary,
  enrollmentSummary,
  money,
  localDate,
} from "../services/db";
import PaymentForm from "../components/PaymentForm";
import "./Admin.css";
export default function Finance() {
  const { data } = useApp();
  const [debtors, setDebtors] = useState(false),
    [query, setQuery] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const students = data.users.filter((u) => u.role === "student");
  const rows = students.map((u) => ({ u, ...paymentSummary(data, u) }));
  const totals = rows.reduce(
    (a, r) => {
      for (const k of ["fee", "paid", "debt", "credit"]) a[k] += r[k];
      return a;
    },
    { fee: 0, paid: 0, debt: 0, credit: 0 },
  );
  const payments = data.payments.filter(
    (p) => !p.voidedAt && (!from || p.date >= from) && (!to || p.date <= to),
  );
  const filtered = rows.filter(
    (r) =>
      (!debtors || r.debt > 0) &&
      (r.u.name + " " + r.u.email).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Moliya</h1>
          <p>Kurslar bo‘yicha to‘lovlar va qarzdorlik nazorati</p>
        </div>
      </div>
      <div className="stats">
        <div className="panel stat">
          <strong>{students.length}</strong>
          <span>Talabalar</span>
        </div>
        <div className="panel stat">
          <strong>{money(totals.fee)}</strong>
          <span>Jami shartnoma qiymati</span>
        </div>
        <div className="panel stat">
          <strong>{money(totals.paid)}</strong>
          <span>To‘langan</span>
        </div>
        <button className="panel stat" onClick={() => setDebtors(true)}>
          <strong>{rows.filter((r) => r.debt > 0).length}</strong>
          <span>Qarzdorlar →</span>
        </button>
        <div className="panel stat">
          <strong>{money(totals.debt)}</strong>
          <span>Jami qarz</span>
        </div>
        <div className="panel stat">
          <strong>{money(totals.credit)}</strong>
          <span>Avvalgi ortiqcha to‘lov</span>
        </div>
      </div>
      <section className="panel detail-panel">
        <h2>To‘lov qo‘shish</h2>
        <PaymentForm />
      </section>
      <section className="panel detail-panel">
        <div className="row">
          <h2>{debtors ? "Barcha qarzdorlar" : "Talabalar balansi"}</h2>
          <button className="secondary" onClick={() => setDebtors(!debtors)}>
            {debtors ? "Barchasi" : "Faqat qarzdorlar"}
          </button>
        </div>
        <input
          aria-label="Qarzdorlarni qidirish"
          placeholder="Talabani qidiring"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Talaba</th>
                <th>Kurs qiymati</th>
                <th>To‘lov</th>
                <th>Qarz</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.u.id}>
                  <td>
                    <Link className="purple" to={"/admin/students/" + r.u.id}>
                      {r.u.name} →
                    </Link>
                  </td>
                  <td>{money(r.fee)}</td>
                  <td>{money(r.paid)}</td>
                  <td>{money(r.debt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p>Natija yo‘q.</p>}
        </div>
      </section>
      <section className="panel detail-panel">
        <h2>Kurslar statistikasi</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Kurs</th>
                <th>Sotilgan</th>
                <th>To‘lov</th>
                <th>Qarz</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.map((c) => {
                const es = data.enrollments.filter((e) => e.courseId === c.id),
                  s = es.map((e) => enrollmentSummary(data, e));
                return (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{es.length}</td>
                    <td>{money(s.reduce((n, x) => n + x.paid, 0))}</td>
                    <td>{money(s.reduce((n, x) => n + x.debt, 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel detail-panel">
        <h2>To‘lovlar tarixi</h2>
        <div className="form-grid">
          <label>
            Dan
            <input
              type="date"
              max={to || localDate()}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Gacha
            <input
              type="date"
              min={from}
              max={localDate()}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <p>
          Tanlangan davr:{" "}
          <strong>{money(payments.reduce((n, p) => n + p.amount, 0))}</strong>
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Talaba / kurs</th>
                <th>Miqdor</th>
                <th>Usul</th>
              </tr>
            </thead>
            <tbody>
              {[...payments]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.date}</td>
                    <td>
                      <Link to={"/admin/students/" + p.userId}>
                        {data.users.find((u) => u.id === p.userId)?.name}
                      </Link>
                      <small>
                        {data.courses.find((c) => c.id === p.courseId)?.title}
                      </small>
                    </td>
                    <td>{money(p.amount)}</td>
                    <td>{p.method}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!payments.length && <p>To‘lovlar yo‘q.</p>}
        </div>
      </section>
    </>
  );
}

```

## src/pages/Lesson.css

```css
.protected-video {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--video-bg);
}
.video {
  display: block;
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--video-bg);
}
.video-watermark {
  position: absolute;
  top: 15%;
  left: 8%;
  z-index: 2;
  pointer-events: none;
  color: var(--watermark);
  text-shadow: 0 1px 3px var(--video-bg);
  font-size: var(--fs-small);
  max-width: 85%;
  overflow-wrap: anywhere;
}
.video-empty {
  aspect-ratio: 16/9;
  background: var(--video-bg);
  color: var(--video-text);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}
.video-empty p {
  color: var(--video-text);
}

```

## src/pages/Lesson.jsx

```jsx
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  getFile,
  putFile,
  uid,
  unlocked,
  attemptPassed,
  recordAttempt,
  submitPractice,
  downloadMaterial,
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
  return <LessonContent key={id} id={id} />;
}
function LessonContent({ id }) {
  const { data, user, update, notify } = useApp();
  const [tab, setTab] = useState("test"),
    [answer, setAnswer] = useState(""),
    [attachment, setAttachment] = useState(null),
    [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const lesson = data.lessons.find((l) => l.id === id);
  if (!lesson || !unlocked(data, user.id, id))
    return (
      <div className="empty">
        Dars yopiq yoki mavjud emas. <Link to="/student">Kurslarim</Link>
      </div>
    );
  const key = user.id + ":" + id,
    session = data.testSessions[key];
  const attempts = data.attempts.filter(
      (a) => a.userId === user.id && a.lessonId === id,
    ),
    latest = attempts[attempts.length - 1],
    practices = data.submissions.filter(
      (s) => s.userId === user.id && s.lessonId === id,
    );
  function start() {
    update((d) => {
      if (d.testSessions[key]) return;
      if (!lesson.questions.length) throw Error("Test mavjud emas.");
      d.testSessions[key] = {
        id: uid(),
        userId: user.id,
        lessonId: id,
        courseId: lesson.courseId,
        lessonTitle: lesson.title,
        startedAt: new Date().toISOString(),
        questions: structuredClone(lesson.questions),
        answers: {},
      };
    });
  }
  function finish(e) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    update((d) =>
      recordAttempt(d, session, d.testSessions[key]?.answers || {}),
    );
    submitting.current = false;
  }
  async function practice(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      let material;
      if (attachment) {
        if (
          !/\.(pdf|xlsx?|png|jpe?g)$/i.test(attachment.name) ||
          attachment.size > 20 * 1024 * 1024
        )
          throw Error("PDF, Excel yoki rasm tanlang (20 MB gacha).");
        material = { fileId: await putFile(attachment), name: attachment.name };
      }
      if (
        update((d) =>
          submitPractice(d, {
            id: uid(),
            userId: user.id,
            courseId: lesson.courseId,
            lessonId: id,
            lessonTitle: lesson.title,
            answer,
            attachment: material,
          }),
        )
      ) {
        setAnswer("");
        setAttachment(null);
        notify("Amaliy ish tarixga saqlandi.");
      }
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function download(m) {
    try {
      await downloadMaterial(m);
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <>
      <Link className="back" to={"/student/course/" + lesson.courseId}>
        ← Kursga qaytish
      </Link>
      <h1>{lesson.title}</h1>
      <p>{lesson.description}</p>
      <Player
        lesson={lesson}
        watermark={user.name + " · " + user.email}
        onEnd={() =>
          update((d) => {
            d.progress[user.id] ??= {};
            d.progress[user.id][id] = {
              watched: true,
              watchedAt: new Date().toISOString(),
            };
          })
        }
      />
      <p>
        {data.progress[user.id]?.[id]?.watched
          ? "✓ Video yakunlangan"
          : "Video oxirigacha ko‘rilgach holat saqlanadi."}
      </p>
      <div className="tabs" role="tablist" aria-label="Dars bo‘limlari">
        {[
          ["test", "1. Test"],
          ["practice", "2. Amaliy"],
          ["materials", "3. Qo‘shimcha materiallar"],
        ].map(([k, v]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            aria-controls={"panel-" + k}
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k)}
          >
            {v}
          </button>
        ))}
      </div>
      <section className="panel task-panel" role="tabpanel" id={"panel-" + tab}>
        {tab === "test" ? (
          <>
            <h2>Bilimingizni tekshiring</h2>
            <p>
              O‘tish sharti: 70% dan yuqori. Natijalar tahrirlanmaydi; qayta
              urinish boshidan boshlanadi.
            </p>
            {session ? (
              <form onSubmit={finish}>
                {session.questions.map((q, i) => (
                  <fieldset key={q.id}>
                    <legend>
                      {i + 1}. {q.text}
                    </legend>
                    {q.options.map((o, j) => (
                      <label className="test-option" key={j}>
                        <input
                          type="radio"
                          name={q.id}
                          required
                          checked={session.answers[q.id] === j}
                          onChange={() =>
                            update((d) => {
                              if (d.testSessions[key]?.id === session.id)
                                d.testSessions[key].answers[q.id] = j;
                            })
                          }
                        />
                        {o}
                      </label>
                    ))}
                  </fieldset>
                ))}
                <button className="primary">Testni topshirish</button>
              </form>
            ) : (
              <>
                {latest && (
                  <p className="result">
                    Oxirgi natija: {latest.score.toFixed(2)}% ·{" "}
                    {attemptPassed(latest) ? "O‘tdingiz" : "O‘tmadingiz"}
                  </p>
                )}
                <button
                  className="primary"
                  disabled={!lesson.questions.length}
                  onClick={start}
                >
                  {latest ? "Testni boshidan boshlash" : "Testni boshlash"}
                </button>
              </>
            )}
            <h3>Test tarixi</h3>
            {[...attempts].reverse().map((a) => (
              <details key={a.id} className="attempt-detail">
                <summary>
                  {a.score.toFixed(2)}% ·{" "}
                  {new Date(a.createdAt).toLocaleString("uz-UZ")}
                </summary>
                {a.questions?.map((q) => (
                  <p key={q.id}>
                    {q.text}
                    <br />
                    Javobingiz: {q.options[a.answers?.[q.id]] ?? "—"}
                  </p>
                ))}
              </details>
            ))}
          </>
        ) : tab === "practice" ? (
          <>
            <h2>Amaliy topshiriq</h2>
            <p>{lesson.task}</p>
            {practices.some((s) => s.status === "pending") ? (
              <p className="badge">Yuborilgan ish tekshirilmoqda.</p>
            ) : (
              <form onSubmit={practice}>
                <label>
                  Javobingiz
                  <textarea
                    required
                    minLength={5}
                    maxLength={10000}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </label>
                <label>
                  Ilova (ixtiyoriy, 20 MB gacha)
                  <input
                    key={attachment?.name || "empty"}
                    type="file"
                    accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => setAttachment(e.target.files[0] || null)}
                  />
                </label>
                <button className="primary" disabled={busy}>
                  {busy ? "Saqlanmoqda…" : "Amaliy ishni topshirish"}
                </button>
              </form>
            )}
            <h3>Amaliy ishlar tarixi</h3>
            {[...practices].reverse().map((s) => (
              <article className="submission" key={s.id}>
                <p>{s.answer}</p>
                {s.attachment && (
                  <button
                    className="secondary"
                    onClick={() => download(s.attachment)}
                  >
                    {s.attachment.name} ↓
                  </button>
                )}
                <p>{new Date(s.createdAt).toLocaleString("uz-UZ")}</p>
                <strong>
                  {
                    {
                      pending: "Tekshirilmoqda",
                      approved: "Tasdiqlangan",
                      rejected: "Qaytarilgan",
                    }[s.status]
                  }
                </strong>
                <p>Baho: {s.grade ?? "—"} / 100</p>
                <p>{s.feedback}</p>
              </article>
            ))}
          </>
        ) : (
          <>
            <h2>Qo‘shimcha materiallar</h2>
            <p>Dars uchun PDF va Excel fayllar.</p>
            {(lesson.materials || []).map((m) => (
              <div className="material-row" key={m.fileId}>
                <span>{m.name}</span>
                <button className="secondary" onClick={() => download(m)}>
                  Yuklab olish ↓
                </button>
              </div>
            ))}
            {!lesson.materials?.length && <p>Hozircha material yuklanmagan.</p>}
          </>
        )}
      </section>
    </>
  );
}

```

## src/pages/Login.css

```css
.login-page {
  min-height: 100vh;
  padding: 30px 5vw;
  background: var(--hero-gradient);
}
.login-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.login-brand > span {
  color: var(--muted);
}
.login-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  align-items: center;
  max-width: 1400px;
  margin: 40px auto;
}
.login-story h1 {
  font-size: var(--fs-hero);
  line-height: 1.14;
  margin: 28px 0;
}
.login-story em {
  font-style: normal;
  color: var(--primary);
}
.login-story p {
  color: var(--muted);
  font-size: var(--fs-medium);
}
.ai-art {
  height: 240px;
  position: relative;
  max-width: 380px;
  margin: 25px 0;
}
.ai-cube {
  position: absolute;
  left: 80px;
  top: 15px;
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: var(--fs-art);
  font-weight: 700;
  color: var(--surface);
  background: var(--gradient);
  border: 6px solid var(--primary-border);
  border-radius: 28px;
  transform: rotate(-10deg);
  box-shadow: var(--shadow);
}
.ai-cube span {
  font-size: var(--fs-small);
}
.float-icon {
  position: absolute;
  color: var(--primary);
  background: var(--surface);
  border-radius: 12px;
  padding: 15px;
  box-shadow: var(--shadow);
}
.float-icon.one {
  right: 25px;
  top: 0;
}
.float-icon.two {
  bottom: 10px;
  left: 0;
}
.story-note {
  color: var(--muted);
}
.login-form-wrap {
  max-width: 600px;
  width: 100%;
  margin: auto;
}
.login-form {
  background: var(--surface);
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.login-form h2 {
  margin: 20px 0 12px;
}
.login-form > p {
  color: var(--muted);
}
.small-icon {
  display: inline-flex;
  padding: 12px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
}
.input-icon {
  position: relative;
}
.input-icon > svg {
  position: absolute;
  left: 13px;
  top: 24px;
  color: var(--muted);
}
.input-icon input {
  padding-left: 42px;
  padding-right: 45px;
}
.eye {
  position: absolute;
  right: 8px;
  top: 10px;
  background: var(--transparent);
  color: var(--muted);
  padding: 8px;
}
.login-options {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 24px 0;
}
.login-submit {
  width: 100%;
}
.demo-access {
  border-top: 1px solid var(--border);
  padding-top: 25px;
  margin-top: 25px;
  text-align: center;
}
.demo-access > div {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}
.demo-access button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  padding: 12px;
}
.demo-access small {
  color: var(--muted);
}
.form-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--muted);
}
.login-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  color: var(--muted);
}
@media (max-width: 1000px) {
  .login-grid {
    grid-template-columns: 1fr;
  }
  .login-story {
    max-width: 600px;
    margin: auto;
    width: 100%;
  }
  .ai-art,
  .story-note,
  .login-brand > span {
    display: none;
  }
  .login-form {
    padding: 24px;
  }
  .login-page {
    padding: 24px 18px;
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
/* Umumiy UI stillari src/index.css ichida, ranglar va shriftlar :root orqali boshqariladi. */

```

## src/pages/StudentDetail.jsx

```jsx
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  enrollmentsFor,
  enrollmentSummary,
  paymentSummary,
  studentLessons,
  attemptPassed,
  money,
  integer,
  downloadMaterial,
} from "../services/db";
import StudentForm from "../components/StudentForm";
import PaymentForm from "../components/PaymentForm";
import Modal from "../components/Modal";
import { downloadCertificate } from "../services/certificate";
import "./StudentDetail.css";
export default function StudentDetail() {
  const { studentId } = useParams();
  const { data, user, update, notify } = useApp();
  const [edit, setEdit] = useState(false),
    [voiding, setVoiding] = useState(null),
    [feeEdit, setFeeEdit] = useState(null);
  const student = data.users.find(
    (u) => u.id === studentId && u.role === "student",
  );
  if (!student)
    return (
      <div className="empty">
        Talaba topilmadi. <Link to="/admin/students">Ortga</Link>
      </div>
    );
  const totals = paymentSummary(data, student),
    enrollments = enrollmentsFor(data, studentId),
    lessons = studentLessons(data, studentId),
    attempts = data.attempts.filter((a) => a.userId === studentId),
    submissions = data.submissions.filter((s) => s.userId === studentId),
    payments = data.payments.filter((p) => p.userId === studentId);
  function voidPayment(e) {
    e.preventDefault();
    const reason = new FormData(e.currentTarget).get("reason").trim();
    if (reason.length < 5) return notify("Kamida 5 belgili sabab yozing.");
    if (
      update((d) => {
        const p = d.payments.find((p) => p.id === voiding.id);
        if (p.voidedAt) throw Error("Avval bekor qilingan.");
        p.voidedAt = new Date().toISOString();
        p.voidReason = reason;
        p.voidedBy = user.id;
      })
    )
      setVoiding(null);
  }
  function fee(e) {
    e.preventDefault();
    const n = new FormData(e.currentTarget).get("fee");
    if (
      update((d) => {
        const enrollment = d.enrollments.find((e) => e.id === feeEdit.id);
        const value = integer(n);
        if (value < enrollmentSummary(d, enrollment).paid)
          throw Error("Narx to‘langan summadan kam bo‘lolmaydi.");
        enrollment.fee = value;
      })
    )
      setFeeEdit(null);
  }
  async function download(m) {
    try {
      await downloadMaterial(m);
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <>
      <Link className="back" to="/admin/students">
        ← Talabalar
      </Link>
      <div className="page-heading">
        <div>
          <h1>{student.name}</h1>
          <p>
            {student.email} · {student.phone || "Telefon kiritilmagan"}
          </p>
          <p>
            {student.active ? "Faol" : "Bloklangan"} · {student.notes}
          </p>
        </div>
        <button className="primary" onClick={() => setEdit(true)}>
          Ma’lumot va kurslarni tahrirlash
        </button>
      </div>
      <div className="stats">
        {[
          [enrollments.length, "Sotib olingan kurs"],
          [
            lessons.filter((l) => data.progress[studentId]?.[l.id]?.watched)
              .length,
            "Ko‘rilgan video",
          ],
          [money(totals.paid), "To‘langan"],
          [money(totals.debt), "Qarz"],
        ].map(([n, l]) => (
          <div className="panel stat" key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <section className="panel detail-panel">
        <h2>Kurslar va hisob-kitob</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Kurs</th>
                <th>Kelishilgan narx</th>
                <th>To‘lov</th>
                <th>Qarz</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => {
                const s = enrollmentSummary(data, e);
                return (
                  <tr key={e.id}>
                    <td>
                      {data.courses.find((c) => c.id === e.courseId)?.title}
                    </td>
                    <td>{money(s.fee)}</td>
                    <td>{money(s.paid)}</td>
                    <td>
                      {money(s.debt)}
                      {s.credit > 0 && (
                        <small>Ortiqcha: {money(s.credit)}</small>
                      )}
                    </td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => setFeeEdit(e)}
                      >
                        Narxni tahrirlash
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel detail-panel">
        <h2>To‘lov qo‘shish</h2>
        <PaymentForm studentId={studentId} />
        <h3>To‘lov tarixi</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Kurs</th>
                <th>Miqdor</th>
                <th>Holat</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {[...payments].reverse().map((p) => (
                <tr key={p.id}>
                  <td>{p.date}</td>
                  <td>
                    {data.courses.find((c) => c.id === p.courseId)?.title}
                    <small>{p.note}</small>
                  </td>
                  <td>{money(p.amount)}</td>
                  <td>
                    {p.voidedAt ? "Bekor qilingan" : "Qayd etilgan"}
                    <small>{p.voidReason}</small>
                  </td>
                  <td>
                    {!p.voidedAt && (
                      <button
                        className="secondary"
                        onClick={() => setVoiding(p)}
                      >
                        Bekor qilish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel detail-panel">
        <h2>Ko‘rilgan darslar</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Kurs / dars</th>
                <th>Video</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.title}
                    <small>
                      {data.courses.find((c) => c.id === l.courseId)?.title}
                    </small>
                  </td>
                  <td>
                    {data.progress[studentId]?.[l.id]?.watched
                      ? "Yakunlangan"
                      : "Yakunlanmagan"}
                  </td>
                  <td>
                    {data.progress[studentId]?.[l.id]?.watchedAt
                      ? new Date(
                          data.progress[studentId][l.id].watchedAt,
                        ).toLocaleString("uz-UZ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel detail-panel">
        <h2>Test natijalari tarixi</h2>
        {!attempts.length && <p>Hali test topshirilmagan.</p>}
        {[...attempts].reverse().map((a) => (
          <details className="attempt-detail" key={a.id}>
            <summary>
              {a.lessonTitle ||
                data.lessons.find((l) => l.id === a.lessonId)?.title ||
                "Eski dars"}{" "}
              · {a.score.toFixed(2)}% · {attemptPassed(a) ? "O‘tdi" : "O‘tmadi"}
            </summary>
            <p>{new Date(a.createdAt).toLocaleString("uz-UZ")}</p>
            {a.questions?.map((q, i) => (
              <div className="submission" key={q.id}>
                <strong>
                  {i + 1}. {q.text}
                </strong>
                <p>Talaba: {q.options[a.answers?.[q.id]] ?? "—"}</p>
                <p>To‘g‘ri javob: {q.options[q.correct]}</p>
              </div>
            ))}
          </details>
        ))}
      </section>
      <section className="panel detail-panel">
        <h2>Amaliy natijalar tarixi</h2>
        {!submissions.length && <p>Hali topshirilmagan.</p>}
        {[...submissions].reverse().map((s) => (
          <article className="submission" key={s.id}>
            <h3>{s.lessonTitle}</h3>
            <p>{s.answer}</p>
            {s.attachment && (
              <button
                className="secondary"
                onClick={() => download(s.attachment)}
              >
                {s.attachment.name} ↓
              </button>
            )}
            <p>{new Date(s.createdAt).toLocaleString("uz-UZ")}</p>
            <span className="badge">
              {
                {
                  pending: "Tekshirilmoqda",
                  approved: "Tasdiqlangan",
                  rejected: "Qaytarilgan",
                }[s.status]
              }
            </span>
            <p>Baho: {s.grade ?? "—"} / 100</p>
            <p>Admin izohi: {s.feedback || "—"}</p>
          </article>
        ))}
        <Link className="primary inline-button" to="/admin/reviews">
          Amaliy ishlarni tekshirish
        </Link>
      </section>
      <section className="panel detail-panel">
        <h2>Berilgan sertifikatlar</h2>
        {data.certificates
          .filter((c) => c.userId === studentId)
          .map((c) => (
            <div className="row" key={c.id}>
              <span>
                {c.title} · {c.score.toFixed(2)}%
              </span>
              <button
                className="secondary"
                onClick={() =>
                  downloadCertificate(c).catch((e) => notify(e.message))
                }
              >
                PDF yuklash
              </button>
            </div>
          ))}
      </section>
      {edit && (
        <StudentForm
          student={student}
          onClose={() => setEdit(false)}
          onSaved={() => setEdit(false)}
        />
      )}{" "}
      {voiding && (
        <Modal title="To‘lovni bekor qilish" onClose={() => setVoiding(null)}>
          <form onSubmit={voidPayment}>
            <p>
              {money(voiding.amount)} hisobdan chiqariladi, yozuv tarixda
              saqlanadi.
            </p>
            <label>
              Sabab
              <textarea name="reason" required minLength={5} />
            </label>
            <button className="primary">Ha, bekor qilish</button>
          </form>
        </Modal>
      )}
      {feeEdit && (
        <Modal title="Kelishilgan narx" onClose={() => setFeeEdit(null)}>
          <form onSubmit={fee}>
            <label>
              Narx (so‘m)
              <input
                type="number"
                min="0"
                step="1"
                required
                name="fee"
                defaultValue={feeEdit.fee}
              />
            </label>
            <button className="primary">Saqlash</button>
          </form>
        </Modal>
      )}
    </>
  );
}

```

## src/pages/Support.css

```css
/* Umumiy UI stillari src/index.css ichida, ranglar va shriftlar :root orqali boshqariladi. */

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
                "Shu kursdagi oldingi faol darslar testidan 70% dan yuqori oling. Aynan 70% yetarli emas. Videoni ko‘rish va vazifani tasdiqlash sertifikat uchun talab qilinadi.",
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

## src/services/certificate.js

```js
import { jsPDF } from "jspdf";
export async function downloadCertificate(cert) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1800;
  canvas.height = 1273;
  const ctx = canvas.getContext("2d");
  const style = getComputedStyle(document.documentElement),
    primary = style.getPropertyValue("--primary").trim(),
    bg = style.getPropertyValue("--surface").trim(),
    text = style.getPropertyValue("--text").trim();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1800, 1273);
  ctx.strokeStyle = primary;
  ctx.lineWidth = 8;
  ctx.strokeRect(50, 50, 1700, 1173);
  ctx.lineWidth = 2;
  ctx.strokeRect(75, 75, 1650, 1123);
  ctx.textAlign = "center";
  const size = (key) => parseFloat(style.getPropertyValue("--cert-fs-" + key));
  function line(value, y, size, color = text) {
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px Arial`;
    ctx.fillText(value, 900, y, 1550);
  }
  line("AI ACADEMY", 180, size("brand"), primary);
  line("SERTIFIKAT", 330, size("title"), primary);
  line("Kursni muvaffaqiyatli yakunlaganlik uchun", 410, size("subtitle"));
  line(cert.name, 570, size("name"));
  line(cert.title, 675, size("course"));
  line(`Yakuniy test bahosi: ${cert.score.toFixed(2)}%`, 790, size("score"));
  line(
    `${cert.lessonCount} ta dars · video, test va amaliy ishlar yakunlangan`,
    865,
    size("body"),
  );
  line(
    new Date(cert.createdAt).toLocaleDateString("uz-UZ"),
    1010,
    size("date"),
  );
  line(`ID: ${cert.id}`, 1090, size("id"));
  line("AI Academy o‘quv platformasi", 1140, size("footer"));
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210);
  pdf.save("AI-Academy-sertifikat-" + cert.id.slice(0, 8) + ".pdf");
}

```

## src/services/db.js

```js
export const KEY = "ai-academy-v1";
export const uid = () => crypto.randomUUID();
export const money = (n) => new Intl.NumberFormat("uz-UZ").format(n) + " so‘m";
export const localDate = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
export function integer(value, min = 0) {
  const n = Number(value);
  if (value === "" || !Number.isSafeInteger(n) || n < min || n > 1e12)
    throw Error("Miqdorni to‘g‘ri butun son sifatida kiriting.");
  return n;
}
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

export function migrate(input) {
  const d = { ...structuredClone(seed), ...input };
  d.courses ??= structuredClone(seed.courses);
  d.payments ??= [];
  d.testSessions ??= {};
  d.certificates ??= [];
  d.lessons = d.lessons.map((l) => ({
    courseId: "course-ai",
    materials: [],
    ...l,
  }));
  if (!Array.isArray(d.enrollments))
    d.enrollments = d.users
      .filter((u) => u.role === "student")
      .map((u) => ({
        id: u.id + ":" + (u.courseId || "course-ai"),
        userId: u.id,
        courseId: u.courseId || "course-ai",
        fee: Number(
          u.courseFee ??
            d.courses.find((c) => c.id === (u.courseId || "course-ai"))
              ?.price ??
            0,
        ),
        createdAt: u.createdAt || new Date().toISOString(),
      }));
  d.payments = d.payments.map((a) => ({
    ...a,
    courseId:
      a.courseId ||
      d.users.find((u) => u.id === a.userId)?.courseId ||
      "course-ai",
  }));
  d.attempts = d.attempts.map((a) => ({
    ...a,
    courseId:
      a.courseId ||
      d.lessons.find((l) => l.id === a.lessonId)?.courseId ||
      "course-ai",
  }));
  d.submissions = d.submissions.map((a) => ({
    ...a,
    courseId:
      a.courseId ||
      d.lessons.find((l) => l.id === a.lessonId)?.courseId ||
      "course-ai",
    reviews: a.reviews || [],
    lessonTitle:
      a.lessonTitle ||
      d.lessons.find((l) => l.id === a.lessonId)?.title ||
      "Eski dars",
  }));
  d.schemaVersion = 4;
  return d;
}
export function read() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return migrate(structuredClone(seed));
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw Error(
      "Saqlangan ma’lumot buzilgan. Brauzer ma’lumotlarini o‘chirmang; zaxiradan tiklang.",
    );
  }
  if (!Array.isArray(value.users) || !Array.isArray(value.lessons))
    throw Error("Ma’lumot tuzilmasi noto‘g‘ri.");
  return migrate(value);
}
export function write(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}
export function enrollmentsFor(d, userId) {
  return d.enrollments.filter((e) => e.userId === userId);
}
export function hasCourse(d, userId, courseId) {
  return d.enrollments.some(
    (e) => e.userId === userId && e.courseId === courseId,
  );
}
export function studentLessons(d, userId, courseId) {
  const ids = enrollmentsFor(d, userId).map((e) => e.courseId);
  return d.lessons.filter(
    (l) => ids.includes(l.courseId) && (!courseId || l.courseId === courseId),
  );
}
export function attemptPassed(a) {
  return a.total > 0 && Number.isInteger(a.correctCount)
    ? a.correctCount * 100 > a.total * 70
    : a.score > 70;
}
export function passed(d, userId, lessonId) {
  return d.attempts.some(
    (a) => a.userId === userId && a.lessonId === lessonId && attemptPassed(a),
  );
}
export const completed = passed;
export function unlocked(d, userId, lessonId) {
  const lesson = d.lessons.find((l) => l.id === lessonId);
  if (!lesson || !lesson.published || !hasCourse(d, userId, lesson.courseId))
    return false;
  const list = d.lessons.filter(
    (l) => l.courseId === lesson.courseId && l.published,
  );
  return list
    .slice(
      0,
      list.findIndex((l) => l.id === lessonId),
    )
    .every((l) => passed(d, userId, l.id));
}
export function gradeAttempt(session, answers) {
  if (!session.questions.length) throw Error("Savollar yo‘q.");
  if (
    session.questions.some(
      (q) =>
        !Number.isInteger(answers[q.id]) ||
        answers[q.id] < 0 ||
        answers[q.id] >= q.options.length,
    )
  )
    throw Error("Barcha savollarga javob bering.");
  const correctCount = session.questions.filter(
    (q) => answers[q.id] === q.correct,
  ).length;
  return {
    ...session,
    answers: { ...answers },
    correctCount,
    total: session.questions.length,
    score: (correctCount / session.questions.length) * 100,
    createdAt: new Date().toISOString(),
  };
}
export function recordAttempt(d, session, answers) {
  if (d.attempts.some((a) => a.id === session.id)) return;
  const key = session.userId + ":" + session.lessonId;
  if (d.testSessions[key]?.id !== session.id)
    throw Error("Test sessiyasi o‘zgargan.");
  if (!unlocked(d, session.userId, session.lessonId))
    throw Error("Dars yopilgan.");
  d.attempts.push(gradeAttempt(session, answers));
  delete d.testSessions[key];
}
export function enrollmentSummary(d, e) {
  const paid = d.payments
    .filter(
      (p) => p.userId === e.userId && p.courseId === e.courseId && !p.voidedAt,
    )
    .reduce((n, p) => n + p.amount, 0);
  return {
    fee: e.fee,
    paid,
    debt: Math.max(0, e.fee - paid),
    credit: Math.max(0, paid - e.fee),
  };
}
export function paymentSummary(d, user) {
  return enrollmentsFor(d, user.id).reduce(
    (out, e) => {
      const s = enrollmentSummary(d, e);
      for (const k of Object.keys(out)) out[k] += s[k];
      return out;
    },
    { fee: 0, paid: 0, debt: 0, credit: 0 },
  );
}
export function saveStudent(d, draft, selected) {
  const email = draft.email.trim().toLowerCase(),
    name = draft.name.trim();
  if (
    name.length < 3 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    draft.password.length < 8
  )
    throw Error("Ism, email va kamida 8 belgili parol kiriting.");
  if (d.users.some((u) => u.id !== draft.id && u.email.toLowerCase() === email))
    throw Error("Email band.");
  const ids = [...new Set(selected)];
  if (!ids.length || ids.some((id) => !d.courses.some((c) => c.id === id)))
    throw Error("Kamida bitta mavjud kursni tanlang.");
  for (const e of enrollmentsFor(d, draft.id).filter(
    (e) => !ids.includes(e.courseId),
  )) {
    if (
      d.payments.some(
        (p) => p.userId === draft.id && p.courseId === e.courseId,
      ) ||
      d.attempts.some(
        (a) => a.userId === draft.id && a.courseId === e.courseId,
      ) ||
      d.submissions.some(
        (a) => a.userId === draft.id && a.courseId === e.courseId,
      ) ||
      d.certificates.some(
        (c) => c.userId === draft.id && c.courseId === e.courseId,
      ) ||
      d.lessons.some(
        (l) =>
          l.courseId === e.courseId && d.progress[draft.id]?.[l.id]?.watched,
      )
    )
      throw Error("Tarixi yoki to‘lovi bor kursni olib tashlab bo‘lmaydi.");
  }
  d.enrollments = d.enrollments.filter(
    (e) => e.userId !== draft.id || ids.includes(e.courseId),
  );
  for (const id of ids)
    if (!hasCourse(d, draft.id, id))
      d.enrollments.push({
        id: uid(),
        userId: draft.id,
        courseId: id,
        fee: integer(d.courses.find((c) => c.id === id).price),
        createdAt: new Date().toISOString(),
      });
  const old = d.users.find((u) => u.id === draft.id);
  const value = { ...draft, name, email, role: "student" };
  if (old) Object.assign(old, value);
  else d.users.push(value);
}
export function addPayment(d, p) {
  if (d.payments.some((x) => x.id === p.id)) return;
  const e = d.enrollments.find(
    (e) => e.userId === p.userId && e.courseId === p.courseId,
  );
  if (!e) throw Error("Talaba kursga biriktirilmagan.");
  const amount = integer(p.amount, 1);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
    p.date > localDate() ||
    new Date(p.date + "T00:00:00Z").toISOString().slice(0, 10) !== p.date
  )
    throw Error("To‘lov sanasi noto‘g‘ri.");
  if (amount > enrollmentSummary(d, e).debt)
    throw Error("To‘lov qolgan qarzdan oshmasligi kerak.");
  d.payments.push({ ...p, amount, createdAt: new Date().toISOString() });
}
export function submitPractice(d, s) {
  if (d.submissions.some((x) => x.id === s.id)) return;
  if (!unlocked(d, s.userId, s.lessonId))
    throw Error("Darsga kirish yopilgan.");
  if (s.answer.trim().length < 5) throw Error("Kamida 5 belgi yozing.");
  if (
    d.submissions.some(
      (x) =>
        x.userId === s.userId &&
        x.lessonId === s.lessonId &&
        x.status === "pending",
    )
  )
    throw Error("Oldingi vazifa tekshirilmoqda.");
  d.submissions.push({
    ...s,
    answer: s.answer.trim(),
    status: "pending",
    reviews: [],
    createdAt: new Date().toISOString(),
  });
}
export function reviewPractice(d, id, status, grade, feedback, adminId) {
  if (!["approved", "rejected"].includes(status))
    throw Error("Natija holati noto‘g‘ri.");
  const s = d.submissions.find((s) => s.id === id);
  if (!s || s.status !== "pending")
    throw Error("Bu vazifa avval tekshirilgan.");
  const score = integer(grade);
  if (score > 100) throw Error("Baho 0–100 oralig‘ida bo‘lsin.");
  Object.assign(s, {
    status,
    grade: score,
    feedback,
    reviewedAt: new Date().toISOString(),
  });
  s.reviews.push({
    status,
    grade: score,
    feedback,
    adminId,
    createdAt: s.reviewedAt,
  });
}
export function courseResult(d, userId, courseId) {
  const lessons = d.lessons.filter(
    (l) => l.courseId === courseId && l.published,
  );
  const scores = lessons.map((l) =>
    Math.max(
      0,
      ...d.attempts
        .filter((a) => a.userId === userId && a.lessonId === l.id)
        .map((a) => a.score),
    ),
  );
  const tests = lessons.filter((l) => passed(d, userId, l.id)).length;
  const watched = lessons.filter(
    (l) => d.progress[userId]?.[l.id]?.watched,
  ).length;
  const practical = lessons.filter((l) =>
    d.submissions.some(
      (s) =>
        s.userId === userId && s.lessonId === l.id && s.status === "approved",
    ),
  ).length;
  return {
    lessons,
    tests,
    watched,
    practical,
    average: scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0,
    ready:
      hasCourse(d, userId, courseId) &&
      lessons.length > 0 &&
      tests === lessons.length &&
      watched === lessons.length &&
      practical === lessons.length,
  };
}
export function issueCertificate(d, userId, courseId) {
  const existing = d.certificates.find(
    (c) => c.userId === userId && c.courseId === courseId,
  );
  if (existing) return existing;
  const r = courseResult(d, userId, courseId);
  if (!r.ready) throw Error("Kurs shartlari hali bajarilmagan.");
  const cert = {
    id: uid(),
    userId,
    courseId,
    name: d.users.find((u) => u.id === userId).name,
    title: d.courses.find((c) => c.id === courseId).title,
    score: r.average,
    createdAt: new Date().toISOString(),
    lessonCount: r.lessons.length,
  };
  d.certificates.push(cert);
  return cert;
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

export async function downloadMaterial(m) {
  const blob = await getFile(m.fileId);
  if (!blob) throw Error("Fayl shu brauzerda topilmadi. Admin qayta yuklasin.");
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = m.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
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

## src/setupTests.js

```js
import { TextEncoder, TextDecoder } from "util";
import { randomUUID } from "crypto";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
if (!global.crypto) global.crypto = {};
Object.defineProperty(global.crypto, "randomUUID", {
  value: randomUUID,
  configurable: true,
});
global.IS_REACT_ACT_ENVIRONMENT = true;

```
