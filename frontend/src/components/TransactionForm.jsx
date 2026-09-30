import { useState } from 'react'

function createEmptyForm() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return {
    title: '',
    transactionType: 'EXPENSE',
    amount: '',
    transactionDate: `${year}-${month}-${day}`,
    note: '',
  }
}

export default function TransactionForm({ onCreated }) {
  const [form, setForm] = useState(createEmptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    setError('')
    setSuccess('')

    const title = form.title.trim()
    const amount = Number(form.amount)

    if (!title) {
      setError('Tên giao dịch không được để trống.')
      return
    }

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > 999999999999999
    ) {
      setError('Số tiền phải là số nguyên dương, tối đa 15 chữ số.')
      return
    }

    const payload = {
      walletId: 1,
      categoryId: form.transactionType === 'INCOME' ? 1 : 2,
      title,
      transactionType: form.transactionType,
      amount,
      transactionDate: form.transactionDate,
      note: form.note.trim() || null,
    }

    setSaving(true)

    try {
      const response = await fetch('/backend/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || `Không thể lưu (HTTP ${response.status}).`
        )
      }

      setSuccess('Đã lưu giao dịch thành công.')
      setForm(createEmptyForm())
    } catch (err) {
      setError(
        `${err.message} Nếu kết nối bị gián đoạn, hãy tải lại danh sách trước khi gửi lại.`
      )
      setSaving(false)
      return
    }

    // POST đã thành công. Lỗi tải lại không phải lỗi lưu giao dịch.
    try {
      await onCreated()
    } catch {
      setSuccess('Đã lưu giao dịch. Hãy nhấn tải lại danh sách.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="transaction-form">
      <h2>Thêm giao dịch</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={saving}>
          <legend>Thông tin giao dịch</legend>

          <label>
            Tên giao dịch
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={150}
              required
            />
          </label>

          <label>
            Loại giao dịch
            <select
              name="transactionType"
              value={form.transactionType}
              onChange={handleChange}
            >
              <option value="EXPENSE">Chi tiêu</option>
              <option value="INCOME">Thu nhập</option>
            </select>
          </label>

          <p>
            Ví: Tiền mặt · Danh mục:{' '}
            {form.transactionType === 'INCOME' ? 'Lương' : 'Ăn uống'}
          </p>

          <label>
            Số tiền (VNĐ)
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="1"
              max="999999999999999"
              step="1"
              required
            />
          </label>

          <label>
            Ngày giao dịch
            <input
              type="date"
              name="transactionDate"
              value={form.transactionDate}
              onChange={handleChange}
              min="1000-01-01"
              max="9999-12-31"
              required
            />
          </label>

          <label>
            Ghi chú
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              maxLength={500}
              rows={3}
            />
          </label>

          <button type="submit">
            {saving ? 'Đang lưu...' : 'Lưu giao dịch'}
          </button>
        </fieldset>
      </form>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </section>
  )
}