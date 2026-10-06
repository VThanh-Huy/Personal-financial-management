import { useEffect, useRef, useState } from "react";

export default function CategoryManagement({
  csrfToken,
  onSessionExpired,
  refreshVersion,
  onChanged,
  saving,
  onSavingChange,
  disabled = false,
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [changingId, setChangingId] = useState(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/backend/api/category-management", {
          signal: controller.signal,
        });

        if (response.status === 401) {
          onSessionExpired();
          return;
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || "Không thể tải danh sách danh mục.",
          );
        }

        const valid =
          Array.isArray(data) &&
          data.every(
            (category) =>
              category &&
              Number.isSafeInteger(category.id) &&
              typeof category.name === "string" &&
              ["INCOME", "EXPENSE"].includes(category.transactionType) &&
              typeof category.archived === "boolean",
          );

        if (!valid) {
          throw new Error("Danh sách danh mục không đúng định dạng.");
        }

        if (!controller.signal.aborted) {
          setCategories(data);
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

    loadCategories();

    return () => controller.abort();
  }, [refreshVersion, reloadVersion, onSessionExpired]);

  async function changeArchiveStatus(category) {
    if (submitting.current || saving || disabled || loading) return;

    const archived = !category.archived;

    const confirmed = window.confirm(
      archived
        ? `Lưu trữ danh mục "${category.name}"? Danh mục sẽ ẩn khỏi lựa chọn giao dịch, nhưng lịch sử vẫn được giữ.`
        : `Khôi phục danh mục "${category.name}" để sử dụng lại?`,
    );

    if (!confirmed) return;

    submitting.current = true;
    setChangingId(category.id);
    onSavingChange(true);
    setActionError("");
    setMessage("");

    try {
      const response = await fetch("/backend/api/category-management", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          categoryId: category.id,
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
          data?.message ||
            `Không thể cập nhật danh mục (HTTP ${response.status}).`,
        );
      }

      setMessage(
        archived
          ? `Đã lưu trữ danh mục "${category.name}".`
          : `Đã khôi phục danh mục "${category.name}".`,
      );

      // Cập nhật ngay trạng thái đã được backend xác nhận.
      setCategories((previous) =>
        previous.map((item) =>
          item.id === category.id ? { ...item, archived } : item,
        ),
      );

      try {
        await onChanged();
      } catch {
        setMessage(
          "Đã cập nhật danh mục. Hãy tải lại trang để đồng bộ các lựa chọn.",
        );
      }
    } catch (err) {
      setActionError(
        `${err.message} Nếu mất kết nối, hãy tải lại trang để kiểm tra trước khi thử lại.`,
      );
    } finally {
      submitting.current = false;
      setChangingId(null);
      onSavingChange(false);
    }
  }

  return (
    <section
      className="category-management"
      aria-labelledby="category-management-heading"
    >
      <div className="category-management-heading">
        <div>
          <h2 id="category-management-heading">Danh sách danh mục</h2>
          <p>
            Quản lý các nhóm thu nhập và chi tiêu của bạn.
          </p>
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
        <p role="status">Đang tải danh sách danh mục...</p>
      ) : loadError ? (
        <p role="alert">{loadError}</p>
      ) : categories.length === 0 ? (
        <p className="empty-state">
          Bạn chưa có danh mục. Hãy tạo danh mục bằng form phía trên.
        </p>
      ) : (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Danh sách quản lý danh mục, có thể cuộn ngang"
        >
          <table className="category-management-table">
            <thead>
              <tr>
                <th scope="col">Tên danh mục</th>
                <th scope="col">Loại</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="category-name">{category.name}</td>

                  <td>
                    <span
                      className={`type-badge ${
                        category.transactionType === "INCOME"
                          ? "income"
                          : "expense"
                      }`}
                    >
                      {category.transactionType === "INCOME"
                        ? "Thu nhập"
                        : "Chi tiêu"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`category-status ${
                        category.archived ? "is-archived" : "is-active"
                      }`}
                    >
                      {category.archived
                        ? "Đã lưu trữ"
                        : "Đang hoạt động"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => changeArchiveStatus(category)}
                      disabled={saving || disabled}
                      aria-label={`${
                        category.archived ? "Khôi phục" : "Lưu trữ"
                      } danh mục ${category.name}`}
                    >
                      {changingId === category.id
                        ? "Đang cập nhật..."
                        : category.archived
                          ? "Khôi phục"
                          : "Lưu trữ"}
                    </button>
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