export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (error?.code === 11000) {
    return res.status(400).json({
      message: "Duplicate value detected",
      details: error.keyValue
    });
  }

  res.status(res.statusCode && res.statusCode !== 200 ? res.statusCode : 500).json({
    message: error.message || "Internal server error"
  });
};
