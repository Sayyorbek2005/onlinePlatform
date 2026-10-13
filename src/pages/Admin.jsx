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
