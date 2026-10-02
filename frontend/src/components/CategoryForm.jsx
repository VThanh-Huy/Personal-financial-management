import { useState } from "react";

export default function CategoryForm({
  csrfToken,
  onSessionExpired,
  onCreated,
  saving,
  onSavingChange,
  disabled = false,
}) {
  const [name, setName] = useState("");
  const [transactionType, setTransactionType] = useState("EXPENSE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || disabled) return;

    setError("");
    setSuccess("");

    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length > 100) {
      setError("Tên danh mục phải có từ 1 đến 100 ký tự.");
      return;
    }

    onSavingChange(true);

    try {
      const response = await fetch("/backend/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          name: trimmedName,
          transactionType,
        }),
      });

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Không thể tạo danh mục (HTTP ${response.status}).`,
        );
      }
    } catch (err) {
      setError(
        `${err.message} Nếu mất kết nối, hãy tải lại trang để kiểm tra trước khi tạo lại.`,
      );
      return;
    } finally {
      onSavingChange(false);
    }

    setName("");

    const typeLabel =
      transactionType === "INCOME" ? "thu nhập" : "chi tiêu";

    setSuccess(
      `Đã tạo danh mục "${trimmedName}" thuộc loại ${typeLabel}.`,
    );

    // Việc tạo đã thành công; cập nhật lựa chọn là thao tác riêng.
    try {
      await onCreated();
    } catch {
      setSuccess("Đã tạo danh mục. Hãy tải lại trang để cập nhật lựa chọn.");
    }
  }

  return (
    <section
      className="category-panel"
      aria-labelledby="category-heading"
    >
      <h2 id="category-heading">Tạo danh mục</h2>

      <p className="category-description">
        Phân nhóm giao dịch để biết tiền của bạn đến từ đâu và được chi
        cho việc gì.
      </p>

      <form onSubmit={handleSubmit} aria-busy={saving}>
        <fieldset disabled={saving || disabled}>
          <legend className="visually-hidden">
            Thông tin danh mục mới
          </legend>

          <label>
            Tên danh mục
            <input
              name="categoryName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder={
                transactionType === "INCOME"
                  ? "Ví dụ: Lương"
                  : "Ví dụ: Ăn uống"
              }
              required
            />
          </label>

          <label>
            Loại danh mục
            <select
              name="categoryType"
              value={transactionType}
              onChange={(event) =>
                setTransactionType(event.target.value)
              }
            >
              <option value="EXPENSE">Chi tiêu</option>
              <option value="INCOME">Thu nhập</option>
            </select>
          </label>

          <button type="submit">
            {saving ? "Đang tạo..." : "Tạo danh mục"}
          </button>
        </fieldset>
      </form>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </section>
  );
}