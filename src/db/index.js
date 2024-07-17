import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
// we get constants error here if i didnt use extention, .js, so we give extention to cosntact file and db/index.js file

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      //This will give the info of the connection
      `Connected to MongoDB !! 🥳🥳🥳  DB Host : ${connectionInstance}`
    );
    /*
    console.log(
      //This will give the info of the connection and much more details
      `Connected to MongoDB !! 🥳🥳🥳  DB Host : ${connectionInstance.connection.port}`
    );
    console.log(
      //This will give info about the connection and on which host i am connected, in prodution or in development mode i am connected to mongoDB on local host
      `Connected to MongoDB !! 🥳🥳🥳  DB Host : ${connectionInstance.connection.host}`
    );
*/
  } catch (error) {
    console.error("Error connecting to DB", error);
    process.exit(1);
  }
};

export default connectDB;
