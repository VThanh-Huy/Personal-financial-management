import { useState } from 'react'

export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const isRegister = mode === 'register'

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setPassword('')
    setError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (busy) return

    setError('')
    setMessage('')

    if (isRegister && !fullName.trim()) {
      setError('Họ tên không được để trống.')
      return
    }

    if (
      isRegister &&
      (Array.from(password).length < 15 ||
        Array.from(password).length > 128)
    ) {
      setError('Mật khẩu phải có từ 15 đến 128 ký tự.')
      return
    }

    const payload = isRegister
      ? { fullName: fullName.trim(), email: email.trim(), password }
      : { email: email.trim(), password }

    const url = isRegister
      ? '/backend/api/auth/register'
      : '/backend/api/auth/login'

    setBusy(true)

    let data

    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || `Yêu cầu thất bại (HTTP ${response.status}).`
        )
      }

      if (!isRegister && (!data?.user || !data?.csrfToken)) {
        throw new Error('Phản hồi đăng nhập không đúng định dạng.')
      }
    } catch (err) {
      setError(err.message)
      setBusy(false)
      return
    }

    setPassword('')
    setBusy(false)

    if (isRegister) {
      setMode('login')
      setMessage('Đăng ký thành công. Hãy đăng nhập bằng tài khoản vừa tạo.')
      return
    }

    onAuthenticated(data)
  }

    return (
    <main className="auth-page">
      <section className="auth-form" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">₫</span>
          <span>Tài chính cá nhân</span>
        </div>

        <header className="auth-heading">
          <h1 id="auth-title">
            {isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
          </h1>

          <p>
            {isRegister
              ? 'Bắt đầu ghi chép và quản lý thu chi của bạn.'
              : 'Đăng nhập để tiếp tục quản lý thu chi của bạn.'}
          </p>
        </header>

        <form onSubmit={handleSubmit} aria-busy={busy}>
          <fieldset disabled={busy}>
            <legend className="visually-hidden">
              Thông tin tài khoản
            </legend>

            {isRegister && (
              <label>
                Họ và tên
                <input
                  name="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  maxLength={100}
                  placeholder="Nhập họ và tên"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={255}
                placeholder="ban@example.com"
                required
              />
            </label>

            <label>
              Mật khẩu
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  isRegister ? 'new-password' : 'current-password'
                }
                aria-describedby={
                  isRegister ? 'password-hint' : undefined
                }
                placeholder={
                  isRegister ? 'Tạo mật khẩu của bạn' : 'Nhập mật khẩu'
                }
                required
              />
            </label>

            {isRegister && (
              <p id="password-hint" className="auth-hint">
                Dùng mật khẩu từ 15 đến 128 ký tự.
                Bạn có thể dùng một cụm từ dài, dễ nhớ.
              </p>
            )}

            <button className="auth-submit" type="submit">
              {busy
                ? 'Đang xử lý...'
                : isRegister
                  ? 'Tạo tài khoản'
                  : 'Đăng nhập'}
            </button>
          </fieldset>
        </form>

        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        <div className="auth-footer">
          <p>
            {isRegister ? 'Bạn đã có tài khoản?' : 'Bạn chưa có tài khoản?'}
          </p>

          <button
            className="auth-switch"
            type="button"
            onClick={switchMode}
            disabled={busy}
          >
            {isRegister ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </button>
        </div>
      </section>

      <p className="auth-caption">
        Theo dõi từng khoản nhỏ, chủ động hơn với tài chính của bạn.
      </p>
    </main>
  )
}