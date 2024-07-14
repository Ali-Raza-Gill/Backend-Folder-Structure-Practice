/*Common errors comes while connecting to db
import connectDB from "./db";
Their is problem in this code, it will give error because we are trying to connect to db before it is ready because the env file is not ready for whole app, so this will give error.
connectDB();
*/

//Their is 2 solutions of this problem, one is use here require dotenv and give path of env and another is use import same as our standard comes with all file import standard, we import dotenv file in this file and then config and give the path of env file, and then make changes in the pakage.json file and we use -r flag and then dotenv/config and then write the --experimental-json-modules in the script. we use --experimental-json-modules flag but in future it will be predefined from node.js hopefully.

// 1st Solution is this
//Solution is this use require dotenv file in this file

/*require("dotenv").config();
import connectDB from "./db";
connectDB();
*/

//
// 2nd Solution is this, and we use this one.
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import connectDB from "./db/index.js";
// we get constants error here if i didnt use extention, .js, so we give extention to cosntact file and db/index.js file

//now run this comand to start server npm run dev.
connectDB()
  // async|await gives promise always so we use here to connect to port and show error or express, if express is not wroking, now we connect the port
  .then(() => {
    app.on("error", (error) => {
      console.error("Error connecting to DB with Express", error);
      throw error;
    });
    app.lissten(process.env.PORT || 8000, () => {
      console.log(`App is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to DB !!!", err);
  });
//
//----------------------------
// IIFE approach to connect to db, in the last i use () this is used to call this function imediately.
(() => {})(); // this syntax is called IIFE.

// This is 1st approach to connect to db, but we didnt use this approach, we use 2nd approach in seperate file for it.
/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
    app.on("error", (error) => {
      console.error("Error connecting to DB with Express", error);
      throw error;
    });
    app.lissten(process.env.PORT, () => {
      console.log(`App is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to DB", error);
    throw error;
  }
})();
*/
