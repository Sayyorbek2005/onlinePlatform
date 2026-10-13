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
