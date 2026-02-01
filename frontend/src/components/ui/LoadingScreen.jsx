// src/components/UI/LoadingScreen.jsx

import React from "react";

const LoadingScreen = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontSize: "24px",
        fontWeight: "bold",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          border: "5px solid rgba(255,255,255,0.3)",
          borderTop: "5px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "20px",
        }}
      ></div>
      <div>Loading 3D Environment...</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
