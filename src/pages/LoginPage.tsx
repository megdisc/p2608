import { Button, Input } from '../components';
import { useState } from 'react';
import { useAuth } from '../contexts';
import { SYSTEM_NAME, SYSTEM_ID, LOGIN_LABELS, BUTTON_LABELS, PLACEHOLDERS } from '../constants';
import type { SystemType } from '../types';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async (systemType: SystemType) => {
    // 現状はバリデーションせずに login() を呼び出す
    await login(email, password, systemType);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{SYSTEM_NAME}</h1>
          <span className="system-id">{SYSTEM_ID}</span>
        </div>
        
        <div className="login-form">
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

          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button 
              type="button" 
              variant="primary" 
              style={{ width: '100%' }}
              onClick={() => handleLogin('inventory')}
            >
              {BUTTON_LABELS.LOGIN_INVENTORY}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              style={{ width: '100%' }}
              onClick={() => handleLogin('project')}
            >
              {BUTTON_LABELS.LOGIN_PROJECT}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
