import { createContext, useContext, useRef, useState } from "react";
import { read, write } from "../services/db";
const Context = createContext(null);
const KEY = "academy-user";
export function AppProvider({ children }) {
  const [data, setData] = useState(read);
  const current = useRef(data);
  const [session, setSession] = useState(
    () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY),
  );
  const [notice, setNotice] = useState("");
  const user = data.users.find((u) => u.id === session && u.active);
  function update(callback) {
    try {
      const next = structuredClone(current.current);
      callback(next);
      write(next);
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
