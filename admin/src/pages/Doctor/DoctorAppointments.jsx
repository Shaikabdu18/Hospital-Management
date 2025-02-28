import React, { useState, useContext, useEffect } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const DoctorAppointments = () => {
  const [show, setShow] = useState(false);
  const [messages, setMessages] = useState([]); // Store chat messages
  const [newMessage, setNewMessage] = useState(''); // New message input
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);

  const handleClose = () => {
    setShow(false);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { user: 'Doctor', text: newMessage }]);
      setNewMessage('');  // Clear the message input after sending
    }
  };

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        {/* Table Structure */}
        <table className="w-full table-auto">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Patient</th>
              <th className="px-4 py-2 text-left">Payment</th>
              <th className="px-4 py-2 text-left">Age</th>
              <th className="px-4 py-2 text-left">Date & Time</th>
              <th className="px-4 py-2 text-left">Fees</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Chat</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{index + 1}</td> {/* Index starts from 1 */}
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <img src={item.userData.image} className="w-8 rounded-full" alt="" />
                    <p>{item.userData.name}</p>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <p className="text-xs inline border border-primary px-2 rounded-full">
                    {item.payment ? 'Online' : 'CASH'}
                  </p>
                </td>
                <td className="px-4 py-2">{calculateAge(item.userData.dob)}</td>
                <td className="px-4 py-2">
                  {slotDateFormat(item.slotDate)}, {item.slotTime}
                </td>
                <td className="px-4 py-2">{currency}{item.amount}</td>
                <td className="px-4 py-2">
                  {item.cancelled
                    ? <p className="text-red-400 text-xs font-medium">Cancelled</p>
                    : item.isCompleted
                      ? <p className="text-green-500 text-xs font-medium">Completed</p>
                      : <div className="flex gap-2">
                          <img
                            onClick={() => cancelAppointment(item._id)}
                            className="w-6 cursor-pointer"
                            src={assets.cancel_icon}
                            alt="Cancel"
                          />
                          <img
                            onClick={() => completeAppointment(item._id)}
                            className="w-6 cursor-pointer"
                            src={assets.tick_icon}
                            alt="Complete"
                          />
                        </div>
                  }
                </td>
                <td className="text-sm inline border border-primary px-4 rounded-full">
                  <button className="mt-3" onClick={() => setShow(true)}>Chat</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chat Modal */}
      <Modal
        centered
        size="lg"
        show={show}
        onHide={handleClose}
        scrollable={true}
        aria-labelledby="chat-with-doctor-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <label className="font-regular-24">Chat With Doctor</label>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div
            className="chat-container"
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              paddingBottom: '15px',
            }}
          >
            {/* Display chat messages */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.user.toLowerCase()}`}
                style={{
                  backgroundColor: msg.user === 'Doctor' ? '#e1f7d5' : '#f0f0f0',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '5px',
                }}
              >
                <strong>{msg.user}:</strong> {msg.text}
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
                style={{ marginBottom: '10px' }}
              />
            </Col>
            <Col xs="auto">
              <Button
                variant="primary"
                onClick={handleSendMessage}
                className="mt-2"
                style={{ alignSelf: 'flex-end' }}
              >
                Send
              </Button>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DoctorAppointments;
