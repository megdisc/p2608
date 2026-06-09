import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button } from '../components/ui';

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
          <h1>在庫管理システム</h1>
          <p className="system-id">p2608</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <Input 
              id="email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="login-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <Input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="login-input"
            />
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
            <Button type="submit" style={{ width: '100%' }}>
              ログイン
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
