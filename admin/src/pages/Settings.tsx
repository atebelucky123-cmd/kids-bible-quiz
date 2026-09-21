import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';

// Not part of the approved 4-tab UI design (Overview/Questions/Students/
// Attempts) — added because development plan Appendix A promises the
// seeded admin's placeholder password can be changed "via the admin
// panel's own settings screen," and nothing else provides that.
export function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
    } finally {
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
        <div className="field">
          <label htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && <p style={{ color: '#4d6600', fontSize: 13 }}>Password updated.</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
