import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/overview', label: 'Overview' },
  { to: '/questions', label: 'Questions' },
  { to: '/students', label: 'Students' },
  { to: '/attempts', label: 'Attempts' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-title">Kids Bible Quiz</div>
        <div className="sidebar-subtitle">Admin</div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.firstName}</div>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
