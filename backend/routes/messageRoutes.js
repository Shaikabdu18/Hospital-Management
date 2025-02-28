import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import authDoctor from "../middleware/authDoctor.js";
import authUser from "../middleware/authUser.js";

const messageRouter = express.Router();

// Patient sending a message
messageRouter.post("/patient/send-message", authUser, sendMessage);

// Get messages between doctor and patient (for patient)
messageRouter.get("/patient/messages/:id", authUser, getMessages);

// Doctor sending a message
messageRouter.post("/doctor/send-message", authDoctor, sendMessage);

// Get messages between doctor and patient (for doctor)
messageRouter.get("/doctor/messages/:id", authDoctor, getMessages);

export default messageRouter;
