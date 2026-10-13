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
