export const checkRole = (...allowedRoles) => {
  return (request, response, next) => {
    if (!request.userRole) {
      return response.status(401).send("Authentication required");
    }

    if (!allowedRoles.includes(request.userRole)) {
      return response
        .status(403)
        .send("You do not have permission to perform this action");
    }

    next();
  };
};
