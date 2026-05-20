import mongoose from "mongoose";

//connect to db using mongoose
export const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("connected to db");
  } catch (error) {
    console.log("error connection", error);
  }
};
