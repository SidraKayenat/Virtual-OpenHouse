import jwt from "jsonwebtoken";

export const verifyToken = (request, response, next) => {
  const token = request.cookies.jwt;
  if (!token) {
    return response.status(401).send("You are not authenticated!");
  }

  jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
    if (err) {
      return response.status(403).send("Token is not valid!");
    }

    // ✅ Normalize user object for consistency
    request.user = {
      _id: payload.userId,
      role: payload.role,
    };

    // ✅ Also set userId for backward compatibility
    request.userId = payload.userId;
    request.userRole = payload.role;

    next();
  });
};
