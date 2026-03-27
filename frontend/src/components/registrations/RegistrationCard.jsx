import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Hash, Users, Eye, ExternalLink } from "lucide-react";
import StatusBadge from "./StatusBadge";
// import STATUS_META from "@/components/registrations/STATUS_META";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const RegistrationCard = ({ registration }) => {
  const event = registration.event || {};
  const info = registration.participantInfo || {};
  const image = event.thumbnailUrl || event.thumbnail || "/bg.png";
  const isApproved = registration.status === "approved";
  const isRejected = registration.status === "rejected";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl overflow-hidden group transition-all duration-200"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid rgba(167,139,250,0.28)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={image}
          alt={event.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, #141320 0%, transparent 55%)",
          }}
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <StatusBadge status={registration.status} />
          {isApproved && registration.stallNumber && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(52,211,153,0.25)",
                color: "#6ee7b7",
                border: "1px solid rgba(52,211,153,0.3)",
                backdropFilter: "blur(8px)",
              }}
            >
              Stall #{registration.stallNumber}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Event name */}
        <div>
          <p
            className="text-[10.5px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            Event
          </p>
          <h3
            className="text-white font-bold text-[14px] leading-tight line-clamp-1"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {event.name || "—"}
          </h3>
        </div>

        {/* Project title */}
        {info.projectTitle && (
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-wider mb-0.5"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              Project
            </p>
            <p
              className="text-[13px] font-medium line-clamp-1"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {info.projectTitle}
            </p>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-col gap-1.5 mt-auto">
          {event.liveDate && (
            <p
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              <Calendar size={11} /> {fmt(event.liveDate)}
            </p>
          )}
          {event.venue && (
            <p
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              <MapPin size={11} /> {event.venue}
            </p>
          )}
          {info.category && (
            <p
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              <Hash size={11} /> {info.category}
            </p>
          )}
          {info.teamMembers?.length > 0 && (
            <p
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              <Users size={11} /> {info.teamMembers.length} team member
              {info.teamMembers.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Rejection reason */}
        {isRejected && registration.rejectionReason && (
          <div
            className="px-3 py-2 rounded-xl text-[11.5px] leading-snug"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.18)",
              color: "#fca5a5",
            }}
          >
            <span className="font-semibold">Reason: </span>
            {registration.rejectionReason}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <Link
            to={`/registration/${registration._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: "rgba(124,58,237,0.18)",
              color: "#c4b5fd",
              border: "1px solid rgba(124,58,237,0.25)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(124,58,237,0.28)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(124,58,237,0.18)")
            }
          >
            <Eye size={12} /> View Details
          </Link>
          {event._id && (
            <Link
              to={`/events/${event._id}`}
              className="flex items-center justify-center px-3 py-2 rounded-xl text-[12px] transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.38)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(255,255,255,0.38)";
              }}
            >
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RegistrationCard;
