import TransactionForm from "./components/TransactionForm";
import { useRef, useState } from "react";
import "./App.css";
import AuthGate from "./components/AuthGate";
import WalletForm from "./components/WalletForm";
import CategoryForm from "./components/CategoryForm";
const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

function FinanceApp({ csrfToken, onSessionExpired }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [walletSaving, setWalletSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [optionsVersion, setOptionsVersion] = useState(0);
  const [filters, setFilters] = useState({
    type: "",
    fromDate: "",
    toDate: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    type: "",
    fromDate: "",
    toDate: "",
  });
  const latestRequestId = useRef(0);

  async function loadTransactions(selectedFilters = appliedFilters) {
    const requestId = ++latestRequestId.current;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (selectedFilters.type) {
        params.set("type", selectedFilters.type);
      }

      if (selectedFilters.fromDate) {
        params.set("fromDate", selectedFilters.fromDate);
      }

      if (selectedFilters.toDate) {
        params.set("toDate", selectedFilters.toDate);
      }

      const query = params.toString();

      const url = query
        ? `/backend/api/transactions?${query}`
        : "/backend/api/transactions";

      const response = await fetch(url);
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Không thể tải dữ liệu (HTTP ${response.status}).`,
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu trả về không đúng định dạng danh sách.");
      }

      if (requestId !== latestRequestId.current) return;

      setTransactions(data);
      setAppliedFilters({ ...selectedFilters });
      setHasLoaded(true);
    } catch (err) {
      if (requestId === latestRequestId.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
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
        {
          method: "DELETE",
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        },
      );

      if (response.status === 401) {
        onSessionExpired();
        setDeletingId(null);
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || `Không thể xóa giao dịch (HTTP ${response.status}).`,
        );
      }

      setDeleteSuccess(`Đã xóa giao dịch "${transaction.title}".`);

      if (editingTransaction?.id === transaction.id) {
        setEditingTransaction(null);
      }
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

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleFilterSubmit(event) {
    event.preventDefault();

    if (
      filters.fromDate &&
      filters.toDate &&
      filters.fromDate > filters.toDate
    ) {
      setError("Ngày bắt đầu không được sau ngày kết thúc.");
      return;
    }

    await loadTransactions(filters);
  }

  async function resetFilters() {
    const emptyFilters = {
      type: "",
      fromDate: "",
      toDate: "",
    };

    setFilters(emptyFilters);
    await loadTransactions(emptyFilters);
  }
  return (
    <main>
      <header className="page-heading">
        <h1>Quản lý tài chính cá nhân</h1>
        <p>Ghi chép thu chi và theo dõi các giao dịch của bạn.</p>
      </header>

      <WalletForm
        csrfToken={csrfToken}
        onSessionExpired={onSessionExpired}
        saving={walletSaving}
        onSavingChange={setWalletSaving}
        disabled={saving || categorySaving || loading || deletingId !== null}
        onCreated={() => setOptionsVersion((version) => version + 1)}
      />

      <CategoryForm
        csrfToken={csrfToken}
        onSessionExpired={onSessionExpired}
        saving={categorySaving}
        onSavingChange={setCategorySaving}
        disabled={saving || walletSaving || loading || deletingId !== null}
        onCreated={() => setOptionsVersion((version) => version + 1)}
      />

      <TransactionForm
        key={editingTransaction?.id ?? "new"}
        transaction={editingTransaction}
        saving={saving}
        onSavingChange={setSaving}
        onCreated={handleTransactionSaved}
        onCancel={() => setEditingTransaction(null)}
        csrfToken={csrfToken}
        onSessionExpired={onSessionExpired}
        optionsVersion={optionsVersion}
        disabled={walletSaving || categorySaving}
      />

      <section
        className="transactions-panel"
        aria-labelledby="transactions-heading"
      >
        <h2 id="transactions-heading">Danh sách giao dịch</h2>

        <form className="transaction-filters" onSubmit={handleFilterSubmit}>
          <fieldset disabled={loading || saving || deletingId !== null}>
            <legend>Lọc giao dịch</legend>

            <label>
              Loại giao dịch
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả</option>
                <option value="INCOME">Thu nhập</option>
                <option value="EXPENSE">Chi tiêu</option>
              </select>
            </label>

            <label>
              Từ ngày
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleFilterChange}
                min="1000-01-01"
                max="9999-12-31"
              />
            </label>

            <label>
              Đến ngày
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleFilterChange}
                min="1000-01-01"
                max="9999-12-31"
              />
            </label>

            <div className="filter-actions">
              <button type="submit">Áp dụng</button>
              <button type="button" onClick={resetFilters}>
                Bỏ lọc
              </button>
            </div>
          </fieldset>
        </form>

        <button
          className="button-secondary"
          type="button"
          onClick={() => loadTransactions()}
          disabled={loading || saving || deletingId !== null}
        >
          {loading ? "Đang tải..." : "Tải lại danh sách"}
        </button>

        {error && <p role="alert">{error}</p>}
        {deleteError && <p role="alert">{deleteError}</p>}
        {deleteSuccess && <p role="status">{deleteSuccess}</p>}

        {!hasLoaded && !loading && (
          <p className="empty-state">
            Nhấn “Tải lại danh sách” để xem các giao dịch.
          </p>
        )}

        {hasLoaded && (
          <>
            <p className="results-count">
              {transactions.length} giao dịch trong kết quả
            </p>

            <p className="filter-summary">
              Bộ lọc đã áp dụng:{" "}
              {appliedFilters.type === "INCOME"
                ? "Thu nhập"
                : appliedFilters.type === "EXPENSE"
                  ? "Chi tiêu"
                  : "Tất cả loại"}
              {" · Từ: "}
              {appliedFilters.fromDate || "Không giới hạn"}
              {" · Đến: "}
              {appliedFilters.toDate || "Không giới hạn"}
            </p>

            {transactions.length === 0 ? (
              <p className="empty-state">
                Không có giao dịch phù hợp với bộ lọc.
              </p>
            ) : (
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Bảng giao dịch, có thể cuộn ngang"
                aria-busy={loading}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Tên giao dịch</th>
                      <th scope="col">Loại</th>
                      <th scope="col" className="amount-cell">
                        Số tiền
                      </th>
                      <th scope="col">Ngày</th>
                      <th scope="col">Ghi chú</th>
                      <th scope="col">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => {
                      const isIncome = transaction.transactionType === "INCOME";

                      return (
                        <tr key={transaction.id}>
                          <td className="transaction-title">
                            {transaction.title}
                          </td>

                          <td>
                            <span
                              className={`type-badge ${
                                isIncome ? "income" : "expense"
                              }`}
                            >
                              {isIncome ? "Thu nhập" : "Chi tiêu"}
                            </span>
                          </td>

                          <td
                            className={`amount-cell ${
                              isIncome ? "amount-income" : "amount-expense"
                            }`}
                          >
                            {moneyFormatter.format(transaction.amount)}
                          </td>

                          <td>{transaction.transactionDate}</td>

                          <td className="transaction-note">
                            {transaction.note || "—"}
                          </td>

                          <td>
                            <div className="row-actions">
                              <button
                                className="button-secondary"
                                type="button"
                                onClick={() =>
                                  setEditingTransaction(transaction)
                                }
                                disabled={
                                  saving || deletingId !== null || loading
                                }
                                aria-label={`Sửa ${transaction.title}`}
                              >
                                Sửa
                              </button>

                              <button
                                className="button-danger"
                                type="button"
                                onClick={() => deleteTransaction(transaction)}
                                disabled={
                                  saving || deletingId !== null || loading
                                }
                                aria-label={`Xóa ${transaction.title}`}
                              >
                                {deletingId === transaction.id
                                  ? "Đang xóa..."
                                  : "Xóa"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function App() {
  return (
    <AuthGate>
      {({ user, csrfToken, onSessionExpired }) => (
        <FinanceApp
          key={user.id}
          csrfToken={csrfToken}
          onSessionExpired={onSessionExpired}
        />
      )}
    </AuthGate>
  );
}

export default App;
