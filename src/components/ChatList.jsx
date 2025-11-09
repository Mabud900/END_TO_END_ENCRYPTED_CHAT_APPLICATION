import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

function ChatList({ currentUser, onSelectUser, selectedUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      if (response.data.success) {
        // Filter out current user
        const otherUsers = response.data.users.filter(
          u => u._id !== currentUser.id
        );
        setUsers(otherUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading users...</div>;
  }

  return (
    <div className="user-list">
      {users.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No other users yet
        </div>
      ) : (
        users.map(user => (
          <div
            key={user._id}
            className={`user-item ${selectedUserId === user._id ? 'active' : ''}`}
            onClick={() => onSelectUser(user)}
          >
            <h4>{user.username}</h4>
            <p>{user.email}</p>
            <span className="encryption-badge">🔒 E2E</span>
          </div>
        ))
      )}
    </div>
  );
}

export default ChatList;
