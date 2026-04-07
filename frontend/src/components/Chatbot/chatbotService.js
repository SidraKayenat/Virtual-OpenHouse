// frontend/src/components/Chatbot/chatbotService.js

import { API_BASE_URL } from "@/lib/api";

const getEndpoint = (stallData) => {
  const eventId =
    stallData?.eventId || stallData?.raw?.event || stallData?.raw?.event?._id;
  const stallId = stallData?.id || stallData?.raw?._id;

  if (!eventId || !stallId) {
    throw new Error("Missing eventId or stallId for chatbot request");
  }

  return `${API_BASE_URL}/chatbot/events/${eventId}/stalls/${stallId}`;
};

export const sendMessageToBot = async (message, stallData) => {
  const endpoint = getEndpoint(stallData);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ query: message }),
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Chatbot request failed");
  }
  return (
    data?.response ||
    "I couldn't find enough information in this stall's documents."
  );
};

export const initializeChatSession = async () => Promise.resolve();
