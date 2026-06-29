import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import ClientList from './pages/ClientList';
import ClientForm from './pages/ClientForm';
import ProjectList from './pages/ProjectList';
import ProjectForm from './pages/ProjectForm';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';

const DefaultRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'ADMIN' ? '/dashboard' : '/invoices'} replace />;
};

const App = () => (
  <AuthProvider>
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                  <Routes>
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/invoices" element={<InvoiceList />} />
                    <Route
                      path="/invoices/new"
                      element={
                        <ProtectedRoute roles={['ACCOUNTANT']}>
                          <InvoiceForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/invoices/:id/edit"
                      element={
                        <ProtectedRoute roles={['ACCOUNTANT']}>
                          <InvoiceForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/invoices/:id" element={<InvoiceDetail />} />

                    <Route
                      path="/clients"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <ClientList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/clients/new"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <ClientForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/clients/:id/edit"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <ClientForm />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <UserList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users/new"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <UserForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users/:id/edit"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <UserForm />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/projects"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <ProjectList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projects/new"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <ProjectForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projects/:id/edit"
                      element={
                        <ProtectedRoute roles={['ADMIN']}>
                          <ProjectForm />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/" element={<DefaultRedirect />} />
                    <Route path="*" element={<Navigate to="/invoices" replace />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;
