import { Award, CheckCircle, Lock, Printer } from "lucide-react";
import { useApp } from "../context/AppContext";
import { studentLessons, completed } from "../services/db";
import "./Certificate.css";
export default function Certificate() {
  const { data, user } = useApp();
  const lessons = studentLessons(data, user.id).filter((l) => l.published);
  const count = lessons.filter((l) => completed(data, user.id, l.id)).length;
  const ready =
    lessons.length > 0 &&
    count === lessons.length &&
    lessons.every(
      (l) =>
        data.progress[user.id]?.[l.id]?.watched &&
        data.submissions.some(
          (s) =>
            s.userId === user.id &&
            s.lessonId === l.id &&
            s.status === "approved",
        ),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">NATIJANGIZGA MUNOSIB E’TIROF</div>
          <h1>Sertifikat</h1>
          <p>Kursni muvaffaqiyatli yakunlang va yutug‘ingizni nishonlang.</p>
        </div>
        <Award className="purple" size={30} />
      </div>
      <div className="certificate-layout">
        <div className={"certificate " + (!ready ? "preview" : "")}>
          <div className="cert-brand">✦ AI Academy</div>
          <span className="cert-overline">
            MUVAFFAQIYATLI TAMOMLAGANLIK UCHUN
          </span>
          <h2>SERTIFIKAT</h2>
          <p>Ushbu sertifikat egasi</p>
          <h3>{user.name}</h3>
          <p>
            «{data.courses.find((c) => c.id === user.courseId)?.title}»
            kursidagi barcha darslar,
            <br />
            amaliy vazifalar va testlarni muvaffaqiyatli yakunladi.
          </p>
          <div className="cert-bottom">
            <div>
              <strong>
                {ready ? new Date().toLocaleDateString("uz-UZ") : "—"}
              </strong>
              <small>Sana</small>
            </div>
            <div className="seal">
              <Award size={35} />
            </div>
            <div>
              <strong>AI Academy</strong>
              <small>Ta’lim jamoasi</small>
            </div>
          </div>
          <small>
            ID: AI-{user.id.slice(0, 8).toUpperCase()} ·{" "}
            {ready ? "Demo sertifikat" : "NAMUNA — HALI BERILMAGAN"}
          </small>
        </div>
        <div className="panel cert-requirements">
          <h3>Sertifikat olish shartlari</h3>
          <p>
            <CheckCircle size={17} /> Barcha videolarni oxirigacha ko‘rish
          </p>
          <p>
            <CheckCircle size={17} /> Testlardan 70% dan yuqori olish
          </p>
          <p>
            <CheckCircle size={17} /> Vazifalarni admin tasdiqlashi
          </p>
          <div className="progress">
            <i
              style={{
                width:
                  (lessons.length ? (count / lessons.length) * 100 : 0) + "%",
              }}
            />
          </div>
          <p>
            {count}/{lessons.length} dars to‘liq yakunlangan
          </p>
          <button
            className="primary"
            disabled={!ready}
            onClick={() => window.print()}
          >
            {ready ? <Printer size={16} /> : <Lock size={16} />}{" "}
            {ready ? "Sertifikatni PDF saqlash" : "Hozircha yopiq"}
          </button>
          <small>
            Ochilgach, chop etish oynasida “Save as PDF” ni tanlang.
          </small>
        </div>
      </div>
    </>
  );
}
