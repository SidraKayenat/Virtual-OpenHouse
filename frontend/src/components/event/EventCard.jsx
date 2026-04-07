import { Link } from "react-router-dom";
import { Users, Calendar, ArrowRight, Radio, Eye } from "lucide-react";

const EventCard = ({ event, viewMode = "grid" }) => {
  console.log("Check Event Status:", event.status);
  const isLive = event.status === "live";
  const isFull = event.availableStalls === 0;
  const image = event.thumbnailUrl || event.thumbnail || "/thumbnail.png";
  const registered = (event.numberOfStalls ?? 0) - (event.availableStalls ?? 0);
  const fillPct = Math.round((registered / (event.numberOfStalls || 1)) * 100);

  // Different routes for different actions
  const detailsLink = `/events/${event._id}`; // For eye button & details
  const viewerLink = `/event/view/${event._id}`; // For "Join Now" button (3D viewer)

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  // ── List mode ────────────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div
        className="group flex items-center gap-4 rounded-2xl p-3 transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        }}
      >
        <Link
          to={detailsLink}
          className="flex items-center gap-4 flex-1 min-w-0"
        >
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
            <img
              src={image}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            {isLive && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                <Radio size={14} className="text-red-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={
                  isLive
                    ? { background: "rgba(239,68,68,0.15)", color: "#f87171" }
                    : { background: "rgba(96,165,250,0.12)", color: "#60a5fa" }
                }
              >
                {isLive ? "Live" : "Upcoming"}
              </span>
              {isFull && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  Full
                </span>
              )}
            </div>
            <p className="text-white text-[13.5px] font-semibold truncate">
              {event.name}
            </p>
            <p
              className="text-[11px] mt-0.5 truncate"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {event.createdBy?.name}
              {event.liveDate ? ` · ${fmtDate(event.liveDate)}` : ""}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {registered}/{event.numberOfStalls} stalls
          </span>
          {/* Eye button - goes to event details */}
          <Link
            to={detailsLink}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: isLive
                ? "rgba(239,68,68,0.15)"
                : "rgba(167,139,250,0.12)",
              border: isLive
                ? "1px solid rgba(239,68,68,0.25)"
                : "1px solid rgba(167,139,250,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLive
                ? "rgba(239,68,68,0.25)"
                : "rgba(167,139,250,0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isLive
                ? "rgba(239,68,68,0.15)"
                : "rgba(167,139,250,0.12)";
            }}
          >
            <Eye size={14} style={{ color: isLive ? "#f87171" : "#a78bfa" }} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Grid card — full-bleed image + glass bottom panel ────────────────
  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{ aspectRatio: "3/4", minHeight: 280 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,0,0,0.65)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ── Full-bleed image (clickable to details) ── */}
      <Link to={detailsLink} className="absolute inset-0">
        <img
          src={image}
          alt={event.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* ── Top badges ── */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
        {/* Status */}
        <span
          className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            ...(isLive
              ? {
                  background: "rgba(239,68,68,0.35)",
                  color: "#fecaca",
                  border: "1px solid rgba(239,68,68,0.4)",
                }
              : {
                  background: "rgba(10,10,20,0.55)",
                  color: "#93c5fd",
                  border: "1px solid rgba(96,165,250,0.2)",
                }),
          }}
        >
          {isLive && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          )}
          {isLive ? "Live" : "Upcoming"}
        </span>

        {/* Eye button - opens event details page */}
        <Link
          to={detailsLink}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: isLive ? "#f87171" : "rgba(255,255,255,0.7)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isLive
              ? "rgba(239,68,68,0.3)"
              : "rgba(124,58,237,0.3)";
            e.currentTarget.style.borderColor = isLive
              ? "rgba(239,68,68,0.4)"
              : "rgba(167,139,250,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.55)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          }}
        >
          <Eye size={14} />
        </Link>
      </div>

      {/* ── Glass bottom panel ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col gap-2.5"
        style={{
          background: "rgba(10, 8, 20, 0.62)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Tags row */}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.18)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167,139,250,0.2)",
                }}
              >
                #{tag}
              </span>
            ))}
            {event.eventType && (
              <span
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full capitalize"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {event.eventType}
              </span>
            )}
          </div>
        )}

        {/* Title (clickable to details) */}
        <Link to={detailsLink}>
          <h3
            className="text-white font-bold leading-tight line-clamp-2 hover:text-violet-300 transition-colors"
            style={{
              fontSize: 15,
              fontFamily: "'Syne', sans-serif",
              textShadow: "0 1px 8px rgba(0,0,0,0.6)",
            }}
          >
            {event.name}
          </h3>
        </Link>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Organiser avatar */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
            >
              {event.createdBy?.name?.charAt(0)?.toUpperCase() || "E"}
            </div>
            <span
              className="text-[11px] truncate max-w-[100px]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {event.createdBy?.name || "Organizer"}
            </span>
          </div>
          {event.liveDate && (
            <span
              className="flex items-center gap-1 text-[10.5px] flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              <Calendar size={10} />
              {fmtDate(event.liveDate)}
            </span>
          )}
        </div>

        {/* Stall fill bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span
              className="text-[10px]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              <Users size={9} className="inline mr-1 mb-px" />
              {registered} / {event.numberOfStalls} stalls
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{
                color:
                  fillPct >= 90
                    ? "#f87171"
                    : fillPct >= 60
                      ? "#fbbf24"
                      : "#a78bfa",
              }}
            >
              {fillPct}%
            </span>
          </div>
          <div
            className="h-[3px] w-full rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${fillPct}%`,
                background: isFull
                  ? "linear-gradient(90deg,#ef4444,#dc2626)"
                  : fillPct > 70
                    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                transition: "width 0.7s ease",
              }}
            />
          </div>
        </div>

        {/* CTA Button - Different routes for live vs upcoming */}
        {isLive ? (
          // Live event: "Join Now" goes to 3D viewer
          <Link to={viewerLink}>
            <button
              className="w-full py-2.5 rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 group-hover:gap-3 mt-0.5"
              style={{
                background: "rgba(239,68,68,0.25)",
                color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.3)",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
              }}
            >
              Join Now <ArrowRight size={13} />
            </button>
          </Link>
        ) : isFull ? (
          // Full event: disabled button
          <button
            className="w-full py-2.5 rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-2 mt-0.5"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.28)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "not-allowed",
            }}
            disabled
          >
            Event Full
          </button>
        ) : (
          // Upcoming event: "View & Register" goes to details
          <Link to={detailsLink}>
            <button
              className="w-full py-2.5 rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 group-hover:gap-3 mt-0.5"
              style={{
                background: "rgba(124,58,237,0.28)",
                color: "#ddd6fe",
                border: "1px solid rgba(124,58,237,0.35)",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
              }}
            >
              View & Register <ArrowRight size={13} />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default EventCard;
