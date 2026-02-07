import mongoose from "mongoose";

const notificationModel = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const notiSchema = new mongoose.model("Notification", notificationModel);

export default notiSchema;


