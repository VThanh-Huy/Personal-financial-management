import { useCallback, useEffect, useState } from 'react'
import AuthForm from './AuthForm'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSessionExpired = useCallback(() => {
    setSession(null)
    setError('')
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function checkSession() {
      try {
        const response = await fetch('/backend/api/auth/me', {
          credentials: 'same-origin',
          signal: controller.signal,
        })

        if (response.status === 401) {
          return
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Không thể kiểm tra phiên đăng nhập.')
        }

        if (!data.user || !data.csrfToken) {
          throw new Error('Thông tin phiên đăng nhập không hợp lệ.')
        }

        if (!controller.signal.aborted) {
          setSession(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false)
        }
      }
    }

    checkSession()

    return () => controller.abort()
  }, [])

  async function logout() {
    if (loggingOut) return

    setLoggingOut(true)
    setError('')

    try {
      const response = await fetch('/backend/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': session.csrfToken,
        },
      })

      // Nếu phiên đã hết hạn thì cũng quay về màn hình đăng nhập.
      if (response.status === 401 || response.ok) {
        setSession(null)
        return
      }

      const data = await response.json().catch(() => null)

      throw new Error(
        data?.message || 'Không thể đăng xuất. Hãy thử lại.'
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoggingOut(false)
    }
  }

  if (checking) {
    return <p role="status">Đang kiểm tra phiên đăng nhập...</p>
  }

  if (!session) {
    if (error) {
      return (
        <section>
          <p role="alert">{error}</p>
          <button onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </section>
      )
    }

    return <AuthForm onAuthenticated={setSession} />
  }

  return (
    <>
      <header className="session-header">
        <span>Xin chào, {session.user.fullName}</span>

        <button onClick={logout} disabled={loggingOut}>
          {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </button>
      </header>

      {error && <p role="alert">{error}</p>}

      <fieldset className="session-content" disabled={loggingOut}>
        {children({
          user: session.user,
          csrfToken: session.csrfToken,
          onSessionExpired: handleSessionExpired,
        })}
      </fieldset>
    </>
  )
}