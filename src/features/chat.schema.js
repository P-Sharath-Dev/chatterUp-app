import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  profilePic: String,
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatModel = mongoose.model("Messge", chatSchema);
export default ChatModel;
