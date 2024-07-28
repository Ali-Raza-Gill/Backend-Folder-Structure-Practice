import { asyncHandler } from "../utils/asyncHandler.js"; // here i add extension .js , because i some time it gives errors in debugging process,so we need to add extension.
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

//generate access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();

    // Store the tokens in the user object and then send in db
    user.RefreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false }); // This will didn't validate that password is entered or not, it will just save the refresh token in db.
    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating access and refresh tokens");
  }
};

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
  // we can use one of these two ways
  // optimized way to solve this problem
  // 1st way to solve this problem
  const coverImageLocalPath =
    req.files?.coverImage && req.files.coverImage[0]
      ? req.files.coverImage[0].path
      : null;
  //we can do this same for avatar as well, and in future we do it.On the other hand we already apply checks, on avatar image.

  //2nd way to solve this problem
  /*
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
    */

  // 3rd way to solve this problem, but we not use this,bcz when no image, it thow error, not null value.
  // const loacalImagePath = req.files?.coverImage[0]?.path;
  //In this way, when i didnt send coverImage it will give error. So we use this if condition to check that the image is sent or not.

  if (!localAvatarPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Now use the cloudinary function to upload the avatar and image on cloudinary.

  const Avatar = await uploadOnCloudinary(localAvatarPath);
  const Image = await uploadOnCloudinary(coverImageLocalPath);

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

const loginUser = asyncHandler(async (req, res) => {
  //req.body = data => req.body ma user data ay ga
  // user enter email and password
  //find user by email
  //check the password
  //generate access and refresh token
  //send them in cookies

  //These both have same functionality, we use one of them.
  const { email, username, password } = req.body;
  if (!email && !username) {
    throw new ApiError(400, "username or email required");
  }
  // if (!(email || username)) {
  //   throw new ApiError(400, "username or email required");
  // }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  //Here you can write user with samll letters bcz this is actuall user get from db , User this is mehtod of mongoose database.
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid password");
  }

  const { AccessToken, RefreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Now send data to cookie and browser
  const options = {
    httpOnly: true,
    secure: true,
  };

  //store the access and refresh token in cookie, and send additional options with
  return res
    .status(200)
    .cookie("AccessToken", AccessToken, options)
    .cookie("RefreshToken", RefreshToken, options)
    .json(
      //now we send response to user, better practice,we saved data in cookie, but we do if user want to save data in local storage or any other storage then this data will be shown in user session, otherwise cookie data is not modifiable from user side bcz we enable httpOnly and secure true.
      new ApiResponse(
        200, // here send info to user you want.
        {
          user: loggedInUser,
          AccessToken,
          RefreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logOut = asyncHandler(async (req, res) => {
  // Now i have access of user as req.user=>it gives full user values in access token
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        // This give us power to set any thing we awant, we remove previous or add new one.
        RefreshToken: 1,
      },
    },
    {
      new: true, // this will give us updated user. it is required to get updated user before sending response back
    }
  );

  // to remove cookies we want options
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res //This will remove the cookies from browser
    .status(200)
    .cookie("AccessToken", options)
    .cookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logOut };
