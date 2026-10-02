import { useState } from "react";

export default function WalletForm({
  csrfToken,
  onSessionExpired,
  onCreated,
  disabled = false,
  saving,
  onSavingChange,
}) {
  const [name, setName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || disabled) return;

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const balance = Number(openingBalance);

    if (!trimmedName || trimmedName.length > 100) {
      setError("Tên ví phải có từ 1 đến 100 ký tự.");
      return;
    }

    if (
      !openingBalance.trim() ||
      !Number.isSafeInteger(balance) ||
      Math.abs(balance) > 999999999999999
    ) {
      setError("Số dư ban đầu phải là số nguyên, tối đa 15 chữ số.");
      return;
    }

    onSavingChange(true);

    try {
      const response = await fetch("/backend/api/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          name: trimmedName,
          openingBalance: balance,
        }),
      });

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || `Không thể tạo ví (HTTP ${response.status}).`,
        );
      }

      setName("");
      setOpeningBalance("0");
      setSuccess(`Đã tạo ví "${trimmedName}".`);

      // Báo cho form giao dịch tải lại danh sách ví.
      onCreated();
    } catch (err) {
      setError(
        `${err.message} Nếu mất kết nối, hãy tải lại trang để kiểm tra trước khi tạo lại.`,
      );
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <section className="wallet-panel" aria-labelledby="wallet-heading">
      <h2 id="wallet-heading">Tạo ví</h2>
      <p className="wallet-description">
        Thêm nơi bạn giữ tiền, chẳng hạn tiền mặt hoặc tài khoản ngân hàng.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={saving || disabled}>
          <legend className="visually-hidden">Thông tin ví mới</legend>

          <label>
            Tên ví
            <input
              name="walletName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="Ví dụ: Tiền mặt"
              required
            />
          </label>

          <label>
            Số dư ban đầu (VNĐ)
            <input
              type="number"
              name="openingBalance"
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
              min="-999999999999999"
              max="999999999999999"
              step="1"
              aria-describedby="opening-balance-hint"
              required
            />
          </label>

          <button type="submit">
            {saving ? "Đang tạo..." : "Tạo ví"}
          </button>
        </fieldset>

        <p id="opening-balance-hint" className="wallet-description">
          Đây là số tiền ví có trước khi bạn bắt đầu ghi chép giao dịch.
        </p>
      </form>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </section>
  );
}