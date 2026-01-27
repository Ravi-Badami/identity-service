const { z } = require("zod");

// reusable ObjectId validator
const objectId = z.string().refine(
  (val) => /^[0-9a-fA-F]{24}$/.test(val),
  { message: "Invalid MongoDB ObjectId" }
);

// create user
const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    email: z.string().trim().email("Invalid email").transform(v => v.toLowerCase()),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["user", "admin"]).optional(),
  }).strict(),
});


// params validation
const userIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

module.exports = {
  createUserSchema,
  userIdSchema,
};
