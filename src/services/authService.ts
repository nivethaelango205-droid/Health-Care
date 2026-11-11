import { AuthSession, User } from '../types';
import { request, isDemoModeActive, setStoredToken, setStoredUser, getStoredUser } from './api';
import { DEMO_USERS } from './mockData';

export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    if (isDemoModeActive()) {
      // Find matching demo user or fallback
      const found = Object.values(DEMO_USERS).find((d) => d.user.email.toLowerCase() === email.toLowerCase());
      if (found) {
        const session: AuthSession = {
          user: found.user,
          token: `demo-token-${found.user.role}-${Date.now()}`,
          expiresAt: new Date(Date.now() + 12 * 3600000).toISOString(),
        };
        setStoredToken(session.token);
        setStoredUser(session.user);
        return session;
      }
      // If someone types any patient email in demo mode
      const defaultUser: User = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0].replace(/[._]/g, ' '),
        email,
        role: 'patient',
        createdAt: new Date().toISOString(),
      };
      const session: AuthSession = {
        user: defaultUser,
        token: `demo-token-custom-${Date.now()}`,
        expiresAt: new Date(Date.now() + 12 * 3600000).toISOString(),
      };
      setStoredToken(session.token);
      setStoredUser(session.user);
      return session;
    }

    const res = await request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async register(name: string, email: string, password: string): Promise<AuthSession> {
    if (isDemoModeActive()) {
      const newUser: User = {
        id: `p-${Date.now()}`,
        name,
        email,
        role: 'patient',
        createdAt: new Date().toISOString(),
      };
      const session: AuthSession = {
        user: newUser,
        token: `demo-token-reg-${Date.now()}`,
        expiresAt: new Date(Date.now() + 12 * 3600000).toISOString(),
      };
      setStoredToken(session.token);
      setStoredUser(session.user);
      return session;
    }

    const res = await request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async getMe(): Promise<User | null> {
    if (isDemoModeActive()) {
      return getStoredUser();
    }
    try {
      const res = await request<{ user: User }>('/auth/me');
      setStoredUser(res.user);
      return res.user;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    if (!isDemoModeActive()) {
      try {
        await request<void>('/auth/logout', { method: 'POST' });
      } catch (e) {
        console.warn('Backend logout error', e);
      }
    }
    setStoredToken(null);
    setStoredUser(null);
  },
};

