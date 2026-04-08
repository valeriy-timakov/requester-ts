import type { RequestAuth } from '@/shared/types/requester';

interface AuthEditorProps {
  auth: RequestAuth;
  onChange: (auth: RequestAuth) => void;
}

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
  function handleAuthTypeChange(authType: RequestAuth['type']) {
    if (authType === 'basic') {
      onChange({ type: 'basic', username: '', password: '' });
      return;
    }

    if (authType === 'bearer') {
      onChange({ type: 'bearer', token: '' });
      return;
    }

    onChange({ type: 'none' });
  }

  return (
    <section className="editor-section">
      <label className="field-group field-group--compact">
        <span className="field-group__label">Auth</span>
        <select
          className="field-input"
          value={auth.type}
          onChange={(event) =>
            handleAuthTypeChange(event.target.value as RequestAuth['type'])
          }
        >
          <option value="none">None</option>
          <option value="basic">Basic</option>
          <option value="bearer">Bearer</option>
        </select>
      </label>

      {auth.type === 'basic' ? (
        <div className="editor-grid editor-grid--two">
          <label className="field-group">
            <span className="field-group__label">Username</span>
            <input
              className="field-input"
              value={auth.username}
              onChange={(event) =>
                onChange({ ...auth, username: event.target.value })
              }
            />
          </label>

          <label className="field-group">
            <span className="field-group__label">Password</span>
            <input
              className="field-input"
              type="password"
              value={auth.password}
              onChange={(event) =>
                onChange({ ...auth, password: event.target.value })
              }
            />
          </label>
        </div>
      ) : null}

      {auth.type === 'bearer' ? (
        <label className="field-group">
          <span className="field-group__label">Token</span>
          <input
            className="field-input"
            value={auth.token}
            onChange={(event) =>
              onChange({ ...auth, token: event.target.value })
            }
          />
        </label>
      ) : null}
    </section>
  );
}
