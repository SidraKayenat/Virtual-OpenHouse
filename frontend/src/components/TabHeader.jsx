import { useNavigate } from "react-router-dom";

export default function TabHeader({ activeTab }) {
  const navigate = useNavigate();

  return (
    <div className="flex rounded-xl overflow-hidden">
      <button
        disabled={activeTab === "signup"}
        onClick={() => navigate("/register")}
        className={`flex-1 py-3 text-center font-semibold  transition-colors ${
          activeTab === "signup"
            ? "text-white bg-black"
            : "text-white bg-[#111111]/25 hover:bg-[#111111]/35"
        }`}
      >
        Sign up
      </button>
      <button
        disabled={activeTab === "login"}
        onClick={() => navigate("/login")}
        className={`flex-1 py-3 text-center font-semibold  transition-colors ${
          activeTab === "login"
            ? "text-white bg-black"
            : "text-white bg-[#111111]/25 hover:bg-[#111111]/35"
        }`}
      >
        Log in
      </button>
    </div>
  );
}
