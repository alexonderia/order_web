import { useState } from 'react';
import { AuthPage } from '@pages/AuthPage';
import { CreateRequestPage } from '@pages/CreateRequestPage';
import { RequestsPage } from '@pages/RequestsPage';
import { createRequest } from '@shared/api/createRequest';
import { loginWebUser } from '@shared/api/loginWebUser';
import type { LoginWebUserPayload } from '@shared/api/loginWebUser';
import { registerWebUser } from '@shared/api/registerWebUser';
import type { RegisterWebUserPayload } from '@shared/api/registerWebUser';

export const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userLogin, setUserLogin] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'requests' | 'create'>('requests');
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [createRequestError, setCreateRequestError] = useState<string | null>(null);

  const handleRegister = async (payload: RegisterWebUserPayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await registerWebUser(payload);
      setIsAuthenticated(true);
      setUserLogin(response.login);
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
      const response = await loginWebUser(payload);
      setIsAuthenticated(true);
      setUserLogin(response.login);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка авторизации');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRequest = async (data: {
    description: string;
    deadlineAt: string;
    file: File | null;
  }) => {
    if (!userLogin) {
      setCreateRequestError('Не удалось определить пользователя');
      return;
    }
    if (!data.file) {
      setCreateRequestError('Файл обязателен для отправки заявки');
      return;
    }
    if (!data.deadlineAt) {
      setCreateRequestError('Укажите дату сбора КП');
      return;
    }

    setIsCreatingRequest(true);
    setCreateRequestError(null);
    try {
      const deadlineAt = data.deadlineAt ? `${data.deadlineAt}T00:00:00` : '';
      await createRequest({
        id_user_web: userLogin,
        description: data.description.trim() || null,
        deadline_at: deadlineAt,
        file: data.file
      });
      setActivePage('requests');
    } catch (error) {
      setCreateRequestError(error instanceof Error ? error.message : 'Ошибка создания заявки');
    } finally {
      setIsCreatingRequest(false);
    }
  };


  return isAuthenticated ? (
    activePage === 'requests' ? (
      <RequestsPage
        onCreateRequest={() => {
          setCreateRequestError(null);
          setActivePage('create');
        }}
      />
    ) : (
      <CreateRequestPage
        onClose={() => setActivePage('requests')}
        onSubmit={handleCreateRequest}
        isSubmitting={isCreatingRequest}
        errorMessage={createRequestError}
      />
    )
  ) : (
    <AuthPage
      onRegister={handleRegister}
      onLogin={handleLogin}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );

};