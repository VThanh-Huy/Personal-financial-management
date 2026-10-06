import { useEffect, useRef, useState } from "react";

export default function WalletManagement({
  csrfToken,
  onSessionExpired,
  refreshVersion,
  onChanged,
  saving,
  onSavingChange,
  disabled = false,
}) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [changingId, setChangingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWallets() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/backend/api/wallet-management", {
          signal: controller.signal,
        });

        if (response.status === 401) {
          onSessionExpired();
          return;
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Không thể tải danh sách ví.");
        }

        const valid =
          Array.isArray(data) &&
          data.every(
            (wallet) =>
              wallet &&
              Number.isSafeInteger(wallet.id) &&
              typeof wallet.name === "string" &&
              typeof wallet.archived === "boolean",
          );

        if (!valid) {
          throw new Error("Danh sách ví không đúng định dạng.");
        }

        if (!controller.signal.aborted) {
          setWallets(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadWallets();

    return () => controller.abort();
  }, [refreshVersion, reloadVersion, onSessionExpired]);

  async function changeArchiveStatus(wallet) {
    if (submitting.current || saving || disabled || loading) return;

    const archived = !wallet.archived;

    const confirmed = window.confirm(
      archived
        ? `Lưu trữ ví "${wallet.name}"? Ví sẽ ẩn khỏi Tổng quan và lựa chọn giao dịch. Lịch sử giao dịch vẫn được giữ.`
        : `Khôi phục ví "${wallet.name}" để sử dụng lại?`,
    );

    if (!confirmed) return;

    submitting.current = true;
    setChangingId(wallet.id);
    onSavingChange(true);
    setActionError("");
    setMessage("");

    try {
      const response = await fetch("/backend/api/wallet-management", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          walletId: wallet.id,
          archived,
        }),
      });

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || `Không thể cập nhật ví (HTTP ${response.status}).`,
        );
      }

      setMessage(
        archived
          ? `Đã lưu trữ ví "${wallet.name}".`
          : `Đã khôi phục ví "${wallet.name}".`,
      );

      // Tải lại danh sách quản lý sau khi backend xác nhận thành công.
      setReloadVersion((version) => version + 1);

      try {
        await onChanged();
      } catch {
        setMessage(
          "Đã cập nhật trạng thái ví. Hãy tải lại trang để đồng bộ các khu vực khác.",
        );
      }
    } catch (err) {
      setActionError(
        `${err.message} Nếu mất kết nối, hãy tải lại trang để kiểm tra trạng thái trước khi thử lại.`,
      );
    } finally {
      submitting.current = false;
      setChangingId(null);
      onSavingChange(false);
    }
  }
  async function deleteWallet(wallet) {
    if (submitting.current || saving || disabled || loading) return;

    const confirmed = window.confirm(
      `Xóa vĩnh viễn ví "${wallet.name}"?\n\n` +
        "Số dư ban đầu của ví cũng sẽ bị xóa. " +
        "Thao tác này không thể hoàn tác trên giao diện.\n\n" +
        "Nếu ví còn giao dịch, hệ thống sẽ từ chối xóa.",
    );

    if (!confirmed) return;

    submitting.current = true;
    setDeletingId(wallet.id);
    onSavingChange(true);
    setActionError("");
    setMessage("");

    try {
      const response = await fetch(
        `/backend/api/wallet-management?id=${encodeURIComponent(wallet.id)}`,
        {
          method: "DELETE",
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        },
      );

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || `Không thể xóa ví (HTTP ${response.status}).`,
        );
      }

      // Thành công trả HTTP 204, không cần đọc JSON.
      setWallets((previous) =>
        previous.filter((item) => item.id !== wallet.id),
      );

      setMessage(`Đã xóa ví "${wallet.name}".`);

      try {
        await onChanged();
      } catch {
        setMessage(
          "Đã xóa ví. Hãy tải lại trang để đồng bộ danh sách và số dư.",
        );
      }
    } catch (err) {
      setActionError(
        `${err.message} Nếu mất kết nối, hãy tải lại danh sách để kiểm tra trước khi thử lại.`,
      );
    } finally {
      submitting.current = false;
      setDeletingId(null);
      onSavingChange(false);
    }
  }

  return (
    <section
      className="wallet-management"
      aria-labelledby="wallet-management-heading"
    >
      <div className="wallet-management-heading">
        <div>
          <h2 id="wallet-management-heading">Danh sách ví</h2>
          <p>Lưu trữ ví không còn sử dụng hoặc khôi phục khi cần.</p>
        </div>

        <button
          type="button"
          className="button-secondary"
          onClick={() => setReloadVersion((version) => version + 1)}
          disabled={loading || saving || disabled}
        >
          Tải lại
        </button>
      </div>

      {actionError && <p role="alert">{actionError}</p>}
      {message && <p role="status">{message}</p>}

      {loading ? (
        <p role="status">Đang tải danh sách ví...</p>
      ) : loadError ? (
        <p role="alert">{loadError}</p>
      ) : wallets.length === 0 ? (
        <p className="empty-state">
          Bạn chưa có ví. Hãy tạo ví bằng form phía trên.
        </p>
      ) : (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Danh sách quản lý ví, có thể cuộn ngang"
        >
          <table className="wallet-management-table">
            <thead>
              <tr>
                <th scope="col">Tên ví</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {wallets.map((wallet) => (
                <tr key={wallet.id}>
                  <td className="wallet-name">{wallet.name}</td>

                  <td>
                    <span
                      className={`wallet-status ${
                        wallet.archived ? "is-archived" : "is-active"
                      }`}
                    >
                      {wallet.archived ? "Đã lưu trữ" : "Đang hoạt động"}
                    </span>
                  </td>

                  <td>
                    <div className="wallet-management-actions">
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => changeArchiveStatus(wallet)}
                        disabled={saving || disabled || loading}
                        aria-label={`${
                          wallet.archived ? "Khôi phục" : "Lưu trữ"
                        } ví ${wallet.name}`}
                      >
                        {changingId === wallet.id
                          ? "Đang cập nhật..."
                          : wallet.archived
                            ? "Khôi phục"
                            : "Lưu trữ"}
                      </button>

                      <button
                        type="button"
                        className="button-danger"
                        onClick={() => deleteWallet(wallet)}
                        disabled={saving || disabled || loading}
                        aria-label={`Xóa ví ${wallet.name}`}
                      >
                        {deletingId === wallet.id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
