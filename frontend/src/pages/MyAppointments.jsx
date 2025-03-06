import React, { useContext, useEffect, useState } from 'react'
import ChatBot from 'react-simple-chatbot';   
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const MyAppointments = () => {
    const [show, setShow] = useState(false)
    
    const { backendUrl, token } = useContext(AppContext)
    const navigate = useNavigate()

      // State to store messages
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

    const [appointments, setAppointments] = useState([])
    const [payment, setPayment] = useState('')

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [showChatBot, setShowChatBot] = useState(false);  // State to toggle chatbot visibility
    const [appointmentDetails, setAppointmentDetails] = useState(null);

    const handleClose = () => {
        setShow(false)
        
    }

    const handleSend = () => {
        setShow(false)   
    }

    const handleSendMessage = () => {
        sendPatientMessage();
    };

    useEffect(() => {
        if (token) {
            fetchAppointments();
        }
    }, [token]);

    // Fetch patient's appointments
    const fetchAppointments = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
                headers: { token }
            });
            setAppointments(data.appointments);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch appointments.");
        }
    };

    // Cancel appointment from chatbot
    const cancelAppointmentBot = async (appointmentId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/cancel-appointment`, 
                { appointmentId }, 
                { headers: { token } }
            );
            if (data.success) {
                toast.success("Appointment cancelled.");
                fetchAppointments(); // Refresh data
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel appointment.");
        }
    };

 
    
    

  // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
const slotDateFormat = (slotDate) => {
    if (!slotDate) {
        return "Invalid Date";  // Return a fallback message if the date is undefined or invalid
    }
    
    const dateArray = slotDate.split('_');
    if (dateArray.length !== 3) {
        return "Invalid Date";  // Return a fallback message if the date format is incorrect
    }
    
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2];
}

    // Sending Patient Message Using API
    const sendPatientMessage = async () => {
        if (!newMessage.trim() || !appointmentDetails?.docData?._id) {
            toast.error("Message cannot be empty or doctor not selected.");
            return;
        }
    
        const messageData = {
            message: newMessage,
            receiverId: appointmentDetails.docData._id, // Sending to the doctor
        };
    
        try {
            const { data } = await axios.post(`${backendUrl}/api/patient/send-message`, messageData, {
                headers: { token }
            });
    
            if (data.success) {
                setMessages([...messages, { user: "Patient", text: newMessage }]); // Update UI
                setNewMessage(""); // Clear input after sending
                toast.success("Message sent successfully!");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(error.response?.data?.message || "Failed to send message.");
        }
    };
    

    // Fetching Messages Between Doctor and Patient
    const getPatientMessages = async (receiverId) => {
        if (!receiverId) {
            toast.error("Invalid doctor ID");
            return;
        }
    
        try {
            const { data } = await axios.get(`${backendUrl}/api/patient/messages/${receiverId}`, {
                headers: { token },
            });
    
            console.log("Fetched messages:", data.messages); // Debugging Step
    
            if (Array.isArray(data.messages)) {
                setMessages(
                    data.messages.map(msg => ({
                        user: msg.senderId === receiverId ? "Doctor" : "Patient", // Identify sender
                        text: msg.text || "",
                    }))
                );
            } else {
                console.warn("Unexpected API response:", data);
                setMessages([]);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error(error.response?.data?.message || "Failed to fetch messages.");
        }
    };
    
    


    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            setAppointments(data.appointments.reverse())

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to cancel appointment Using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }   

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Appointment Payment',
            description: "Appointment Payment",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {

                console.log(response)

                try {
                    const { data } = await axios.post(backendUrl + "/api/user/verifyRazorpay", response, { headers: { token } });
                    if (data.success) {
                        navigate('/my-appointments')
                        getUserAppointments()
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message)
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    // Function to make payment using razorpay
    const appointmentRazorpay = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-razorpay', { appointmentId }, { headers: { token } })
            if (data.success) {
                initPay(data.order)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to make payment using stripe
    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-stripe', { appointmentId }, { headers: { token } })
            if (data.success) {
                const { session_url } = data
                window.location.replace(session_url)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }



    useEffect(() => {
        if (token) {
            getUserAppointments()
        }
    }, [token])
    const handleShowChat = (appointment) => {
        setAppointmentDetails(appointment);
        if (appointment?.docData?._id) {
            getPatientMessages(appointment.docData._id); // Fetch messages on open
        }
        setShow(true);
    };
    
    

   
    // Generate chatbot flow dynamically
    const chatbotFlow = [
        { id: '1', message: 'Hello! How can I assist you regarding your appointment?', trigger: 'options' },
        {
            id: 'options',
            options: [
                { value: 'status', label: 'Check my appointment status', trigger: 'status' },
                { value: 'cancel', label: 'Cancel my appointment', trigger: 'cancel' },
                { value: 'payment', label: 'Payment options', trigger: 'payment' },
            ]
        },
        {
            id: 'status',
            message: appointments.length > 0 
                ? `Your appointment is with Dr. ${appointments[0].docData.name} on ${appointments[0].slotDate} at ${appointments[0].slotTime}.` 
                : "You have no active appointments.",
            trigger: 'options'
        },
        {
            id: 'cancel',
            options: appointments.length > 0
                ? [{ value: 'confirm_cancel', label: 'Confirm cancel', trigger: 'confirm_cancel' }]
                : [{ value: 'no_appointment', label: 'No appointments to cancel', trigger: 'options' }]
        },
        {
            id: 'confirm_cancel',
            message: 'Your appointment has been cancelled.',
            trigger: () => {
                if (appointments.length > 0) {
                    cancelAppointment(appointments[0]._id);
                }
                return 'options';
            }
        },
        {
            id: 'payment',
            message: appointments.length > 0 
                ? `Your appointment is ${appointments[0].payment ? 'paid' : 'pending payment'}. You can pay via Razorpay or Stripe.` 
                : "No appointments found.",
            trigger: 'options'
        },
    ];


    return (
        <div>
            <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
            <div className='flex mt-10  justify-end text-sm text-end'>
                            <button 
                                onClick={() => setShowChatBot(true)}  // Trigger chatbot visibility
                                className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>
                               Chat with Bot 🤖
                            </button>
                        </div>
                                   {/* ChatBot displayed at the bottom */}
                                   {showChatBot && chatbotFlow.length > 0 && (
    <div className="chatbot-container">
        <ChatBot steps={chatbotFlow} botDelay={500} userDelay={500} hideSubmitButton={true} />
    </div>
)}
            <div className=''>
                {appointments.map((item, index) => (
                    <div key={index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
                        <div>
                            <img className='w-36 bg-[#EAEFFF]' src={item.docData.image} alt="" />
                        </div>
                        <div className='flex-1 text-sm text-[#5E5E5E]'>
                            <p className='text-[#262626] text-base font-semibold'>{item.docData.name}</p>
                            <p>{item.docData.speciality}</p>
                            <p className='text-[#464646] font-medium mt-1'>Address:</p>
                            <p className=''>{item.docData.address.line1}</p>
                            <p className=''>{item.docData.address.line2}</p>
                            <p className=' mt-1'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} |  {item.slotTime}</p>
                        </div>
                        <div></div>
                        <div className='flex flex-col gap-2 justify-end text-sm text-center'>
                            {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id &&  <button   className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300' onClick={() => handleShowChat(item)}>Chat With Doctor!!</button> }
                            {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && <button onClick={() => setPayment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>}
                            {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id && <button onClick={() => appointmentStripe(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center'><img className='max-w-20 max-h-5' src={assets.stripe_logo} alt="" /></button>}
                            {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id && <button onClick={() => appointmentRazorpay(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center'><img className='max-w-20 max-h-5' src={assets.razorpay_logo} alt="" /></button>}
                            {!item.cancelled && item.payment && !item.isCompleted && <button className='sm:min-w-48 py-2 border rounded text-[#696969]  bg-[#EAEFFF]'>Paid</button>}

                            {item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}

                            {!item.cancelled && !item.isCompleted && <button onClick={() => cancelAppointment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>}
                            {item.cancelled && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>}
                        </div>
                     
              
                        
                    </div>
                ))}
            </div>

             {/* Modal */}
      <Modal centered size="lg" show={show} onHide={handleClose} scrollable={true} aria-labelledby="chat-with-doctor-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <label className="font-regular-24">Chat With Doctor</label>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="chat-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {/* Display chat messages */}
            {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.user ? msg.user.toLowerCase() : 'unknown'}`}>
                <strong>{msg.user || 'Unknown'}:</strong> {msg.text}
            </div>
            ))}

          </div>

          <hr />

          {/* Chat input */}
          <Row>
            <Col>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </Col>
            <Col xs="auto">
              <Button variant="primary" onClick={handleSendMessage} className="mt-2">
                Send
              </Button>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
           

        </div>
    )
}

export default MyAppointments
