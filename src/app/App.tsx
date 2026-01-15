import { useState } from 'react';
import { AuthPage } from '@pages/AuthPage';
import { RequestsPage } from '@pages/RequestsPage';
import { loginWebUser } from '@shared/api/loginWebUser';
import type { LoginWebUserPayload } from '@shared/api/loginWebUser';
import { registerWebUser } from '@shared/api/registerWebUser';
import type { RegisterWebUserPayload } from '@shared/api/registerWebUser';

export const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (payload: RegisterWebUserPayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await registerWebUser(payload);
      setIsAuthenticated(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка регистрации');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (payload: LoginWebUserPayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWebUser(payload);
      setIsAuthenticated(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка авторизации');
    } finally {
      setIsSubmitting(false);
    }
  };

  return isAuthenticated ? (
    <RequestsPage />
  ) : (
    <AuthPage
      onRegister={handleRegister}
      onLogin={handleLogin}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );

};