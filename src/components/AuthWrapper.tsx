import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (credential: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userEmail: null,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Decode JWT token to get user info
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth-token');
    if (savedAuth) {
      const decoded = decodeJWT(savedAuth);
      if (decoded && decoded.email) {
        setIsAuthenticated(true);
        setUserEmail(decoded.email);
      }
    }
  }, []);

  const login = (credential: string) => {
    const decoded = decodeJWT(credential);
    if (decoded && decoded.email) {
      localStorage.setItem('auth-token', credential);
      setIsAuthenticated(true);
      setUserEmail(decoded.email);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout }}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
        {children}
      </GoogleOAuthProvider>
    </AuthContext.Provider>
  );
}

interface LoginPageProps {
  allowedEmails?: string[];
}

export function LoginPage({ allowedEmails = [] }: LoginPageProps) {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="retro-main-container" style={{ maxWidth: '400px', width: '100%' }}>
        <header className="retro-header">
          <h1 className="retro-title">🔐 Admin Login 🔐</h1>
        </header>
        
        <div className="p-8 text-center">
          <div className="mb-8">
            <p className="text-xl text-neon-green mb-4">
              Welcome to the Admin Panel!
            </p>
            <p className="text-cyan text-sm mb-6">
              Please sign in with your Google account to continue
            </p>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(response) => {
                if (response.credential) {
                  const decoded = decodeJWT(response.credential);
                  
                  // Check if email is allowed
                  if (allowedEmails.length > 0 && decoded?.email) {
                    if (!allowedEmails.includes(decoded.email)) {
                      alert('Unauthorized email address!');
                      return;
                    }
                  }
                  
                  login(response.credential);
                }
              }}
              onError={() => {
                console.error('Login Failed');
              }}
              theme="filled_black"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <div className="mt-8 text-xs text-gray-500">
            <p>🌟 Best viewed in Netscape Navigator 4.0 🌟</p>
          </div>
        </div>

        <footer className="retro-footer">
          <div className="retro-footer-content">
            <div className="retro-copyright">
              © 1998-2025 Secure Login System
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}