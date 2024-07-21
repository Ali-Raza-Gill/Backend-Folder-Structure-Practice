import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // if no file is uploaded then return null or we return a string of msg if file is not uploaded or not found
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      // File uploaded successfully
    });

    if (fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, (err) => {
        if (err) {
          console.error("Error while deleting file:", err);
        }
      });
    } else {
      console.error(`File not found for deletion: ${localFilePath}`);
    }
    //give right to user to extract usefull info
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, (err) => {
        if (err) {
          console.error("Error while deleting file:", err);
        }
      });
    }
    //their is no image deletion in cloudinary, so we unlink it from local file system,that's why developer's use this function, it is same as remove file
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary };
