import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Lock,
  Play,
  Clock,
  Sparkles,
  BookOpen,
  Award,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { studentLessons, completed, unlocked } from "../services/db";
import "./Course.css";
export default function Course() {
  const { data, user } = useApp();
  const list = studentLessons(data, user.id).filter((l) => l.published);
  const count = list.filter((l) => completed(data, user.id, l.id)).length;
  const percent = list.length ? Math.round((count / list.length) * 100) : 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SIZNING BILIM SARI YO‘LINGIZ</div>
          <h1>
            {data.courses.find((c) => c.id === user.courseId)?.title ||
              "Mening kursim"}
          </h1>
          <p>
            Yangi bilimlar, yangi imkoniyatlar. Bugun ham bir qadam oldinga.
          </p>
        </div>
        <span className="pill">
          <Sparkles size={14} />{" "}
          {data.courses.find((c) => c.id === user.courseId)?.title}
        </span>
      </div>
      <section className="course-hero">
        <div>
          <span className="hero-tag">AMALIY ONLAYN KURS</span>
          <h2>
            Sun’iy intellektni
            <br />
            o‘z imkoniyatingizga aylantiring.
          </h2>
          <p>G‘oyadan ilk loyihangizgacha — birgalikda.</p>
          <div className="hero-details">
            <span>
              <BookOpen size={14} /> {list.length} ta dars
            </span>
            <span>
              <Clock size={14} />{" "}
              {list.reduce((s, l) => s + Number(l.duration), 0)} daqiqa
            </span>
            <span>
              <Award size={14} /> Sertifikat
            </span>
          </div>
        </div>
        <div className="hero-ai">
          AI<small>THE FUTURE IS YOURS</small>
        </div>
      </section>
      <div className="course-columns">
        <div>
          <section className="panel progress-card">
            <div className="row">
              <strong>Umumiy progress</strong>
              <span className="purple">{percent}%</span>
            </div>
            <div className="progress">
              <i style={{ width: percent + "%" }} />
            </div>
            <div className="row muted small">
              <span>
                {count}/{list.length} dars yakunlandi
              </span>
              <span>
                {percent === 100
                  ? "Ajoyib natija!"
                  : "Davom eting, siz uddalaysiz!"}
              </span>
            </div>
          </section>
          <div className="section-heading">
            <h3>Kurs dasturi</h3>
            <span>{list.length} ta dars</span>
          </div>
          <div className="lesson-list">
            {list.map((l, i) => {
              const done = completed(data, user.id, l.id);
              const open = unlocked(data, user.id, l.id);
              return (
                <article
                  className={
                    "lesson-row " +
                    (open && !done ? "current" : "") +
                    (open ? "" : " locked")
                  }
                  key={l.id}
                >
                  <span className={"lesson-number " + (done ? "done" : "")}>
                    {done ? (
                      <Check size={16} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <div className="lesson-text">
                    <h3>{l.title}</h3>
                    <p>
                      <Play size={11} /> Video dars <b>·</b> {l.duration} daqiqa{" "}
                      <b>·</b> Vazifa va test
                    </p>
                  </div>
                  {open ? (
                    <Link
                      className={done ? "done-link" : "primary compact"}
                      to={"/student/lesson/" + l.id}
                    >
                      {done ? "Qayta ko‘rish" : "Darsni boshlash"}
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Lock size={17} />
                  )}
                </article>
              );
            })}
            {!list.length && (
              <div className="empty">Hozircha darslar e’lon qilinmagan.</div>
            )}
          </div>
        </div>
        <aside>
          <div className="panel next-card">
            <span className="small-icon">
              <Sparkles size={20} />
            </span>
            <h3>O‘zingizga ishoning.</h3>
            <p>
              Har bir yangi ko‘nikma sizga yangi eshiklarni ochadi. Bugungi
              kichik qadam — ertangi katta natija.
            </p>
            <div className="quote-line" />
            <small>O‘RGANISHNI TO‘XTATMANG</small>
          </div>
          <div className="certificate-teaser">
            <Award size={29} />
            <h3>Mehnatingiz e’tirofi</h3>
            <p>
              Barcha dars va vazifalarni yakunlang, shaxsiy sertifikatingizni
              oling.
            </p>
            <Link to="/student/certificate">
              Sertifikat haqida <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
