import { Link } from "react-router-dom";

const EventCard = ({ event }) => {
  const isLive = event.status === "live";

  const attendees = event.numberOfStalls - event.availableStalls;

  const imageSrc = event.thumbnailUrl || "/bg.png";

  const getTimeRemaining = () => {
    if (!event.liveDate) return "";

    const now = new Date();
    const start = new Date(event.liveDate);
    const diff = start - now;

    if (diff <= 0) return "Started";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours} Hrs`;

    const mins = Math.floor(diff / (1000 * 60));
    return `${mins} Min`;
  };

  return (
    <Link
      to={`/events/${event._id}`}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
    >
      {/* IMAGE */}
      <div className="relative">
        <img
          src={imageSrc}
          alt={event.name}
          className="w-full h-40 object-cover"
        />

        {/* STATUS BADGE */}
        <span
          className={`absolute top-4 right-4 px-4 py-1 rounded-full text-sm font-semibold ${
            isLive
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {isLive ? "LIVE" : "UPCOMING"}
        </span>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>

        <p className="text-gray-600 mt-1">
          Host: {event.createdBy?.name || "Event Organizer"}
        </p>

        <p className="text-gray-600 mt-3 line-clamp-2">{event.description}</p>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-100 rounded-lg p-2  text-center ">
            <p className="text-gray-500 text-sm">
              {isLive ? "Attendees" : "Registrations"}
            </p>

            <p className="text-xl font-bold">{attendees.toLocaleString()}</p>
          </div>

          <div className="bg-gray-100 rounded-xl p-2 text-center">
            <p className="text-gray-500 text-sm">
              {isLive ? "Ends In" : "Starts In"}
            </p>

            <p className="text-xl font-bold">{getTimeRemaining()}</p>
          </div>
        </div>

        {/* BUTTON */}
        <button className="mt-4 w-full bg-black text-white py-3 rounded-xl text-lg font-semibold hover:bg-gray-900 transition">
          {isLive ? "Join Now" : "Register Now"}
        </button>
      </div>
    </Link>
  );
};

export default EventCard;
