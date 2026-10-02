import { useEffect, useRef, useState } from "react";

function createEmptyForm() {
  const today = new Date();
  return {
    walletId: "", categoryId: "", title: "", transactionType: "EXPENSE",
    amount: "", note: "",
    transactionDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
  };
}

export default function TransactionForm({
  onCreated, transaction = null, onCancel, saving, onSavingChange: setSaving,
  csrfToken, onSessionExpired, optionsVersion = 0, disabled = false,
}) {
  const [form, setForm] = useState(() => transaction ? {
    walletId: String(transaction.walletId), categoryId: String(transaction.categoryId),
    title: transaction.title, transactionType: transaction.transactionType,
    amount: String(transaction.amount), transactionDate: transaction.transactionDate,
    note: transaction.note ?? "",
  } : createEmptyForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchOptions(url) {
      const response = await fetch(url, { signal: controller.signal });
      if (response.status === 401) {
        onSessionExpired();
        throw new Error("Phiên đăng nhập đã hết hạn.");
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Không thể tải ví và danh mục.");
      if (!Array.isArray(data)) throw new Error("Danh sách lựa chọn không đúng định dạng.");
      return data;
    }
    async function loadOptions() {
      setOptionsLoading(true);
      setOptionsError("");
      try {
        const [walletData, categoryData] = await Promise.all([
          fetchOptions("/backend/api/wallets"), fetchOptions("/backend/api/categories"),
        ]);
        if (!controller.signal.aborted) {
          setWallets(walletData);
          setCategories(categoryData);
        }
      } catch (err) {
        if (!controller.signal.aborted) setOptionsError(err.message);
      } finally {
        if (!controller.signal.aborted) setOptionsLoading(false);
      }
    }
    loadOptions();
    return () => controller.abort();
  }, [onSessionExpired, optionsVersion]);

  const filteredCategories = categories.filter((item) => item.transactionType === form.transactionType);
  const walletAvailable = wallets.some((item) => String(item.id) === form.walletId);
  const categoryAvailable = filteredCategories.some((item) => String(item.id) === form.categoryId);
  const blocked = disabled || saving || optionsLoading || Boolean(optionsError);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value,
      ...(name === "transactionType" ? { categoryId: "" } : {}),
    }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current || blocked) return;
    setError("");
    setSuccess("");
    const title = form.title.trim();
    const amount = Number(form.amount);
    if (!title || title.length > 150) {
      setError("Tên giao dịch phải có từ 1 đến 150 ký tự."); return;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 999999999999999) {
      setError("Số tiền phải là số nguyên dương, tối đa 15 chữ số."); return;
    }
    const wallet = wallets.find((item) => String(item.id) === form.walletId);
    const category = filteredCategories.find((item) => String(item.id) === form.categoryId);
    if (!wallet || !category) {
      setError("Hãy chọn ví và danh mục đang hoạt động, phù hợp với giao dịch."); return;
    }
    if (!form.transactionDate) { setError("Hãy chọn ngày giao dịch."); return; }
    const payload = {
      walletId: wallet.id, categoryId: category.id, title,
      transactionType: form.transactionType, amount,
      transactionDate: form.transactionDate, note: form.note.trim() || null,
    };
    const url = transaction
      ? `/backend/api/transactions?id=${encodeURIComponent(transaction.id)}`
      : "/backend/api/transactions";
    submitting.current = true;
    setSaving(true);
    try {
      const response = await fetch(url, {
        method: transaction ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) { onSessionExpired(); return; }
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || `Không thể lưu (HTTP ${response.status}).`);
      setSuccess(transaction ? "Đã cập nhật giao dịch." : "Đã thêm giao dịch.");
      if (!transaction) setForm(createEmptyForm());
      try { await onCreated(); }
      catch { setSuccess("Đã lưu giao dịch. Hãy tải lại danh sách để cập nhật kết quả."); }
    } catch (err) {
      setError(`${err.message} Nếu mất kết nối, hãy tải lại danh sách để kiểm tra trước khi gửi lại.`);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="transaction-form" aria-labelledby="transaction-form-heading">
      <h2 id="transaction-form-heading">{transaction ? "Sửa giao dịch" : "Thêm giao dịch"}</h2>
      {transaction && <p>Đang sửa: <strong>{transaction.title}</strong></p>}
      {optionsLoading && <p role="status">Đang tải ví và danh mục...</p>}
      {optionsError && <p role="alert">{optionsError} Hãy tải lại trang để thử lại.</p>}
      {!optionsLoading && !optionsError && wallets.length === 0 && <p>Bạn chưa có ví đang hoạt động. Hãy tạo ví trong tab “Ví và danh mục”.</p>}
      {!optionsLoading && !optionsError && transaction && (!walletAvailable || !categoryAvailable) && (
        <p role="alert">Ví hoặc danh mục đang chọn không còn trong danh sách hoạt động. Hãy chọn lại trước khi lưu.</p>
      )}
      <form onSubmit={handleSubmit} aria-busy={saving}>
        <fieldset disabled={blocked || wallets.length === 0}>
          <legend>Thông tin giao dịch</legend>
          <label>Tên giao dịch<input name="title" value={form.title} onChange={handleChange} maxLength={150} required /></label>
          <label>Loại giao dịch<select name="transactionType" value={form.transactionType} onChange={handleChange}>
            <option value="EXPENSE">Chi tiêu</option><option value="INCOME">Thu nhập</option>
          </select></label>
          <label>Ví<select name="walletId" value={walletAvailable ? form.walletId : ""} onChange={handleChange} required>
            <option value="">-- Chọn ví --</option>
            {wallets.map((wallet) => <option key={wallet.id} value={String(wallet.id)}>{wallet.name}</option>)}
          </select></label>
          <label>Danh mục<select name="categoryId" value={categoryAvailable ? form.categoryId : ""} onChange={handleChange} required disabled={filteredCategories.length === 0}>
            <option value="">-- Chọn danh mục --</option>
            {filteredCategories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
          </select></label>
          {!optionsLoading && !optionsError && filteredCategories.length === 0 && <p>Chưa có danh mục cho loại giao dịch này.</p>}
          <label>Số tiền (VNĐ)<input type="number" name="amount" value={form.amount} onChange={handleChange} min="1" max="999999999999999" step="1" required /></label>
          <label>Ngày giao dịch<input type="date" name="transactionDate" value={form.transactionDate} onChange={handleChange} min="1000-01-01" max="9999-12-31" required /></label>
          <label className="form-wide">Ghi chú<textarea name="note" value={form.note} onChange={handleChange} maxLength={500} rows={3} /></label>
          <div className="form-actions form-wide">
            <button type="submit" disabled={filteredCategories.length === 0}>{saving ? "Đang lưu..." : transaction ? "Cập nhật giao dịch" : "Lưu giao dịch"}</button>
          </div>
        </fieldset>
        {transaction && <button type="button" className="button-secondary cancel-edit" onClick={onCancel} disabled={saving}>Hủy sửa</button>}
      </form>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </section>
  );
}
