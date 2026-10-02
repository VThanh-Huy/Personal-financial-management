import { useEffect, useState } from "react";

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function formatMoney(value) {
  return moneyFormatter.format(BigInt(value));
}

export default function WalletBalances({
  refreshVersion,
  onSessionExpired,
}) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBalances() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/backend/api/wallet-balances", {
          signal: controller.signal,
        });

        if (response.status === 401) {
          onSessionExpired();
          return;
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Không thể tải số dư ví (HTTP ${response.status}).`,
          );
        }

        const moneyFields = [
          "openingBalance",
          "totalIncome",
          "totalExpense",
          "balance",
        ];

        const validData =
          Array.isArray(data) &&
          data.every(
            (wallet) =>
              wallet &&
              typeof wallet.name === "string" &&
              moneyFields.every(
                (field) =>
                  typeof wallet[field] === "string" &&
                  /^-?\d+$/.test(wallet[field]),
              ),
          );

        if (!validData) {
          throw new Error("Dữ liệu số dư ví không đúng định dạng.");
        }

        if (!controller.signal.aborted) {
          setWallets(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBalances();

    return () => controller.abort();
  }, [refreshVersion, retryVersion, onSessionExpired]);

  return (
    <section
      className="wallet-overview"
      aria-labelledby="wallet-overview-heading"
      aria-busy={loading}
    >
      <div className="wallet-overview-heading">
        <div>
          <h2 id="wallet-overview-heading">Ví của bạn</h2>
          <p>
            Số dư theo toàn bộ giao dịch đã ghi nhận, không phụ thuộc
            bộ lọc bên dưới.
          </p>
        </div>

        <button
          type="button"
          className="button-secondary"
          onClick={() => setRetryVersion((version) => version + 1)}
          disabled={loading}
        >
          {loading ? "Đang cập nhật..." : "Tải lại số dư"}
        </button>
      </div>

      {loading ? (
        <p role="status">Đang tải số dư ví...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : wallets.length === 0 ? (
        <p className="empty-state">
          Bạn chưa có ví đang hoạt động. Hãy tạo ví ở bên dưới.
        </p>
      ) : (
        <div className="wallet-grid">
          {wallets.map((wallet) => (
            <article className="wallet-card" key={wallet.id}>
              <h3>{wallet.name}</h3>
              <p className="wallet-balance-label">Số dư</p>

              <p
                className={`wallet-balance ${
                  BigInt(wallet.balance) < 0 ? "wallet-balance-negative" : ""
                }`}
              >
                {formatMoney(wallet.balance)}
              </p>

              <dl className="wallet-details">
                <div>
                  <dt>Ban đầu</dt>
                  <dd>{formatMoney(wallet.openingBalance)}</dd>
                </div>

                <div>
                  <dt>Tổng thu</dt>
                  <dd className="amount-income">
                    {formatMoney(wallet.totalIncome)}
                  </dd>
                </div>

                <div>
                  <dt>Tổng chi</dt>
                  <dd className="amount-expense">
                    {formatMoney(wallet.totalExpense)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}