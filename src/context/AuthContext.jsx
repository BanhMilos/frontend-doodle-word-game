import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        try {
          const res = await axios.get(
            `${process.env.REACT_APP_API_URL}api/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              withCredentials: true,
            }
          );
          setUser(res.data.id);
        } catch (err) {
          console.log("Token expired, try refresh...");
          try {
            const refreshRes = await axios.get(
              `${process.env.REACT_APP_API_URL}api/auth/refresh`,
              { withCredentials: true }
            );
            localStorage.setItem("accessToken", refreshRes.data.accessToken);
            const meRes = await axios.get(
              `${process.env.REACT_APP_API_URL}api/auth/me`,
              {
                headers: {
                  Authorization: `Bearer ${refreshRes.data.accessToken}`,
                },
                withCredentials: true,
              }
            );
            setUser(meRes.data.id);
          } catch (refreshErr) {
            console.log("Refresh failed, logout");
            localStorage.removeItem("accessToken");
            setUser(null);
            console.log(refreshErr);
          }
        }
      } else {
        try {
            const refreshRes = await axios.get(
              `${process.env.REACT_APP_API_URL}api/auth/refresh`,
              { withCredentials: true }
            );
            localStorage.setItem("accessToken", refreshRes.data.accessToken);
            const meRes = await axios.get(
              `${process.env.REACT_APP_API_URL}api/auth/me`,
              {
                headers: {
                  Authorization: `Bearer ${refreshRes.data.accessToken}`,
                },
                withCredentials: true,
              }
            );
            setUser(meRes.data.id);
          } catch (refreshErr) {
            console.log("Refresh failed, logout");
            localStorage.removeItem("accessToken");
            setUser(null);
            console.log(refreshErr);
          }
      }
    };
 checkAuth();
  })
    

  const login = async (username, password) => {
    const res = await axios.post(
      process.env.REACT_APP_API_URL + "api/auth/login",
      { username, password },
      { withCredentials: true }
    );
    localStorage.setItem("accessToken", res.data.accessToken);
    setUser(res.data.user);
  };

  const logout = async () => {
    await axios.get(process.env.REACT_APP_API_URL + "api/auth/logout", { withCredentials: true });
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  const refresh = async () => {
    const res = await axios.get(process.env.REACT_APP_API_URL+"api/auth/refresh", { withCredentials: true });
    localStorage.setItem("accessToken", res.data.accessToken);
    return res.data.accessToken;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
