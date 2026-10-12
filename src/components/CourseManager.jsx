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
