import TransactionForm from "./components/TransactionForm";
import { useState } from "react";
import "./App.css";

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/backend/api/transactions");

      if (!response.ok) {
        throw new Error(`Không thể tải dữ liệu (HTTP ${response.status}).`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu trả về không đúng định dạng danh sách.");
      }

      setTransactions(data);
      setHasLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTransaction(transaction) {
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      `Xóa giao dịch "${transaction.title}"? Thao tác này không thể hoàn tác trên giao diện.`,
    );

    if (!confirmed) return;

    setDeletingId(transaction.id);
    setDeleteError("");
    setDeleteSuccess("");

    try {
      const response = await fetch(
        `/backend/api/transactions?id=${encodeURIComponent(transaction.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || `Không thể xóa (HTTP ${response.status}).`,
        );
      }

      // HTTP 204 không có JSON nên không gọi response.json() ở đây.
      setDeleteSuccess("Đã xóa giao dịch.");
    } catch (err) {
      setDeleteError(
        `${err.message} Nếu mất kết nối, hãy tải lại danh sách để kiểm tra.`,
      );
      setDeletingId(null);
      return;
    }

    // Xóa đã thành công; việc tải lại là thao tác riêng.
    try {
      await loadTransactions();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTransactionSaved() {
    setEditingTransaction(null);
    await loadTransactions();
  }

  return (
    <main>
      <h1>Quản lý tài chính cá nhân</h1>

      <TransactionForm
        key={editingTransaction?.id ?? "new"}
        transaction={editingTransaction}
        saving={saving}
        onSavingChange={setSaving}
        onCreated={handleTransactionSaved}
        onCancel={() => setEditingTransaction(null)}
      />

      <button onClick={loadTransactions} disabled={loading}>
        {loading ? "Đang tải..." : "Tải danh sách giao dịch"}
      </button>

      {error && <p role="alert">{error}</p>}

      {hasLoaded && (
        <>
          <p>Tổng số giao dịch: {transactions.length}</p>

          {transactions.length === 0 ? (
            <p>Chưa có giao dịch.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {deleteError && <p role="alert">{deleteError}</p>}
              {deleteSuccess && <p role="status">{deleteSuccess}</p>}
              <table>
                <thead>
                  <tr>
                    <th>Tên giao dịch</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.title}</td>
                      <td>
                        {transaction.transactionType === "INCOME"
                          ? "Thu nhập"
                          : "Chi tiêu"}
                      </td>
                      <td>{moneyFormatter.format(transaction.amount)}</td>
                      <td>{transaction.transactionDate}</td>
                      <td>{transaction.note ?? "—"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setEditingTransaction(transaction)}
                          disabled={saving || deletingId !== null || loading}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(transaction)}
                          disabled={saving || deletingId !== null || loading}
                        >
                          {deletingId === transaction.id
                            ? "Đang xóa..."
                            : "Xóa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default App;
