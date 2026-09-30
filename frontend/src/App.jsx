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

  return (
    <main>
      <h1>Quản lý tài chính cá nhân</h1>

      <TransactionForm onCreated={loadTransactions} />

      {/* Giữ nguyên nút tải danh sách và bảng hiện có bên dưới */}

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
              <table>
                <thead>
                  <tr>
                    <th>Tên giao dịch</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Ghi chú</th>
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
