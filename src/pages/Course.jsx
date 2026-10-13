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
