import { customFetcher } from '@dashboard/shared-api';
import { useAuthStore } from '@dashboard/shared-auth';
import type { LoginResponse } from '@dashboard/shared-types';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const layoutStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: 880,
  margin: '40px auto',
  padding: '0 16px',
  color: '#111827',
};


const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const requestLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('role') as string;
    login(username);
    navigate('/')
  };

  return (
    <section style={layoutStyle}>
      <div>
        <form onSubmit={requestLogin}>
        <label htmlFor="role">Role</label>
        <select name="role" id="role">
          <option>admin</option>
          <option>viewer</option>
          <option>cx</option>
        </select>
        <button type="submit" value="submit">로그인</button>
        </form>
      </div>
    </section>
  )
};

export default LoginPage;
