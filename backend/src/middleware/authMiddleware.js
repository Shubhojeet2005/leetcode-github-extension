module.exports = (req, res, next) => {
  const key = (req.headers["x-api-key"] || "").trim();
  const expected = (process.env.API_KEY || "").trim();

  if (!expected) {
    return res.status(500).json({ error: "Server API key is not configured" });
  }

  if (key !== expected) {
    return res.status(401).json({
      error: "Unauthorized",
      hint: "Backend API Key in the extension must match API_KEY in backend/.env",
    });
  }

  next();
};