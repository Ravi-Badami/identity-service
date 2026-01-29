const ApiError = require("../utils/ApiError");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error.errors) {
      const errorMessage = error.errors
        .map((details) => details.message)
        .join(", ");
      return next(ApiError.badRequest(errorMessage));
    }
    next(error);
  }
};

module.exports = validate;