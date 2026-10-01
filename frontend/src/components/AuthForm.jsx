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
    <section className="auth-form">
      <h1>Quản lý tài chính cá nhân</h1>
      <h2>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy}>
          <legend>Thông tin tài khoản</legend>

          {isRegister && (
            <label>
              Họ tên
              <input
                name="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                maxLength={100}
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
              maxLength={255}
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
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {isRegister && (
            <p>Dùng mật khẩu từ 15 đến 128 ký tự.</p>
          )}

          <button type="submit">
            {busy
              ? 'Đang xử lý...'
              : isRegister
                ? 'Đăng ký'
                : 'Đăng nhập'}
          </button>

          <button type="button" onClick={switchMode}>
            {isRegister
              ? 'Đã có tài khoản? Đăng nhập'
              : 'Chưa có tài khoản? Đăng ký'}
          </button>
        </fieldset>
      </form>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>
  )
}