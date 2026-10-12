import CourseManager from "../components/CourseManager";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { completed } from "../services/db";
import "./Admin.css";
export default function Admin() {
  const { data } = useApp();
  const students = data.users.filter((u) => u.role === "student");
  const lessons = data.lessons.filter((l) => l.published);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">AI ACADEMY · ADMIN</div>
          <h1>Umumiy ko‘rinish</h1>
          <p>Ta’lim jarayoni va o‘quvchilar natijalari bir joyda.</p>
        </div>
        <div className="button-row">
          <CourseManager />
          <Link className="primary" to="/admin/lessons">
            + Dars qo‘shish
          </Link>
        </div>
      </div>
      <div className="stats">
        {[
          [Users, "O‘quvchilar", students.length, "/admin/students"],
          [
            BookOpen,
            "E’lon qilingan darslar",
            lessons.length,
            "/admin/lessons",
          ],
          [
            ClipboardCheck,
            "Kutilayotgan vazifalar",
            data.submissions.filter((s) => s.status === "pending").length,
            "/admin/reviews",
          ],
          [
            MessageSquare,
            "Yangi murojaatlar",
            data.tickets.filter((t) => !t.reply).length,
            "/admin/support",
          ],
        ].map(([Icon, title, n, to]) => (
          <Link className="panel stat" to={to} key={title}>
            <Icon size={21} />
            <strong>{n}</strong>
            <span>{title}</span>
          </Link>
        ))}
      </div>
      <section className="panel table-panel">
        <div className="row">
          <h3>O‘quvchilar progressi</h3>
          <Link className="purple small" to="/admin/students">
            Barchasi →
          </Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>O‘quvchi</th>
                <th>Holat</th>
                <th>Yakunlangan darslar</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {students.map((u) => {
                const n = lessons.filter(
                  (l) =>
                    l.courseId === u.courseId && completed(data, u.id, l.id),
                ).length;
                return (
                  <tr key={u.id}>
                    <td>
                      <Link className="purple" to={"/admin/students/" + u.id}>
                        <strong>{u.name} →</strong>
                      </Link>
                      <small>{u.email}</small>
                    </td>
                    <td>
                      <span className={"badge " + (u.active ? "green" : "")}>
                        {u.active ? "Faol" : "Bloklangan"}
                      </span>
                    </td>
                    <td>
                      {n}/
                      {lessons.filter((l) => l.courseId === u.courseId).length}
                    </td>
                    <td>
                      <div className="progress">
                        <i
                          style={{
                            width:
                              (lessons.length
                                ? (n /
                                    (lessons.filter(
                                      (l) => l.courseId === u.courseId,
                                    ).length || 1)) *
                                  100
                                : 0) + "%",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <div className="admin-note">
        <BookOpen size={22} />
        <div>
          <strong>Kursingizni ishga tushiring</strong>
          <p>
            Darsga video yuklang, test kiriting va e’lon qiling. O‘quvchilar
            vazifalarini “Vazifalar” bo‘limida tekshiring.
          </p>
        </div>
        <Link to="/admin/lessons">
          <ArrowRight size={20} />
        </Link>
      </div>
    </>
  );
}
