import notiSchema from "../models/notification.model.js";
import { getIo } from "../config/server.config.js";

export const notification = async (req, res) => {
  const { message, userId } = req.body;
  console.log(message, userId);

  if (!message || !userId) {
    return res.status(400).json({
      message: "Bad Request",
      success: false,
    });
  }
  const newNotification = await notiSchema.create({
    message,
    userId,
  });

  // every clients that are connected to the server will receive this ontification
  const io = getIo();
  io.emit("notification", newNotification);

  res.status(201).json({
    message: "Notification Sent Successfully",
    success: true,
    data: newNotification,
  });
};

export const getNotification = async (req, res) => {
  try {
    const notification = await notiSchema.find();

    if (!notification || notification.length === 0) {
      return res.status(404).json({
        message: "No Notification Found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Notification Sent Successfully",
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};
