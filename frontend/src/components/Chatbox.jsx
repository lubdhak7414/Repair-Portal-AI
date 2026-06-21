import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/useSocket';
import Cross from '../assets/close (1).png';


const ChatBox = ({ currentUser, otherUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socket = useSocket();
  const messagesEndRef = useRef(null);

  // Use currentUser.id (frontend) but convert to _id format for backend
  const conversationId = currentUser?.id && otherUser?.id 
    ? generateConversationId(currentUser.id, otherUser.id)
    : null;
  
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${apiUrl}/messages/${currentUser.id}/${otherUser.id}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    const markAsRead = async () => {
      try {
        await axios.put(`${apiUrl}/messages/markRead/${currentUser.id}/${otherUser.id}`);
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };

    fetchMessages();
    markAsRead();

    if (socket) {
      socket.emit('joinConversation', conversationId);

      const handleReceiveMessage = (message) => {
        setMessages(prev => [...prev, message]);
        // If the new message is from the other user, mark it as read immediately if chat is open
        if (message.sender.id !== currentUser.id) {
          markAsRead();
        }
      };
      
      socket.on('receiveMessage', handleReceiveMessage);
      
      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.emit('leaveConversation', conversationId);
      };
    }
  }, [socket, conversationId, currentUser.id, otherUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageData = {
      conversationId,
      sender: currentUser.id,
      receiver: otherUser.id,
      content: newMessage.trim(),
    };

    if (socket) {
      socket.emit('sendMessage', messageData);
    }

    setNewMessage('');
  };
  return (
    <div className="chat-box">
      <div className="chat-header" style={{fontSize:'1.2rem'}}>
        <h4>Chat with {otherUser.name}</h4>
        <button onClick={onClose}><img style={{width:'20px',cursor:'pointer', border:'none'}} src={Cross} alt="" /></button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message ${msg.sender.id === currentUser.id ? 'sent' : 'received'}`}
          >
            <div className="message-sender">
              {/* <img 
                src={msg.sender.picture || '/default-avatar.png'} 
                alt={msg.sender.name} 
              /> */}
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

function generateConversationId(userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
}

export default ChatBox;