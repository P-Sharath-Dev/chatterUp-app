import express from "express";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";
import { connectToDB } from "./src/config/mongoose.config.js";
import ChatModel from "./src/features/chat.schema.js";
import chatRoutes from "./src/features/chat.routes.js";
import { timeStamp } from "console";

//creating express app
const app = express();

//setting ejs as a view engine
app.set("view engine", "ejs");

//setting views folder
app.set("views", "./views");

//making public folder accessible
app.use(express.static("public"));

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

    //sending leave notificaion
    socket.broadcast.emit("user_left", socket.username);

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

  //handling new_user event
  socket.on("new_user", async (username) => {
    socket.username = username;

    //adding user to online users array
    onlineUsers.push(username);
    console.log(onlineUsers);

    //sending updated online users list to all connected clients
    //using io.emit instead of socket.emit because every client should receive updated online users list
    //if used socket.emit() only current user gets online users list
    io.emit("online_users", onlineUsers);

    //sending join notification
    socket.broadcast.emit("user_joined", username);

    console.log("username : ", username);
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
      message,
      timestamp: new Date(),
    };
    try {
      //creating new message document
      const newMessage = new ChatModel({
        username: socket.username,
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

app.use("/", chatRoutes);

// start server
server.listen(3000, () => {
  console.log("server is running on port : 3000");
  connectToDB();
});
