// src/components/EventViewer/EventViewerPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ThreeScene from "@/components/3DViewer/ThreeScene";
import StallPopup from "@/components/ui/StallPopup";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { fetchPublicEventData } from "@/services/api/eventApi";

const EventViewerPage = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔥 TRACK IF ANY UI IS OPEN
  const isUIOpen = selectedStall !== null;

  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchPublicEventData(eventId);
        setEventData(data);
      } catch (loadError) {
        console.error("Failed to load event:", loadError);
        setError(loadError.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId]);

  const handleStallClick = (stallData) => {
    setSelectedStall(stallData);
  };

  const handleClosePopup = () => {
    setSelectedStall(null);
  };

  if (loading) {
    return <LoadingScreen />;
  }
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "20px",
          color: "#b91c1c",
          padding: "24px",
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  if (!eventData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "24px",
        }}
      >
        Event not found
      </div>
    );
  }

  return (
    <div className="event-viewer">
      <ThreeScene
        eventData={eventData}
        onStallClick={handleStallClick}
        isUIOpen={isUIOpen} // 🔥 PASS UI STATE
      />

      <StallPopup stallData={selectedStall} onClose={handleClosePopup} />
    </div>
  );
};

export default EventViewerPage;
