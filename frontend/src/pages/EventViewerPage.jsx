// src/components/EventViewer/EventViewerPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ThreeScene from '@/components/3DViewer/ThreeScene';
import StallPopup from '@/components/ui/StallPopup';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchEventData } from '@/services/api/eventApi';

const EventViewerPage = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEventData = async () => {
      try {
        const data = await fetchEventData(eventId);
        setEventData(data);
      } catch (error) {
        console.error('Failed to load event:', error);
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

  if (!eventData) {
    return <div>Event not found</div>;
  }

  return (
    <div className="event-viewer">
      <ThreeScene 
        eventData={eventData} 
        onStallClick={handleStallClick}
      />
      <StallPopup 
        stallData={selectedStall} 
        onClose={handleClosePopup}
      />
    </div>
  );
};

export default EventViewerPage;