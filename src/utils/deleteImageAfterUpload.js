import { v2 as cloudinary } from "cloudinary";
import path from "path";

const deleteImageBeforeUpload = async (imageUrl) => {
  if (!imageUrl) return;

  // Extract the public ID from the Cloudinary URL
  const publicId = path?.basename(imageUrl, path.extname(imageUrl));

  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`Failed to delete image from Cloudinary: ${publicId}`, error);
  }
};

export { deleteImageBeforeUpload };
