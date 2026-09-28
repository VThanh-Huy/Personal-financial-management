USE quan_ly_ca_nhan;

CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    amount DECIMAL(15, 0) NOT NULL,
    transaction_date DATE NOT NULL,
    note VARCHAR(500),

    CONSTRAINT chk_transaction_type
        CHECK (transaction_type IN ('INCOME', 'EXPENSE')),

    CONSTRAINT chk_amount_positive
        CHECK (amount > 0)
);