package com.quanlycanhan.dao;

import com.quanlycanhan.config.DatabaseConnection;
import com.quanlycanhan.model.Transaction;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;
import java.sql.Statement;
import java.time.LocalDate;
public class TransactionDAO {

    public List<Transaction> findByUserId(long userId)
            throws SQLException {

        return findByUserId(userId, null, null, null);
    }
    public List<Transaction> findByUserId(
            long userId,
            String transactionType,
            LocalDate fromDate,
            LocalDate toDate
    ) throws SQLException {

        StringBuilder sql = new StringBuilder("""
            SELECT id, user_id, wallet_id, category_id,
                   title, transaction_type, amount,
                   transaction_date, note, created_at
            FROM transactions
            WHERE user_id = ?
            """);

        if (transactionType != null) {
            sql.append(" AND transaction_type = ?");
        }

        if (fromDate != null) {
            sql.append(" AND transaction_date >= ?");
        }

        if (toDate != null) {
            sql.append(" AND transaction_date <= ?");
        }

        sql.append(" ORDER BY transaction_date DESC, id DESC");

        List<Transaction> transactions = new ArrayList<>();

        try (
                Connection connection =
                        DatabaseConnection.getConnection();

                PreparedStatement statement =
                        connection.prepareStatement(sql.toString())
        ) {
            int parameterIndex = 1;

            statement.setLong(parameterIndex++, userId);

            if (transactionType != null) {
                statement.setString(parameterIndex++, transactionType);
            }

            if (fromDate != null) {
                statement.setDate(
                        parameterIndex++,
                        java.sql.Date.valueOf(fromDate)
                );
            }

            if (toDate != null) {
                statement.setDate(
                        parameterIndex++,
                        java.sql.Date.valueOf(toDate)
                );
            }

            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    transactions.add(new Transaction(
                            result.getLong("id"),
                            result.getLong("user_id"),
                            result.getLong("wallet_id"),
                            result.getLong("category_id"),
                            result.getString("title"),
                            result.getString("transaction_type"),
                            result.getBigDecimal("amount"),
                            result.getDate("transaction_date").toLocalDate(),
                            result.getString("note"),
                            result.getTimestamp("created_at").toLocalDateTime()
                    ));
                }
            }
        }

        return transactions;
    }
    public long insert(
            long userId,
            long walletId,
            long categoryId,
            String title,
            String transactionType,
            BigDecimal amount,
            LocalDate transactionDate,
            String note
    ) throws SQLException {

        String sql = """
            INSERT INTO transactions (
                user_id,
                wallet_id,
                category_id,
                title,
                transaction_type,
                amount,
                transaction_date,
                note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

        try (
                Connection connection =
                        DatabaseConnection.getConnection();

                PreparedStatement statement =
                        connection.prepareStatement(
                                sql,
                                Statement.RETURN_GENERATED_KEYS
                        )
        ) {
            statement.setLong(1, userId);
            statement.setLong(2, walletId);
            statement.setLong(3, categoryId);
            statement.setString(4, title);
            statement.setString(5, transactionType);
            statement.setBigDecimal(6, amount);
            statement.setDate(
                    7,
                    java.sql.Date.valueOf(transactionDate)
            );
            statement.setString(8, note);

            int affectedRows = statement.executeUpdate();

            if (affectedRows != 1) {
                throw new SQLException(
                        "Không thể thêm giao dịch."
                );
            }

            try (ResultSet generatedKeys = statement.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    return generatedKeys.getLong(1);
                }

                throw new SQLException(
                        "Không lấy được mã giao dịch vừa tạo."
                );
            }
        }
    }
    public boolean canUseWalletAndCategory(
            long userId,
            long walletId,
            long categoryId,
            String transactionType
    ) throws SQLException {

        String sql = """
            SELECT 1
            FROM wallets w
            JOIN categories c ON c.user_id = w.user_id
            WHERE w.id = ?
              AND c.id = ?
              AND w.user_id = ?
              AND c.transaction_type = ?
              AND w.is_archived = FALSE
              AND c.is_archived = FALSE
            """;

        try (
                Connection connection =
                        DatabaseConnection.getConnection();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setLong(1, walletId);
            statement.setLong(2, categoryId);
            statement.setLong(3, userId);
            statement.setString(4, transactionType);

            try (ResultSet result = statement.executeQuery()) {
                return result.next();
            }
        }
    }
    public boolean deleteByIdAndUserId(long id, long userId)
            throws SQLException {

        String sql = """
            DELETE FROM transactions
            WHERE id = ?
              AND user_id = ?
            """;

        try (
                Connection connection =
                        DatabaseConnection.getConnection();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setLong(1, id);
            statement.setLong(2, userId);

            return statement.executeUpdate() == 1;
        }
    }
    public boolean updateByIdAndUserId(
            long id,
            long userId,
            long walletId,
            long categoryId,
            String title,
            String transactionType,
            BigDecimal amount,
            LocalDate transactionDate,
            String note
    ) throws SQLException {

        String sql = """
            UPDATE transactions
            SET wallet_id = ?,
                category_id = ?,
                title = ?,
                transaction_type = ?,
                amount = ?,
                transaction_date = ?,
                note = ?
            WHERE id = ?
              AND user_id = ?
            """;

        try (
                Connection connection =
                        DatabaseConnection.getConnection();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setLong(1, walletId);
            statement.setLong(2, categoryId);
            statement.setString(3, title);
            statement.setString(4, transactionType);
            statement.setBigDecimal(5, amount);
            statement.setDate(
                    6,
                    java.sql.Date.valueOf(transactionDate)
            );
            statement.setString(7, note);
            statement.setLong(8, id);
            statement.setLong(9, userId);

            return statement.executeUpdate() == 1;
        }
    }
}