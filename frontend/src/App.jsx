import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Chưa kiểm tra kết nối.')
  const [loading, setLoading] = useState(false)

  async function checkBackend() {
    setLoading(true)
    setMessage('Đang kết nối...')

    try {
      const response = await fetch('/backend/api/hello')

      if (!response.ok) {
        throw new Error(`Máy chủ trả về lỗi HTTP ${response.status}`)
      }

      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      setMessage(`Kết nối thất bại: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Quản lý chi tiêu cá nhân</h1>

      <button onClick={checkBackend} disabled={loading}>
        {loading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Java'}
      </button>

      <p role="status">{message}</p>
    </main>
  )
}

export default App