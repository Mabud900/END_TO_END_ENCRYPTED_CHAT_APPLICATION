import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import { initCrypto, generateKeyPair, getPublicKey } from './services/crypto';

function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cryptoReady, setCryptoReady] = useState(false);

  useEffect(() => {
    initCrypto().then(() => {
      console.log('✅ Crypto initialized');
      setCryptoReady(true);
    });

    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setView('chat');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('keys');
    setUser(null);
    setView('login');
  };

  if (!cryptoReady) {
    return (
      <div className="loading">
        <h2>🔐 Initializing Encryption...</h2>
      </div>
    );
  }

  return (
    <div className="app">
      {view === 'login' && (
        <Login 
          onSuccess={(userData) => {
            setUser(userData);
            setView('chat');
          }}
          onSwitchToRegister={() => setView('register')}
        />
      )}
      
      {view === 'register' && (
        <Register 
          onSuccess={(userData) => {
            setUser(userData);
            setView('chat');
          }}
          onSwitchToLogin={() => setView('login')}
        />
      )}
      
      {view === 'chat' && user && (
        <div className="chat-container">
          <div className="chat-sidebar">
            <div className="chat-header">
              <h2>🔐 E2E Chat</h2>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
            <ChatList 
              currentUser={user}
              onSelectUser={setSelectedUser}
              selectedUserId={selectedUser?.id}
            />
          </div>
          <div className="chat-main">
            {selectedUser ? (
              <ChatWindow 
                currentUser={user}
                recipient={selectedUser}
              />
            ) : (
              <div className="no-chat-selected">
                <h3>Select a user to start chatting</h3>
                <p>All messages are end-to-end encrypted</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
