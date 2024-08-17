import { asyncHandler } from "../utils/asyncHandler.js"; // here i add extension .js , because some time it gives errors in debugging process,so we need to add extension.
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import Jwt from "jsonwebtoken";
import { deleteImageBeforeUpload } from "../utils/deleteImageAfterUpload.js";

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

// This part of code is to login user after access token expiration, first we get refresh token from cookies or from local storage, then we match the refresh token from db if the token same then we generate new access token and send it to user and user loged in.
const refreshAccessToken = asyncHandler(async (res, req) => {
  //now we get refresh token from cookies, two ways we get one is from req.cookies but in native app we get it from body their is no req.cookies.
  const incommingRefreshToken =
    req.cookies?.RefreshToken || req.body.RefreshToken; //comes from user
  if (!incommingRefreshToken) {
    throw ApiError(401, "Unauthorized access");
  }
  try {
    const decodedToken = Jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw ApiError(401, "Invalid refresh token");
    }

    // now we match the refresh token whcih we save user, that and we get from db and then we give access to that perticular user.
    if (incommingRefreshToken !== user?.RefreshToken) {
      throw ApiError(401, "Refresh token is expired or used");
    }

    //options for cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    //now we get user and then store it in the cookies and send it to user
    const { AccessToken, RefreshToken } = await generateAccessAndRefreshTokens(
      user._id
    ); //user._id for evert user in db

    return res
      .status(200)
      .cookie("AccessToken", AccessToken, options)
      .cookie("RefreshToken", RefreshToken, options)
      .json(
        200,
        {
          AccessToken,
          RefreshToken,
        },
        "Token refreshed successfully"
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
  return;
});

//This funciton if to change password on the basis of old password and new password
//user is coming from req.user, it is coming from jwt token.
//req.body = {oldpassword, newpassword, confirmpassword}
//we have to check if new password and confirm password is same and old password is correct.
//if both are correct then we update the password.
//if not correct then we throw error.
//we use validateBeforeSave: false to avoid mongoose validation error.
const changePassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword, confirmpassword } = req.body; //we only put new password here we can add additional check for new password and confirm new password simply.

  if (!(newpassword === confirmpassword)) {
    throw ApiError(400, "New password and confirm new password should be same");
  }
  // we have user in req.user so we get id from it, and with query we get full user.
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword); // This will check the old password is correct or not,if not correct it will throw error.

  if (!isPasswordCorrect) {
    throw ApiError(400, "Old password is incorrect");
  }

  //If old password is correct then we will update the new password
  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  //Now we will send the response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Featched Successfully"));
});

//Now I want to update user data based on our need, which fields we want to update.
//1. We get the data from req.body
//2. We find the user by id whcih we get from req.user._id
//3. We update the user
//4. We send the response
//5. We catch the error
//6. We throw error
//7. We send response

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body; //we carefully enter fullName and email, which comes from user model.
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    // in all User. we user await, bcz it takes some time
    req.user?._id,
    {
      $set: {
        //this will update the user
        fullName, //we also user old syntex of fullName and email like => fullName:fullName, email:email
        email,
      },
    }, //Here we user mongoDB operators that will update the user and prebuild operators in mongoDB.we have to learn monogDB operator
    { new: true } // this will return the updated value, or data
  ).select("-password"); //we don't want password and refreshToken in response so we use select function. we also done this after the user is updated when we get then we hit the api that hide user password and refreshToken in case if we want to hide the refreshToken in response.

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

// Same for update user avatar, and cover image just copy paste it and change the name of the file.
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path; // here i user file not files, bcz we have only one file, when we upload multiple files we use files as i use in add user.

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath); // This will upload the file on cloudinary.
  if (!avatar) {
    throw new ApiError(500, "Failed to upload updated avatar");
  }
  // Now we have to update the user Avatar
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url, //we use avatar.url to get the url of the avatar, not the whole object bcz in model we decleare as string, not object.
      },
    },
    { new: true } // this will return the updated value, or data
  ).select("-password");
  // here also we remove the password and refreshToken from response if required.
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});

// this is  for cover image update
const updateUserConverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path; // here i user file not files, bcz we have only one file, when we upload multiple files we use files as i use in add user.

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar file is missing!");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath); // This will upload the file on cloudinary.
  if (!coverImage) {
    throw new ApiError(500, "Failed to upload updated avatar");
  }
  // Now we have to update the user Avatar
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url, //we use avatar.url to get the url of the avatar, not the whole object bcz in model we decleare as string, not object.
      },
    },
    { new: true } // this will return the updated value, or data
  ).select("-password");
  // here also we remove the password and refreshToken from response if required.

  // I think we can delete image with this method also, but we make a utils funtion to remove image after upload image to cloudinary and when we get url of the image then we delete it.
  if (user?.avatar) {
    await deleteImageBeforeUpload(user?.avatar);
  }
  // if(user.avatar){
  //   await cloudinary.uploader.destroy(user.avatar);
  // }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req?.params; // we get username from params of the request, bcz when we open the url/channel the username is in the url, almost in all the cases.
  if (!username?.trim()) {
    throw new ApiError(400, "userName is missing!");
  }
  // now i expect that i got the userName, now i will find the user with that userName

  {
    /* const user = await User.findOne({ username });*/
  }
  // we can get user in this method, but after this method, again we apply aggregation methods, but we directly aggregate user bcz we study match field , match will auto match the username and then operation will apply on it.

  // here i will apply aggregation methods. aggregate is a method which takes array and inside of it we add pipelines, which are objects form.
  // User.aggregate([{},{},{}])

  const channel = await User.aggregate([
    //These are pipelines that we apply on our database.
    {
      $match: {
        // this will match the username from DB and with the given username, that we get from url
        username: username?.toLowerCase(),
      },
    },
    {
      // we get the subscribers from subscriptions collection
      $lookup: {
        from: "subscriptions", //from which collection i want to get the data, in database, collections will be in lowercase and plural, that's why we use this.
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        // we get the subscribed channels from subscriptions collection
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribed",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", //we use $size to get the size of the subscribers array
        },
        subscribedCount: {
          $size: "$subscribed", //we use $size to get the size of the subscribed channel array
        },
        isSubscribed: {
          $cond: {
            // $in works as it checks if the value is present in the array or not,  $in works for both array and object
            if: { $in: [req.user?.id, "$subscribers.subscriber"] }, //In If Condition we get userId, then from subscribers we get the subscriber array.
            then: true, // if userId is present in the subscriber array then we return true
            else: false,
          },
        },
      },
    },
    {
      // we get the details of the user from user collection and we also remove the password and refreshToken from response if required. now the response will have all the data of the user which is below in the project section. $project is user to send response to user.
      $project: {
        // just turn flags on, for those values you want to send in the response.
        email: 1,
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedCount: 1,
        isSubscribed: 1,
        createdAt: 1, // to show channel creation date
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist!");
  }
  console.log(channel); // This will show how and which values we get from the DB

  return res.json(
    new ApiResponse(200, channel[0], "Channel fetched successfully") // we need only 1st element
    // This will return array but we need 1st element, so we use [0], so in this way this will become a object. If we don't do this this will bit hard frontend dev, now we make it object.
  );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // req.user._id => This is mongodb String not complete id, the complete id is ObjectId("61d1b1c7b7f9b6b6b6b6b6b6") , we have to convert first this string in to MongoDB id, the string actually conveted by mongoose behind the scene and convert it MongoDB id.

  const user = await User.aggregate([
    //These are pipelines that we apply on our database.
    {
      $match: {
        // _id: new mongoose.Types.ObjectId(req.user._id), //Old way of converting string to MongoDB ObjectId
        _id: new ObjectId(req.user?._id), //This is the latest way of converting string to MongoDB ObjectId
      },
    },
    // Here in this code we user nested pipelines, bcz we have to get video history from video and in video we have to get user also whcih is owner, so we use nested pipelines.
    {
      // we get all the video documents which are in watch history
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // we use pipeline inside of owner, so user data will be in owner, we have to check, and user pipeline outside of the owner and see how we get it.
          {
            //we get the owner details in array,
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    //here we send only that values which we want to send in videos collection
                    username: 1,
                    avatar: 1,
                    fullName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner", //we also use 2nd method which is=> $arrayElemAt:["$owner",0]
              },
            },
          },
        ],
      },
    },
  ]);

  return res.json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch History fetched successfully"
    )
  );
});

export {
  registerUser,
  loginUser,
  logOut,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserConverImage,
  getUserChannelProfile,
  getWatchHistory,
};
