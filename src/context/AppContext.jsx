import { createContext, useContext, useRef, useState, useEffect } from "react";
import { read, write } from "../services/db";
const Context = createContext(null);
const KEY = "academy-user";
export function AppProvider({ children }) {
  const [data, setData] = useState(read);
  const current = useRef(data);
  const lastSaved = useRef(localStorage.getItem("ai-academy-v1"));
  const [session, setSession] = useState(
    () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY),
  );
  const [notice, setNotice] = useState("");
  const user = data.users.find((u) => u.id === session && u.active);
  useEffect(() => {
    function changed(event) {
      if (event.key === "ai-academy-v1") {
        try {
          const next = read();
          current.current = next;
          setData(next);
          lastSaved.current = event.newValue;
        } catch (e) {
          setNotice(e.message);
        }
      }
    }
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  function update(callback) {
    try {
      if (localStorage.getItem("ai-academy-v1") !== lastSaved.current) {
        const latest = read();
        current.current = latest;
        setData(latest);
        lastSaved.current = localStorage.getItem("ai-academy-v1");
        throw Error(
          "Boshqa oynada ma’lumot o‘zgardi. Tekshirib qayta saqlang.",
        );
      }
      const next = structuredClone(current.current);
      callback(next);
      write(next);
      lastSaved.current = localStorage.getItem("ai-academy-v1");
      current.current = next;
      setData(next);
      return true;
    } catch (error) {
      setNotice(error.message || "Ma’lumot saqlanmadi.");
      return false;
    }
  }
  function login(email, password, remember = true) {
    const account = current.current.users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password &&
        u.active,
    );
    if (!account)
      throw Error("Email yoki parol noto‘g‘ri, yoki hisob bloklangan.");
    write(current.current);
    lastSaved.current = localStorage.getItem("ai-academy-v1");
    (remember ? localStorage : sessionStorage).setItem(KEY, account.id);
    (remember ? sessionStorage : localStorage).removeItem(KEY);
    setSession(account.id);
    setNotice("");
    return account;
  }
  function logout() {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    setSession(null);
    setNotice("");
  }
  return (
    <Context.Provider
      value={{ data, user, update, login, logout, notify: setNotice }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Yopish">
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
