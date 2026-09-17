const errorHandler = (err, req, res, next) => {
  const statusCode =
    Number(err.statusCode || err.status) ||
    (err.name === "ValidationError" ? 400 : 500);

  if (statusCode >= 500) {
    console.error(err);
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists.",
      fields: err.keyValue || undefined,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;
