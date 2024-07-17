import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// 1. Middleware configuration, and set limit to 16kb data we can send and receive, it is modifiable.
app.use(express.json({ limit: "16kb" }));
// 2. cors middleware, it is enough for now, but we can add out website url like vercel link, means only that website can access.
app.use(
  cors({
    // origin: "http://localhost:3000",
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// 3. cookie parser middleware,enough for now, but we modify it as we can apply CRUD to cookies of the user's data in future.
app.use(cookieParser());

// route import    // this is called segregation, means we import here below instead of in top imports.
import userRoute from "./routes/user.route.js";
//route decleration
app.use("/api/v1/users", userRoute); //standard way to declare routes /api/v1/users , api=>our api,       v1=>version, and then users => route , so this will go to the user.route.js and then go to the register user , so the whole route will becomes this http://localhost:8000/api/v1/users/register
export default app;
