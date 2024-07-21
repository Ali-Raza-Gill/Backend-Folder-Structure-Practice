import { asyncHandler } from "../utils/asyncHandler.js"; // here i add extension .js , because i some time it gives errors in debugging process,so we need to add extension.
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;
  //Algo to solve this problem
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  // console.log("registerUser", username, fullName, email, password); The response is a JSON object

  // Now we check the validations, but comanies we use libraries for validation, joi and yup

  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields required");
  }

  // Check if the username or email already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "Username or email already exists");
  }

  //Now we handle files, on index 0 we get avatar or image link original link so here we required so we use.
  const localAvatarPath = req.files?.avatar[0]?.path;
  const loacalImagePath = req.files?.coverImage[0]?.path;

  if (!localAvatarPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Now use the cloudinary function to upload the avatar and image on cloudinary.

  const Avatar = await uploadOnCloudinary(localAvatarPath);
  const Image = await uploadOnCloudinary(loacalImagePath);

  if (!Avatar) {
    throw new ApiError(400, "Error uploading avatar on cloudinary");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: Avatar?.url,
    coverImage: Image?.url || "",
  });

  // Here we get the created user and remove the password and refreshToken from the response. because we can send user data without password and refreshToken on DB.
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Error while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, "User created successfully", userCreated));

  /*  This is the one method to check the validity of the data. but in companies a seperate file will be created and it will be used.
  if (!username.match(/^[a-zA-Z0-9]+$/)) {
    return res.status(400).json({
      success: false,
      message: "Username should only contain alphanumeric characters",
    });
  }
  if (!username || !fullName || !email || !password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }
    */
});

export { registerUser };
