import React, { useState } from "react";
import "../styles/loginandregister.css";
import { useNavigate } from "react-router-dom";
import useAxiosAuth from "../hooks/useAxiosAuth";
import AppImages from "core/constants/AppImages";
import HowToPlay from "components/HowToPlay";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const axiosAuth = useAxiosAuth();

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      alert("Please fill in all fields!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Password and Confirm Password do not match!");
      return;
    }

    try {
      const res = await axiosAuth.post("/api/auth/register", {
        username,
        email,
        password,
      });

      if (res.status === 200) {
        localStorage.setItem("accessToken", res.data.accessToken);
        alert(
          `Successfully registered with Username: ${username}, Email: ${email}`
        );
        navigate("/lobby");
      } else {
        alert(res.data.message || "Registration failed!");
      }
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "An error occurred during registration."
      );
    }
  };

  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  return (
    <div id="home">
      <img src={AppImages.Logo} alt="Logo" className="logo" />
      <div className="form-container">
        <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button className="confirm-btn" onClick={handleRegister}>
            Confirm
          </button>
          <button className="back-btn" onClick={handleSwitchToLogin}>
            Back
          </button>
        </div>
      </div>
      <HowToPlay />
    </div>
  );
};

export default Register;
