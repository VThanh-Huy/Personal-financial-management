import TransactionForm from "./components/TransactionForm";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import AuthGate from "./components/AuthGate";
import WalletForm from "./components/WalletForm";
import CategoryForm from "./components/CategoryForm";
import WalletBalances from "./components/WalletBalances";
import TransactionSummary from "./components/TransactionSummary";
import WalletManagement from "./components/WalletManagement";
import CategoryManagement from "./components/CategoryManagement";
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
  const [balanceVersion, setBalanceVersion] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [walletManaging, setWalletManaging] = useState(false);
  const [categoryManaging, setCategoryManaging] = useState(false);
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
  const transactionFormRef = useRef(null);
  const latestRequestId = useRef(0);

  useEffect(() => {
    if (!editingTransaction) return;
    transactionFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    transactionFormRef.current?.focus({ preventScroll: true });
  }, [editingTransaction]);

  function startEditing(transaction) {
    if (
      saving ||
      walletSaving ||
      categorySaving ||
      loading ||
      deletingId !== null
    )
      return;
    setDeleteError("");
    setDeleteSuccess("");
    setActiveTab("transactions");
    setEditingTransaction({ ...transaction });
  }

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
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.message || `Không thể tải dữ liệu (HTTP ${response.status}).`,
        );
      }
      if (
        !Array.isArray(data) ||
        !data.every(
          (item) =>
            item &&
            Number.isSafeInteger(item.id) &&
            typeof item.title === "string" &&
            Number.isSafeInteger(item.amount) &&
            item.amount > 0 &&
            ["INCOME", "EXPENSE"].includes(item.transactionType) &&
            typeof item.transactionDate === "string" &&
            (item.note == null || typeof item.note === "string"),
        )
      ) {
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
    if (
      loading ||
      saving ||
      walletSaving ||
      categorySaving ||
      deletingId !== null
    )
      return;
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
      setBalanceVersion((version) => version + 1);
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
    setDeleteError("");
    setDeleteSuccess("Đã lưu giao dịch.");
    setBalanceVersion((version) => version + 1);
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
  const navigationLocked =
    saving ||
    walletSaving ||
    categoryManaging ||
    categorySaving ||
    walletManaging ||
    deletingId !== null;
  return (
    <main>
      <header className="page-heading">
        <h1>Quản lý tài chính cá nhân</h1>
        <p>Ghi chép thu chi và theo dõi các giao dịch của bạn.</p>
      </header>
      <nav className="finance-navigation" aria-label="Các mục quản lý">
        <button
          type="button"
          className={activeTab === "overview" ? "is-active" : ""}
          aria-pressed={activeTab === "overview"}
          aria-controls="overview-section"
          onClick={() => setActiveTab("overview")}
          disabled={navigationLocked}
        >
          Tổng quan
        </button>
        <button
          type="button"
          className={activeTab === "transactions" ? "is-active" : ""}
          aria-pressed={activeTab === "transactions"}
          aria-controls="transactions-section"
          onClick={() => {
            setActiveTab("transactions");
            if (!hasLoaded && !loading) loadTransactions();
          }}
          disabled={navigationLocked}
        >
          Giao dịch
        </button>
        <button
          type="button"
          className={activeTab === "settings" ? "is-active" : ""}
          aria-pressed={activeTab === "settings"}
          aria-controls="settings-section"
          onClick={() => setActiveTab("settings")}
          disabled={navigationLocked}
        >
          Ví và danh mục
        </button>
      </nav>
      <div id="overview-section" hidden={activeTab !== "overview"}>
        <WalletBalances
          refreshVersion={balanceVersion}
          onSessionExpired={onSessionExpired}
        />
      </div>
      <div id="settings-section" hidden={activeTab !== "settings"}>
        <WalletForm
          csrfToken={csrfToken}
          onSessionExpired={onSessionExpired}
          saving={walletSaving}
          onSavingChange={setWalletSaving}
          disabled={
            saving ||
            categorySaving ||
            categoryManaging ||
            walletManaging ||
            loading ||
            deletingId !== null
          }
          onCreated={() => {
            setOptionsVersion((version) => version + 1);
            setBalanceVersion((version) => version + 1);
          }}
        />
        <WalletManagement
          csrfToken={csrfToken}
          onSessionExpired={onSessionExpired}
          refreshVersion={optionsVersion}
          saving={walletManaging}
          onSavingChange={setWalletManaging}
          disabled={
            saving ||
            walletSaving ||
            categoryManaging ||
            categorySaving ||
            loading ||
            deletingId !== null
          }
          onChanged={() => {
            setOptionsVersion((version) => version + 1);
            setBalanceVersion((version) => version + 1);
          }}
        />
        <CategoryForm
          csrfToken={csrfToken}
          onSessionExpired={onSessionExpired}
          saving={categorySaving}
          onSavingChange={setCategorySaving}
          disabled={
            saving ||
            walletSaving ||
            categoryManaging ||
            walletManaging ||
            loading ||
            deletingId !== null
          }
          onCreated={() => setOptionsVersion((version) => version + 1)}
        />
        <CategoryManagement
          csrfToken={csrfToken}
          onSessionExpired={onSessionExpired}
          refreshVersion={optionsVersion}
          saving={categoryManaging}
          onSavingChange={setCategoryManaging}
          disabled={
            saving ||
            walletSaving ||
            categorySaving ||
            walletManaging ||
            loading ||
            deletingId !== null
          }
          onChanged={() => {
            setOptionsVersion((version) => version + 1);
          }}
        />
      </div>
      <div id="transactions-section" hidden={activeTab !== "transactions"}>
        <div
          ref={transactionFormRef}
          tabIndex={-1}
          aria-label="Form thêm hoặc sửa giao dịch"
          style={{ scrollMarginTop: "20px" }}
        >
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
            disabled={
              walletSaving ||
              categoryManaging ||
              categorySaving ||
              walletManaging ||
              loading ||
              deletingId !== null
            }
          />
        </div>
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
          {loading && <p role="status">Đang tải danh sách giao dịch...</p>}
          {error && <p role="alert">{error}</p>}
          {deleteError && <p role="alert">{deleteError}</p>}
          {deleteSuccess && <p role="status">{deleteSuccess}</p>}
          {!hasLoaded && !loading && !error && (
            <p className="empty-state">
              Nhấn “Tải lại danh sách” để xem các giao dịch.
            </p>
          )}
          {hasLoaded && !loading && !error && (
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
              {!loading && !error && (
                <TransactionSummary transactions={transactions} />
              )}
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
                        const isIncome =
                          transaction.transactionType === "INCOME";
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
                                  onClick={() => startEditing(transaction)}
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
      </div>
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
