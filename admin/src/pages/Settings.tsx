import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PasswordInput } from '../components/PasswordInput';

// Mirrors the server's passwordSchema (server/src/validators/auth.validators.ts)
// so the admin sees exactly what's wrong before submitting, instead of
// finding out from a rejected request.
function passwordProblem(password: string): string | null {
  if (password.length < 6) return 'New password must be at least 6 characters.';
  if (!/^[A-Za-z0-9]+$/.test(password)) return 'New password can only contain letters and numbers — no symbols or spaces.';
  if (!/[A-Za-z]/.test(password)) return 'New password must contain at least one letter.';
  if (!/[0-9]/.test(password)) return 'New password must contain at least one number.';
  return null;
}

// Not part of the approved 4-tab UI design (Overview/Questions/Students/
// Attempts) — added because development plan Appendix A promises the
// seeded admin's placeholder password can be changed "via the admin
// panel's own settings screen," and nothing else provides that.
export function Settings() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const problem = passwordProblem(newPassword);
    if (problem) {
      setError(problem);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      // Log straight back in with the new password: it proves the change
      // took, and lets the browser's password manager save the new one
      // instead of keeping a stale password that fails next time.
      await logout('Password updated. Log in with your new password.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Change the shared admin account's password.</p>
        </div>
      </div>

      <form className="card" style={{ maxWidth: 420 }} onSubmit={handleSubmit}>
        {/* Hidden username so password managers recognise this as a
            password change for this account and update their saved entry. */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={user?.firstName ?? ''}
          readOnly
          hidden
        />

        <div className="field">
          <label htmlFor="currentPassword">Current password</label>
          <PasswordInput
            id="currentPassword"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <PasswordInput
            id="newPassword"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, margin: '6px 0 0' }}>
            At least 6 characters, letters and numbers only, with at least one of each. Capital letters matter.
          </p>
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
