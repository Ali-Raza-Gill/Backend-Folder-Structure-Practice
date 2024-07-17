import { asyncHandler } from "../utils/asyncHandler.js"; // here i add extension .js , because i some time it gives errors in debugging process,so we need to add extension.

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "User registered successfully",
  });
});

export { registerUser };
