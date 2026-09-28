USE quan_ly_ca_nhan;

-- Tạm cho phép NULL vì hai giao dịch cũ chưa có các thông tin này.
ALTER TABLE transactions
    ADD COLUMN user_id BIGINT NULL,
    ADD COLUMN wallet_id BIGINT NULL,
    ADD COLUMN category_id BIGINT NULL,
    ADD COLUMN created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP;

-- Tài khoản chỉ dùng để gắn dữ liệu mẫu.
-- Đây KHÔNG phải mật khẩu hoặc mật khẩu đã băm hợp lệ.
-- Tài khoản này chưa dùng để đăng nhập.
INSERT INTO users (full_name, email, password_hash)
VALUES (
    'Nguoi dung mau',
    'demo@example.com',
    '!DISABLED_DEMO_ACCOUNT'
);

SET @demo_user_id = LAST_INSERT_ID();

-- Tạo ví chứa hai giao dịch mẫu.
INSERT INTO wallets (user_id, name, opening_balance)
VALUES (@demo_user_id, 'Tien mat', 0);

SET @demo_wallet_id = LAST_INSERT_ID();

-- Danh mục thu.
INSERT INTO categories (user_id, name, transaction_type)
VALUES (@demo_user_id, 'Luong', 'INCOME');

SET @income_category_id = LAST_INSERT_ID();

-- Danh mục chi.
INSERT INTO categories (user_id, name, transaction_type)
VALUES (@demo_user_id, 'An uong', 'EXPENSE');

SET @expense_category_id = LAST_INSERT_ID();

-- Gắn giao dịch lương đã có.
UPDATE transactions
SET user_id = @demo_user_id,
    wallet_id = @demo_wallet_id,
    category_id = @income_category_id
WHERE id = 1
  AND title = 'Luong lam them'
  AND transaction_type = 'INCOME';

-- Gắn giao dịch ăn sáng đã có.
UPDATE transactions
SET user_id = @demo_user_id,
    wallet_id = @demo_wallet_id,
    category_id = @expense_category_id
WHERE id = 2
  AND title = 'An sang'
  AND transaction_type = 'EXPENSE';

-- Kiểm tra còn giao dịch nào chưa được gắn đủ thông tin.
SELECT COUNT(*) AS unlinked_transactions
FROM transactions
WHERE user_id IS NULL
   OR wallet_id IS NULL
   OR category_id IS NULL;

ALTER TABLE transactions
    MODIFY COLUMN user_id BIGINT NOT NULL,
    MODIFY COLUMN wallet_id BIGINT NOT NULL,
    MODIFY COLUMN category_id BIGINT NOT NULL,

    ADD CONSTRAINT fk_transaction_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    ADD CONSTRAINT fk_transaction_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

    ADD CONSTRAINT fk_transaction_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    ADD INDEX idx_transaction_user_date
        (user_id, transaction_date, id),

    ADD INDEX idx_transaction_wallet_date
        (wallet_id, transaction_date),

    ADD INDEX idx_transaction_category_date
        (category_id, transaction_date);