const API_BASE_URL = "http://localhost:8747/api";
// ⚠️ change port if backend differs

export const api = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // VERY IMPORTANT (cookies)
    ...options,
  });

  const contentType = response.headers.get("content-type");
  let data;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(data || "Something went wrong");
  }

  return data;
};
