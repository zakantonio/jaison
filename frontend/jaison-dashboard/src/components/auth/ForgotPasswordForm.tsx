import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ForgotPasswordForm: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="auth-header">
          <h2 className="auth-title">Reset your password</h2>
          <p className="auth-subtitle">
            Or{' '}
            <Link to="/login" className="auth-form-link">
              sign in to your account
            </Link>
          </p>
        </div>

        {success ? (
          <div className="api-testing-success-message">
            <div className="flex items-center">
              <span className="api-testing-success-icon">✔</span>
              <h3 className="font-medium">Password reset email sent</h3>
            </div>
            <div className="mt-2">
              <p>
                If an account exists with the email you provided, you will receive a password reset link shortly.
              </p>
            </div>
            <div className="mt-4">
              <Link
                to="/login"
                className="auth-form-link"
              >
                Return to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="email-address" className="auth-form-label">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="auth-form-input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="auth-form-error">
                <h3 className="auth-form-error-message">{error}</h3>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-form-submit"
            >
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
