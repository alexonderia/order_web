import { useEffect, useState } from 'react';
import { AdminPage } from '@pages/AdminPage';
import { AuthPage } from '@pages/AuthPage';
import { CreateRequestPage } from '@pages/CreateRequestPage';
import { RequestDetailsPage } from '@pages/RequestDetailsPage';
import { RequestsPage } from '@pages/RequestsPage';
import { createRequest } from '@shared/api/createRequest';
import { loginWebUser } from '@shared/api/loginWebUser';
import type { LoginWebUserPayload } from '@shared/api/loginWebUser';
import { registerWebUser } from '@shared/api/registerWebUser';
import type { RegisterWebUserPayload } from '@shared/api/registerWebUser';
import type { RequestWithOfferStats } from '@shared/api/getRequests';

export const App = () => {
  const sessionKey = 'order-web:session';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userLogin, setUserLogin] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<'requests' | 'create' | 'details' | 'admin'>('requests');
  const [selectedRequest, setSelectedRequest] = useState<RequestWithOfferStats | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [createRequestError, setCreateRequestError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(sessionKey);
    if (!raw) {
      return;
    }
    try {
      const stored = JSON.parse(raw) as {
        isAuthenticated?: boolean;
        userLogin?: string;
        userRole?: number;
        activePage?: 'requests' | 'create' | 'details' | 'admin';
      };
      if (stored.isAuthenticated && stored.userLogin && typeof stored.userRole === 'number') {
        setIsAuthenticated(true);
        setUserLogin(stored.userLogin);
        setUserRole(stored.userRole);
        setActivePage(stored.activePage ?? (stored.userRole === 1 ? 'admin' : 'requests'));
      }
    } catch {
      sessionStorage.removeItem(sessionKey);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userLogin || userRole === null) {
      sessionStorage.removeItem(sessionKey);
      return;
    }
    const payload = {
      isAuthenticated,
      userLogin,
      userRole,
      activePage
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(payload));
  }, [activePage, isAuthenticated, sessionKey, userLogin, userRole]);

  const handleRegister = async (payload: RegisterWebUserPayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await registerWebUser(payload);
      setIsAuthenticated(true);
      setUserLogin(response.login);
      setUserRole(response.role);
      setActivePage('requests');
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
      setUserRole(response.role);
      setActivePage(response.role === 1 ? 'admin' : 'requests');
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserLogin(null);
    setUserRole(null);
    setActivePage('requests');
    setSelectedRequest(null);
    sessionStorage.removeItem(sessionKey);
  };

  return isAuthenticated ? (
    userRole === 1 && activePage === 'admin' ? (
      <AdminPage onLogout={handleLogout} />
    ) : activePage === 'requests' ? (
      <RequestsPage
        userLogin={userLogin ?? ''}
        onCreateRequest={() => {
          setCreateRequestError(null);
          setActivePage('create');
        }}
        onLogout={handleLogout}
        onRequestSelect={(request) => {
          setSelectedRequest(request);
          setActivePage('details');
        }}
      />
    ) : activePage === 'create' ? (
      <CreateRequestPage
        onClose={() => setActivePage('requests')}
        onSubmit={handleCreateRequest}
        isSubmitting={isCreatingRequest}
        errorMessage={createRequestError}
      />
    ) : selectedRequest ? (
      <RequestDetailsPage
        request={selectedRequest}
        userLogin={userLogin ?? ''}
        onBack={() => setActivePage('requests')}
        onLogout={handleLogout}
      />
    ) : (
      <RequestsPage
        userLogin={userLogin ?? ''}
        onCreateRequest={() => {
          setCreateRequestError(null);
          setActivePage('create');
        }}
        onLogout={handleLogout}
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