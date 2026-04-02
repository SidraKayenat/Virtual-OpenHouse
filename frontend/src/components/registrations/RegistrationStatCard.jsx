import React from "react";

const RegistrationStatCard = ({
  label,
  value,
  color,
  icon: Icon,
  onClick,
  active,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-4 rounded-2xl text-left transition-all duration-200 w-full"
      style={{
        background: active ? `${color}15` : "rgba(255,255,255,0.03)",
        border: active
          ? `1px solid ${color}40`
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: active ? `0 0 20px ${color}15` : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={15} style={{ color }} strokeWidth={2} />
        </div>
        {active && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
        )}
      </div>
      <div>
        <p
          className="text-[26px] font-bold leading-none text-white"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {value}
        </p>
        <p
          className="text-[11.5px] mt-1"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {label}
        </p>
      </div>
    </button>
  );
};

export default RegistrationStatCard;
