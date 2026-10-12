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
