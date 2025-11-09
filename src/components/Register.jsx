import { useState } from 'react';
import { authAPI } from '../services/api';
import { generateKeyPair } from '../services/crypto';

function Register({ onSuccess, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Generating encryption keys...');
      const keys = await generateKeyPair();
      const deviceId = `device_${Date.now()}`;

      console.log('📤 Sending registration request...');
      const response = await authAPI.register({
        username,
        email,
        password,
        publicKey: keys.publicKey,
        deviceId
      });

      console.log('✅ Registration response:', response.data);

      if (response.data.success) {
        localStorage.setItem('keys', JSON.stringify(keys));
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        
        console.log('✅ Registration successful!');
        onSuccess(response.data.user);
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>🔐 Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>
      <div className="switch-view">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin}>Login</button>
      </div>
    </div>
  );
}

export default Register;
