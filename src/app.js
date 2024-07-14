import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// 1. Middleware configuration, and set limit to 16kb data we can send and receive, it is modifiable.
app.use(express.json({ limit: "16kb" }));
// 2. cors middleware, it is enough for now, but we can add out website url like vercel link, means only that website can access.
app.use(
  express.cors({
    // origin: "http://localhost:3000",
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// 3. cookie parser middleware,enough for now, but we modify it as we can apply CRUD to cookies of the user's data in future.
app.use(cookieParser());

export default app;
