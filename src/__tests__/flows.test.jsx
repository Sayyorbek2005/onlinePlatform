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
