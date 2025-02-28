import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "doctor" },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const messageModel = mongoose.models.message || mongoose.model("message", messageSchema);
export default messageModel;
