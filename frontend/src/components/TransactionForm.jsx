import { useEffect, useState } from "react";

function createEmptyForm() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return {
    walletId: "",
    categoryId: "",
    title: "",
    transactionType: "EXPENSE",
    amount: "",
    transactionDate: `${year}-${month}-${day}`,
    note: "",
  };
}

export default function TransactionForm({
  onCreated,
  transaction = null,
  onCancel,
  saving,
  onSavingChange: setSaving,
}) {
  const [form, setForm] = useState(() => {
    if (!transaction) {
      return createEmptyForm();
    }

    return {
      walletId: String(transaction.walletId),
      categoryId: String(transaction.categoryId),
      title: transaction.title,
      transactionType: transaction.transactionType,
      amount: String(transaction.amount),
      transactionDate: transaction.transactionDate,
      note: transaction.note ?? "",
    };
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOptions(url) {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải dữ liệu lựa chọn.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu lựa chọn không đúng định dạng.");
      }

      return data;
    }

    async function loadOptions() {
      try {
        const [walletData, categoryData] = await Promise.all([
          fetchOptions("/backend/api/wallets"),
          fetchOptions("/backend/api/categories"),
        ]);

        if (!controller.signal.aborted) {
          setWallets(walletData);
          setCategories(categoryData);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setOptionsError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setOptionsLoading(false);
        }
      }
    }

    loadOptions();

    return () => controller.abort();
  }, []);

  const filteredCategories = categories.filter(
    (category) => category.transactionType === form.transactionType,
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "transactionType" ? { categoryId: "" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || optionsLoading || optionsError) return;

    setError("");
    setSuccess("");

    const title = form.title.trim();
    const amount = Number(form.amount);

    if (!title) {
      setError("Tên giao dịch không được để trống.");
      return;
    }

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > 999999999999999
    ) {
      setError("Số tiền phải là số nguyên dương, tối đa 15 chữ số.");
      return;
    }

    const selectedWallet = wallets.find(
      (wallet) => String(wallet.id) === form.walletId,
    );

    const selectedCategory = filteredCategories.find(
      (category) => String(category.id) === form.categoryId,
    );

    if (!selectedWallet || !selectedCategory) {
      setError("Hãy chọn ví và danh mục phù hợp.");
      return;
    }

    const payload = {
      walletId: selectedWallet.id,
      categoryId: selectedCategory.id,
      title,
      transactionType: form.transactionType,
      amount,
      transactionDate: form.transactionDate,
      note: form.note.trim() || null,
    };

    setSaving(true);

    try {
      const url = transaction
        ? `/backend/api/transactions?id=${encodeURIComponent(transaction.id)}`
        : "/backend/api/transactions";

      const response = await fetch(url, {
        method: transaction ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || `Không thể lưu (HTTP ${response.status}).`,
        );
      }

      setSuccess(transaction ? "Đã cập nhật giao dịch." : "Đã thêm giao dịch.");

      if (!transaction) {
        setForm(createEmptyForm());
      }
    } catch (err) {
      setError(
        `${err.message} Nếu kết nối bị gián đoạn, hãy tải lại danh sách trước khi gửi lại.`,
      );
      setSaving(false);
      return;
    }

    // Lỗi tải lại không phải lỗi lưu giao dịch.
    try {
      await onCreated();
    } catch {
      setSuccess("Đã lưu giao dịch. Hãy nhấn tải lại danh sách.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="transaction-form">
      <h2>{transaction ? "Sửa giao dịch" : "Thêm giao dịch"}</h2>
      {optionsLoading && <p role="status">Đang tải ví và danh mục...</p>}

      {optionsError && (
        <p role="alert">
          {optionsError} Hãy kiểm tra backend rồi tải lại trang.
        </p>
      )}

      {!optionsLoading && !optionsError && wallets.length === 0 && (
        <p>Bạn chưa có ví đang sử dụng.</p>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={
            saving ||
            optionsLoading ||
            Boolean(optionsError) ||
            wallets.length === 0
          }
        >
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

          <label>
            Ví
            <select
              name="walletId"
              value={form.walletId}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn ví --</option>

              {wallets.map((wallet) => (
                <option key={wallet.id} value={String(wallet.id)}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Danh mục
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
              disabled={filteredCategories.length === 0}
            >
              <option value="">-- Chọn danh mục --</option>

              {filteredCategories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          {filteredCategories.length === 0 && (
            <p>Chưa có danh mục cho loại giao dịch này.</p>
          )}

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

          <button type="submit" disabled={filteredCategories.length === 0}>
            {saving
              ? "Đang lưu..."
              : transaction
                ? "Cập nhật giao dịch"
                : "Lưu giao dịch"}
          </button>
          {transaction && (
            <button type="button" onClick={onCancel} disabled={saving}>
              Hủy sửa
            </button>
          )}
        </fieldset>
      </form>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </section>
  );
}
