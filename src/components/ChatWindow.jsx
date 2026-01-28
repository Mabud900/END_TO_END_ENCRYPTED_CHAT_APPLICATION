import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../services/api';
import { encryptMessage, decryptMessage } from '../services/crypto';
import io from 'socket.io-client';

const SOCKET_URL = 'https://susie-epiphloedal-nontoxically.ngrok-free.dev';

function ChatWindow({ currentUser, recipient }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      socketRef.current.emit('join', currentUser.id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
    
    socketRef.current.on('new-message', handleNewMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [recipient._id, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getConversation(recipient._id);
      if (response.data.success) {
        const keysStr = localStorage.getItem('keys');
        if (!keysStr) {
          console.error('❌ No encryption keys found!');
          setLoading(false);
          return;
        }
        
        const keys = JSON.parse(keysStr);
        
        const decryptedMessages = await Promise.all(
          response.data.messages.map(async (msg) => {
            try {
              const isSent = msg.senderId._id === currentUser.id;
              
              // For messages you sent: use recipient's public key
              // For messages you received: use sender's public key
              const otherPartyPublicKey = isSent 
                ? msg.recipientId.publicKey
                : msg.senderId.publicKey;
              
              const plaintext = await decryptMessage(
                msg.encryptedContent,
                msg.nonce,
                otherPartyPublicKey,
                keys.privateKey
              );

              return { ...msg, text: plaintext, isSent };
            } catch (error) {
              console.error('Decryption error:', error);
              return { 
                ...msg, 
                text: '[Decryption failed]', 
                isSent: msg.senderId._id === currentUser.id 
              };
            }
          })
        );
        setMessages(decryptedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = async (data) => {
    console.log('📩 New message received:', data);
    if (data.senderId === recipient._id) {
      try {
        const keysStr = localStorage.getItem('keys');
        if (!keysStr) {
          console.error('❌ No keys for decryption');
          return;
        }
        
        const keys = JSON.parse(keysStr);
        const plaintext = await decryptMessage(
          data.encryptedContent, 
          data.nonce, 
          data.senderPublicKey, 
          keys.privateKey
        );
        
        setMessages(prev => [...prev, { 
          _id: data.id, 
          text: plaintext, 
          isSent: false, 
          timestamp: data.timestamp 
        }]);
      } catch (error) {
        console.error('Failed to decrypt incoming message:', error);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    console.log('📤 Sending message...');
    setSending(true);
    
    try {
      const keysStr = localStorage.getItem('keys');
      if (!keysStr) {
        throw new Error('No encryption keys found. Please logout and login again.');
      }
      
      const keys = JSON.parse(keysStr);
      
      console.log('🔐 Encrypting message...');
      const encrypted = await encryptMessage(
        newMessage, 
        recipient.publicKey, 
        keys.privateKey
      );

      console.log('📡 Sending to server...');
      const response = await messageAPI.send({
        recipientId: recipient._id,
        encryptedContent: encrypted.ciphertext,
        nonce: encrypted.nonce,
        senderPublicKey: currentUser.publicKey
      });

      console.log('✅ Message sent:', response.data);

      if (response.data.success) {
        setMessages(prev => [...prev, { 
          _id: response.data.messageId, 
          text: newMessage, 
          isSent: true, 
          timestamp: new Date() 
        }]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      alert('Failed to send message: ' + (error.message || 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading messages...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid #e0e0e0', 
        background: 'white' 
      }}>
        <h3>{recipient.username}</h3>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
          🔒 End-to-end encrypted
        </p>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={'message ' + (msg.isSent ? 'sent' : 'received')}>
              <div className="message-bubble">
                <div>{msg.text}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type a message..." 
          disabled={sending} 
        />
        <button type="submit" disabled={sending}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;