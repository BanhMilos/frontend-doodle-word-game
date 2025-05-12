import React from "react";

export default function LoadingSpinner({ size = 40, color = "#09f" }) {
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const spinnerStyle = {
    width: size,
    height: size,
    border: `${size * 0.1}px solid rgba(0, 0, 0, 0.1)`,
    borderLeftColor: color,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  const keyframesStyle = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <>
      <style>{keyframesStyle}</style>
      <div style={overlayStyle}>
        <div style={spinnerStyle}></div>
      </div>
    </>
  );
}
