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
