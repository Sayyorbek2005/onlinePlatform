import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  studentLessons,
  getFile,
  uid,
  unlocked,
  passed,
  attemptPassed,
  recordAttempt,
} from "../services/db";
import "./Lesson.css";
function Player({ lesson, onEnd, watermark }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      objectUrl;
    setSrc("");
    setError("");
    if (lesson.fileId) {
      getFile(lesson.fileId)
        .then((file) => {
          if (!active) return;
          if (!file) {
            setError(
              "Video bu brauzerda topilmadi. Admin videoni qayta yuklashi kerak.",
            );
            return;
          }
          objectUrl = URL.createObjectURL(file);
          setSrc(objectUrl);
        })
        .catch(() => active && setError("Video faylini ochib bo‘lmadi."));
    } else setSrc(lesson.video);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [lesson.fileId, lesson.video]);
  return src && !error ? (
    <div className="protected-video" onContextMenu={(e) => e.preventDefault()}>
      <div className="video-watermark">{watermark}</div>
      <video
        className="video"
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        onEnded={onEnd}
        onError={() =>
          setError("Video ochilmadi. Manzil va formatni tekshiring.")
        }
        src={src}
      />
    </div>
  ) : (
    <div className="video-empty">
      <PlayCircle size={52} />
      <h3>Bilim sari birinchi qadam</h3>
      <p>{error || "Admin ushbu dars videosini hali yuklamagan."}</p>
      <small>Video yuklangach, shu yerda tomosha qilasiz.</small>
    </div>
  );
}

export default function Lesson() {
  const { id } = useParams();
  const { data, user, update, notify } = useApp();
  const [answer, setAnswer] = useState("");
  const submitting = useRef(false);
  useEffect(() => {
    setAnswer("");
    submitting.current = false;
  }, [id]);
  const lesson = data.lessons.find((l) => l.id === id && l.published);
  if (!lesson || !unlocked(data, user.id, id))
    return (
      <div className="empty">
        <h2>Dars yopiq yoki mavjud emas</h2>
        <p>Oldingi faol darslar testidan 70% dan yuqori oling.</p>
        <Link to="/student">Kursga qaytish</Link>
      </div>
    );
  const key = user.id + ":" + id;
  const session = data.testSessions[key];
  const attempts = data.attempts.filter(
    (a) => a.userId === user.id && a.lessonId === id,
  );
  const latest = attempts[attempts.length - 1];
  const sub = data.submissions.find(
    (s) => s.userId === user.id && s.lessonId === id,
  );
  function startTest() {
    if (!lesson.questions.length) return notify("Admin hali test kiritmagan.");
    update((d) => {
      if (d.testSessions[key]) return;
      d.testSessions[key] = {
        id: uid(),
        userId: user.id,
        lessonId: id,
        lessonTitle: lesson.title,
        startedAt: new Date().toISOString(),
        questions: structuredClone(lesson.questions),
        answers: {},
      };
    });
  }
  function choose(questionId, value) {
    update((d) => {
      if (d.testSessions[key]?.id === session.id)
        d.testSessions[key].answers[questionId] = value;
    });
  }
  function finish(e) {
    e.preventDefault();
    if (submitting.current || !session) return;
    submitting.current = true;
    const ok = update((d) =>
      recordAttempt(d, session, d.testSessions[key]?.answers || {}),
    );
    submitting.current = false;
    if (ok)
      notify("Natija saqlandi. Topshirilgan javoblarni o‘zgartirib bo‘lmaydi.");
  }
  function watchedEnd() {
    update((d) => {
      d.progress[user.id] ??= {};
      d.progress[user.id][id] = {
        ...d.progress[user.id][id],
        watched: true,
        watchedAt: new Date().toISOString(),
      };
    });
  }
  function submitTask(e) {
    e.preventDefault();
    if (answer.trim().length < 5) return notify("Kamida 5 ta belgi yozing.");
    const ok = update((d) => {
      d.submissions = d.submissions.filter(
        (s) => !(s.userId === user.id && s.lessonId === id),
      );
      d.submissions.push({
        id: uid(),
        userId: user.id,
        lessonId: id,
        answer: answer.trim(),
        status: "pending",
        feedback: "",
        createdAt: new Date().toISOString(),
      });
    });
    if (ok) {
      setAnswer("");
      notify("Vazifa yuborildi.");
    }
  }
  return (
    <>
      <Link className="back" to="/student">
        <ArrowLeft size={15} /> Kursga qaytish
      </Link>
      <div className="page-heading">
        <div>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
        </div>
        {passed(data, user.id, id) && (
          <span className="badge green">Testdan o‘tilgan</span>
        )}
      </div>
      <div className="lesson-columns">
        <section>
          <Player
            key={id}
            lesson={lesson}
            onEnd={watchedEnd}
            watermark={user.name + " · " + user.email}
          />
          <p className="small muted">
            {data.progress[user.id]?.[id]?.watched
              ? "✓ Video yakunlangan"
              : "Video oxirida ko‘rilganlik saqlanadi."}
          </p>
          <section className="panel task-panel">
            <h3>Dars testi</h3>
            <p>
              Keyingi dars uchun natija 70% dan yuqori bo‘lishi kerak. 70%
              yetarli emas.
            </p>
            {session ? (
              <form onSubmit={finish}>
                {session.questions.map((q, i) => (
                  <fieldset key={q.id}>
                    <legend>
                      {i + 1}. {q.text}
                    </legend>
                    {q.options.map((option, j) => (
                      <label className="test-option" key={j}>
                        <input
                          type="radio"
                          required
                          name={q.id}
                          checked={session.answers[q.id] === j}
                          onChange={() => choose(q.id, j)}
                        />
                        {option}
                      </label>
                    ))}
                  </fieldset>
                ))}
                <button className="primary">Testni yakunlash</button>
              </form>
            ) : (
              <>
                {latest && (
                  <div className="result">
                    Oxirgi natija: {latest.score.toFixed(2)}% —{" "}
                    {attemptPassed(latest) ? "O‘tdingiz" : "O‘tmadingiz"}.
                    Natija o‘zgartirilmaydi.
                  </div>
                )}
                <button
                  className="primary"
                  disabled={!lesson.questions.length}
                  onClick={startTest}
                >
                  {latest
                    ? "Testni boshidan qayta boshlash"
                    : "Testni boshlash"}
                </button>
                {!lesson.questions.length && (
                  <p>
                    Test hali kiritilmagan. Administratorga murojaat qiling.
                  </p>
                )}
              </>
            )}
            {attempts.length > 0 && (
              <details className="attempt-history">
                <summary>Urinishlar tarixi ({attempts.length})</summary>
                {[...attempts].reverse().map((a) => (
                  <div className="submission" key={a.id}>
                    <strong>
                      {a.score.toFixed(2)}% ·{" "}
                      {attemptPassed(a) ? "O‘tdi" : "O‘tmadi"}
                    </strong>
                    <p>{new Date(a.createdAt).toLocaleString("uz-UZ")}</p>
                    {a.questions?.map((q, i) => (
                      <p key={q.id}>
                        {i + 1}. {q.text}
                        <br />
                        Javobingiz: {q.options[a.answers?.[q.id]] ?? "—"}
                      </p>
                    ))}
                  </div>
                ))}
              </details>
            )}
          </section>
          <section className="panel task-panel">
            <h3>Amaliy vazifa</h3>
            <p>{lesson.task}</p>
            {sub && (
              <div className="submission">
                <strong>
                  {
                    {
                      pending: "Tekshirilmoqda",
                      approved: "Tasdiqlandi",
                      rejected: "Qayta ishlash kerak",
                    }[sub.status]
                  }
                </strong>
                <p>{sub.answer}</p>
                <p>{sub.feedback}</p>
              </div>
            )}
            {sub?.status !== "approved" && (
              <form onSubmit={submitTask}>
                <textarea
                  required
                  minLength={5}
                  maxLength={10000}
                  aria-label="Vazifa javobi"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <button className="primary">Vazifani topshirish</button>
              </form>
            )}
          </section>
        </section>
        <aside className="panel contents">
          <h3>Kurs darslari</h3>
          {studentLessons(data, user.id)
            .filter((l) => l.published)
            .map((l, i) => (
              <div key={l.id} className={l.id === id ? "selected" : ""}>
                <span>{i + 1}</span>
                {unlocked(data, user.id, l.id) ? (
                  <Link to={"/student/lesson/" + l.id}>{l.title}</Link>
                ) : (
                  <small>🔒 {l.title}</small>
                )}
              </div>
            ))}
        </aside>
      </div>
    </>
  );
}
