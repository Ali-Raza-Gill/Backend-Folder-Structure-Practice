import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.AccessToken ||
      req.headers("authorization"?.replace("Bearer ", "")); //now we get only token not get token inside of the bearer.
    if (!token) {
      throw ApiError(401, "Unauthorized access");
    }
    const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw ApiError(401, "Invalid token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw ApiError(401, "Invalid token");
  }
});
