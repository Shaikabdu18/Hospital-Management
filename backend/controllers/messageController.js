import messageModel from "../models/messageModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { userId, receiverId, message,docId } = req.body;
        
        const sender = await userModel.findById(userId||docId) || await doctorModel.findById(userId||docId);
        const receiver = await userModel.findById(receiverId) || await doctorModel.findById(receiverId);
        

        if (!sender || !receiver) {
            return res.status(400).json({ success: false, message: "Invalid sender or receiver" });            
        }

        const newMessage = new messageModel({
            senderId:userId||docId,
            receiverId,
            message
        });
        console.log(newMessage);
        

        await newMessage.save();
        res.json({ success: true, message: "Message sent successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get messages between a doctor and patient
const getMessages = async (req, res) => {
    try {
        const { docId, userId } = req.body;  
        const { id } = req.params; 

        console.log("Request Body:", req.body);
        console.log("Param ID:", id);

        const senderId = userId || docId;  
        const receiverId = id; 

        // Validate IDs
        if (!senderId || !receiverId) {
            return res.status(400).json({ success: false, message: "Invalid sender or receiver ID" });
        }

        const messages = await messageModel.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId } // Vice versa
            ]
        }).sort({ createdAt: 1 });  // Sort by timestamp

        res.json({ success: true, messages });

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export { sendMessage, getMessages };
