// src/services/api/eventApi.js

// Mock data for testing
const mockEventData = {
  id: 1,
  name: "Tech Expo 2025",
  environmentType: "mcs_hall",
  stallCount: 6,
  stalls: [
    {
      id: 1,
      name: "AI Innovation Hub",
      description: "AI-powered solutions for automation and analytics.",
      tech: ["Python", "TensorFlow", "FastAPI"],
      contact: "ai@openhouse.com",
      website: "https://example.com",
    },
    {
      id: 2,
      name: "Web XR Lab",
      description: "Immersive web-based 3D and VR experiences.",
      tech: ["Three.js", "WebXR", "GLTF"],
      contact: "xr@openhouse.com",
    },
    {
      id: 3,
      name: "Robotics Zone",
      description: "Autonomous robots and smart machines.",
      tech: ["ROS", "C++", "OpenCV"],
      contact: "robotics@openhouse.com",
    },
  ],
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// export const fetchEventData = async (eventId) => {
export const fetchEventData = async () => {
  try {
    // TODO: Replace with real API call
    // const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
    // const data = await response.json();
    // return data;

    // For now, return mock data
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockEventData), 1000); // Simulate network delay
    });
  } catch (error) {
    console.error("Error fetching event data:", error);
    throw error;
  }
};
