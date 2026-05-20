import express from "express";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";
import { connectToDB } from "./src/config/mongoose.config.js";
import ChatModel from "./src/features/chat.schema.js";
import chatRoutes from "./src/features/chat.routes.js";
import multer from "multer";

//creating express app
const app = express();

//setting ejs as a view engine
app.set("view engine", "ejs");

//setting views folder
app.set("views", "./views");

//making public folder accessible
app.use(express.static("public"));

//multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// creating http server
const server = http.createServer(app);

// creating socket server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//storing online users
const onlineUsers = [];

// creating socket connection
io.on("connection", (socket) => {
  console.log("socket connection is established");

  //disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected");

    //sending leave notification only if username exists
    if (socket.username) {
      socket.broadcast.emit("user_left", socket.username);
    }

    //removing disconnected user
    const filteredUsers = onlineUsers.filter((user) => {
      return user !== socket.username;
    });

    //updating online users array
    onlineUsers.length = 0;
    onlineUsers.push(...filteredUsers);

    //sending updated online users list
    io.emit("online_users", onlineUsers);
  });

  //handling typing event
  socket.on("typing", (username) => {
    socket.broadcast.emit("show_typing", username);
  });

  //checking duplicate username
  socket.on("check_username", (username) => {
    if (onlineUsers.includes(username)) {
      socket.emit("duplicate_username");
    } else {
      socket.emit("username_valid", username);
    }
  });

  //handling new_user event
  socket.on("new_user", async (userData) => {
    socket.username = userData.username;

    //checking existing user profile picture
    const existingUser = await ChatModel.findOne({
      username: userData.username,
    });

    if (existingUser && existingUser.profilePic) {
      socket.profilePic = existingUser.profilePic;
    } else {
      socket.profilePic = userData.profilePic;
    }

    //sending existing profile pic to user
    socket.emit("existing_profile_pic", socket.profilePic);

    socket.profilePic = userData.profilePic;

    //adding user to online users array
    // onlineUsers.push(socket.username);

    //add user only if not already online
    if (!onlineUsers.includes(socket.username)) {
      onlineUsers.push(socket.username);
    }

    console.log(onlineUsers);

    //sending updated online users list to all connected clients
    //using io.emit instead of socket.emit because every client should receive updated online users list
    //if used socket.emit() only current user gets online users list
    io.emit("online_users", onlineUsers);

    //sending join notification only first time
    // socket.broadcast.emit("user_joined", socket.username);
    if (!socket.isJoined) {
      socket.broadcast.emit("user_joined", socket.username);

      socket.isJoined = true;
    }

    console.log("username : ", socket.username);
    try {
      //fetching old messages
      const oldMessages = await ChatModel.find();

      //sending old messages to newly joined user
      socket.emit("old_messages", oldMessages);
    } catch (error) {
      console.log("error fetching old messages", error);
    }
  });

  //handling new message
  socket.on("new_message", async (message) => {
    const userMessage = {
      username: socket.username,
      profilePic: socket.profilePic,
      message,
      timestamp: new Date(),
    };
    try {
      //creating new message document
      const newMessage = new ChatModel({
        username: socket.username,
        profilePic: socket.profilePic,
        message,
        timestamp: new Date(),
      });

      //saving messages
      await newMessage.save();
    } catch (error) {
      console.log("error saving message", error);
    }

    //broadcasting the message to all clients except for the sender
    socket.broadcast.emit("broadcasting_message", userMessage);
  });
});

//upload profile image
app.post("/uploads", upload.single("profilePic"), (req, res) => {
  res.json({
    imageUrl: `/uploads/${req.file.filename}`,
  });
});

app.use("/", chatRoutes);

// start server
server.listen(3000, () => {
  console.log("server is running on port : 3000");
  connectToDB();
});
