import express from "express";
import dotenv from "dotenv"; 
import cors from "cors"; 
import cookieParser from "cookie-parser"; 
import mongoose from "mongoose"; 
// This loads variables from a .env file into process.env
dotenv.config();
// app: Initializes an Express application.
const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;
app.use(
    cors({
    //    origin: ["https://chat-app-frontend-rho-ruby.vercel.app"],
     origin: [process.env.ORIGIN], // Only allow requests from this origin (e.g., frontend at localhost:5173).
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],  // Allow specified HTTP methods.
    credentials: true,  // Include cookies in cross-origin requests
    })
);

// app.use("/uploads/profiles", express.static("uploads/profiles"));
// app.use("/uploads/files", express.static("uploads/files"))
    app.use(cookieParser());
    app.use(express.json());
    // app.use("/api/contacts",contactsRoutes);
    // app.use("/api/messages",messagesRoutes);
    // app.use("/api/channel",channelRoutes);
    // app.use('/api/auth',authRoutes)

const server = app.listen(port, () =>{
    console.log(`Server is running at http://localhost:${port}`);
    });  
    mongoose
    .connect(databaseURL)
    .then(() => console.log("DB Connection Successfull"))
    .catch((err) => console.log(err.message));

    mongoose.connection.on("connected", () => {
        console.log("Connected to database:", mongoose.connection.db.databaseName);
      });
