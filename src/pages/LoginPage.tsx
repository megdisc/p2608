import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { SYSTEM_NAME, SYSTEM_ID, LOGIN_LABELS, BUTTON_LABELS, PLACEHOLDERS } from '../constants';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 現状はバリデーションせずに login() を呼び出す
    await login(email, password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{SYSTEM_NAME}</h1>
          <span className="system-id">{SYSTEM_ID}</span>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="email">{LOGIN_LABELS.EMAIL}</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={PLACEHOLDERS.EMAIL}
              className="login-input"
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password">{LOGIN_LABELS.PASSWORD}</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={PLACEHOLDERS.PASSWORD}
              className="login-input"
            />
          </div>

          <div style={{ marginTop: '32px' }}>
            <Button 
              type="submit" 
              variant="primary" 
              style={{ width: '100%' }}
            >
              {BUTTON_LABELS.LOGIN}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
