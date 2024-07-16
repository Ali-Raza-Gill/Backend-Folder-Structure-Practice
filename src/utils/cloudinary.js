import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.configure(function () {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // if no file is uploaded then return null or we return a string of msg if file is not uploaded or not found
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      // File uploaded successfully
    });
    console.log("response", response, response.url);
    return response; //give right to user to extract usefull info
  } catch (error) {
    fs.unlink(localFilePath); //their is no image deletion in cloudinary, so we unlink it from local file system,that's why developer's use this function, it is same as remove file
    return null;
  }
};

export { uploadOnCloudinary };
