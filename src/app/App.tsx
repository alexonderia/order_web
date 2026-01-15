import { useState } from 'react';
import { AuthPage } from '@pages/AuthPage';
import { RequestsPage } from '@pages/RequestsPage';
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

  return isAuthenticated ? (
    <RequestsPage />
  ) : (
    <AuthPage onRegister={handleRegister} isSubmitting={isSubmitting} errorMessage={errorMessage} />
  );

};