import React from "react";

import { motion } from "framer-motion";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
import { Link, Navigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useNavigate } from "react-router-dom";

const RegistrationRow = ({ registration }) => {
  const event = registration.event || {};
  const info = registration.participantInfo || {};
  const image = event.thumbnailUrl || event.thumbnail || "/bg.png";
  const navigate = useNavigate();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-150 group"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.045)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
      }
    >
      <div
        className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#1e3a5f,#2563eb)" }}
      >
        <img src={image} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-[13.5px] truncate">
          {event.name || "—"}
        </p>
        <p
          className="text-[11px] mt-0.5 truncate"
          style={{ color: "rgba(255,255,255,0.32)" }}
        >
          {info.projectTitle ? `${info.projectTitle} · ` : ""}
          {fmt(event.liveDate)}
          {event.venue ? ` · ${event.venue}` : ""}
        </p>
      </div>

      {registration.status === "approved" && registration.stallNumber && (
        <span
          className="text-[10.5px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            background: "rgba(52,211,153,0.12)",
            color: "#34d399",
            border: "1px solid rgba(52,211,153,0.2)",
          }}
        >
          Stall #{registration.stallNumber}
        </span>
      )}

      <StatusBadge status={registration.status} />

      <Link
        to={`/registration/${registration._id}`}
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}
      >
        <ChevronRight size={14} />
      </Link>
    </motion.div>
  );
};

export default RegistrationRow;
