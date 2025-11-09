import { useState } from 'react';
import { authAPI } from '../services/api';
import { generateKeyPair } from '../services/crypto';

function Login({ onSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('📤 Sending login request...');
      const response = await authAPI.login({ email, password });
      
      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        // Check if keys exist in localStorage
        let keys = localStorage.getItem('keys');
        
        if (!keys) {
          console.log('⚠️ No keys found, generating new keys...');
          // If no keys (user logged in from different device/browser), generate new ones
          const newKeys = await generateKeyPair();
          localStorage.setItem('keys', JSON.stringify(newKeys));
          console.log('✅ New keys generated and saved');
        } else {
          console.log('✅ Existing keys found');
        }
        
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        
        console.log('✅ Login successful!');
        onSuccess(response.data.user);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>🔐 Login</h2>
      <form onSubmit={handleSubmit}>
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
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>
      <div className="switch-view">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister}>Register</button>
      </div>
    </div>
  );
}

export default Login;
