import React, { useEffect, useState } from "react";
import "../styles/loginandregister.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useStore from "../store";
import AppImages from "core/constants/AppImages";
import HowToPlay from "components/HowToPlay";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useStore();
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (username && password) {
      try {
        await login(username, password);
        setUser(username);
        navigate("/lobby");
      } catch (error) {
        console.log(error);
        alert("Tên đăng nhập hoặc mật khẩu chưa đúng!");
      }
    } else {
      alert("Vui lòng điền đầy đủ thông tin!");
    }
  };
  const switchToRegister = () => {
    navigate("/register");
  };
  useEffect(() => {
    if (user) {
      navigate("/lobby");
    }
  }, [user, navigate]);

  return (
    <div id="home">
      <img src={AppImages.Logo} alt="Logo" className="logo" />
      <div className="form-container">
        <div className="form-group">
          <input
            className="w-full px-3 py-2 rounded text-black"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            className="w-full px-3 py-2 rounded text-black"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button className="confirm-btn" onClick={handleLogin}>
            Login
          </button>
          <button className="register-btn" onClick={switchToRegister}>
            Register
          </button>
        </div>
      </div>
      <HowToPlay/>
    </div>
  );
};

export default Login;
