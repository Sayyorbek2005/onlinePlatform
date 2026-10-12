export const KEY = "ai-academy-v1";
export const uid = () => crypto.randomUUID();
export const seed = {
  courses: [
    {
      id: "course-ai",
      title: "Sun’iy intellekt asoslari",
      price: 0,
      description: "AI Foundation",
    },
  ],
  users: [
    {
      id: "admin",
      name: "Sayyorbek",
      email: "admin@academy.uz",
      password: "Admin123!",
      role: "admin",
      active: true,
    },
    {
      id: "student",
      courseId: "course-ai",
      name: "Abdullayev Behzod",
      email: "student@academy.uz",
      password: "Student123!",
      role: "student",
      active: true,
    },
  ],
  lessons: [
    [
      "Kirish darsi: AI nima?",
      "Sun’iy intellekt bilan tanishing",
      12,
      "AI yordamida o‘zingizni tanishtiruvchi prompt yozing.",
    ],
    [
      "Prompt yozish asoslari",
      "Aniq savol — yaxshi natija",
      15,
      "Maqsad, kontekst va formatdan iborat prompt yozing.",
    ],
    [
      "AI yordamida matn yaratish",
      "G‘oyalarni so‘zlarga aylantiring",
      18,
      "AI yordamida mahsulot uchun qisqa matn tayyorlang.",
    ],
    [
      "Rasm generatsiya qilish",
      "Tasavvuringizga shakl bering",
      20,
      "Rasm yaratish uchun batafsil prompt tuzing.",
    ],
    [
      "Amaliy loyiha: Mini chatbot",
      "Birinchi loyihangizni yarating",
      25,
      "Chatbot loyihangiz va ishlash tartibini tushuntiring.",
    ],
  ].map((x, i) => ({
    id: "lesson-" + i,
    courseId: "course-ai",
    title: x[0],
    description: x[1],
    duration: x[2],
    task: x[3],
    video: "",
    fileId: "",
    published: true,
    questions: [
      {
        id: "q-" + i,
        text:
          i === 0
            ? "AI nimani anglatadi?"
            : "Yaxshi prompt nimadan boshlanadi?",
        options:
          i === 0
            ? [
                "Sun’iy intellekt",
                "Internet tezligi",
                "Kompyuter xotirasi",
                "Dastur hajmi",
              ]
            : [
                "Aniq maqsaddan",
                "Tasodifiy so‘zlardan",
                "Faqat emojidan",
                "Bo‘sh matndan",
              ],
        correct: 0,
      },
    ],
  })),
  progress: {},
  submissions: [],
  attempts: [],
  tickets: [],
  payments: [],
  testSessions: {},
};
export function read() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d?.users || !d?.lessons) return structuredClone(seed);
    return {
      ...structuredClone(seed),
      ...d,
      courses: d.courses || structuredClone(seed.courses),
      users: d.users.map((u) =>
        u.role === "student" ? { courseId: "course-ai", ...u } : u,
      ),
      lessons: d.lessons.map((l) => ({ courseId: "course-ai", ...l })),
      payments: d.payments || [],
      testSessions: d.testSessions || {},
    };
  } catch {
    return structuredClone(seed);
  }
}
export function write(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}
// Test sharti: aynan 70% yetarli emas. Xom nisbat bo‘yicha tekshiriladi.
export function attemptPassed(a) {
  return Number.isInteger(a.correctCount) && a.total > 0
    ? a.correctCount * 100 > a.total * 70
    : a.score > 70;
}
export function passed(d, userId, lessonId) {
  return d.attempts.some(
    (a) => a.userId === userId && a.lessonId === lessonId && attemptPassed(a),
  );
}
export function completed(d, userId, lessonId) {
  return passed(d, userId, lessonId);
}
export function unlocked(d, userId, lessonId) {
  const list = studentLessons(d, userId).filter((l) => l.published);
  const index = list.findIndex((l) => l.id === lessonId);
  return (
    index >= 0 && list.slice(0, index).every((l) => passed(d, userId, l.id))
  );
}
export function gradeAttempt(session, answers) {
  const questions = session.questions;
  if (!questions.length) throw Error("Test savollari yo‘q.");
  if (
    questions.some(
      (q) =>
        !Number.isInteger(answers[q.id]) ||
        answers[q.id] < 0 ||
        answers[q.id] >= q.options.length,
    )
  )
    throw Error("Barcha savollarga javob bering.");
  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correct,
  ).length;
  return {
    ...session,
    answers: { ...answers },
    total: questions.length,
    correctCount,
    score: (correctCount / questions.length) * 100,
    createdAt: new Date().toISOString(),
  };
}
export function recordAttempt(d, session, answers) {
  const key = session.userId + ":" + session.lessonId;
  if (d.attempts.some((a) => a.id === session.id)) return;
  if (d.testSessions[key]?.id !== session.id)
    throw Error("Test sessiyasi o‘zgargan. Sahifani yangilang.");
  d.attempts.push(gradeAttempt(session, answers));
  delete d.testSessions[key];
}
export function paymentSummary(d, user) {
  const paid = (d.payments || [])
    .filter((x) => x.userId === user.id)
    .reduce((n, x) => n + Number(x.amount), 0);
  const fee = Number(user.courseFee) || 0;
  return {
    fee,
    paid,
    debt: Math.max(0, fee - paid),
    credit: Math.max(0, paid - fee),
  };
}
const open = () =>
  new Promise((res, rej) => {
    const r = indexedDB.open("academy-media", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
export async function putFile(file) {
  const db = await open();
  const id = uid();
  return new Promise((res, rej) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => {
      db.close();
      res(id);
    };
    tx.onerror = () => {
      db.close();
      rej(tx.error);
    };
  });
}
export async function getFile(id) {
  const db = await open();
  return new Promise((res, rej) => {
    const r = db.transaction("files").objectStore("files").get(id);
    r.onsuccess = () => {
      db.close();
      res(r.result);
    };
    r.onerror = () => {
      db.close();
      rej(r.error);
    };
  });
}

export function studentLessons(d, userId) {
  const user = d.users.find((u) => u.id === userId);
  return user?.courseId
    ? d.lessons.filter((l) => l.courseId === user.courseId)
    : [];
}
