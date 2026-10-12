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
