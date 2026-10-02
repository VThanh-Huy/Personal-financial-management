package com.quanlycanhan.dao;

import com.quanlycanhan.config.DatabaseConnection;
import com.quanlycanhan.dto.WalletOption;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;
import java.sql.Statement;
import com.quanlycanhan.dto.WalletBalanceResponse;

public class WalletDAO {

    public List<WalletOption> findActiveByUserId(long userId)
            throws SQLException {

        String sql = """
                SELECT id, name
                FROM wallets
                WHERE user_id = ?
                  AND is_archived = FALSE
                ORDER BY name, id
                """;

        List<WalletOption> wallets = new ArrayList<>();

        try (
                Connection connection =
                        DatabaseConnection.getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setLong(1, userId);

            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    wallets.add(new WalletOption(
                            result.getLong("id"),
                            result.getString("name")
                    ));
                }
            }
        }

        return wallets;
    }

    public long insert(
            long userId,
            String name,
            BigDecimal openingBalance
    ) throws SQLException {

        String sql = """
            INSERT INTO wallets (user_id, name, opening_balance)
            VALUES (?, ?, ?)
            """;

        try (
                Connection connection = DatabaseConnection.getConnection();
                PreparedStatement statement = connection.prepareStatement(
                        sql,
                        Statement.RETURN_GENERATED_KEYS
                )
        ) {
            statement.setLong(1, userId);
            statement.setString(2, name);
            statement.setBigDecimal(3, openingBalance);

            if (statement.executeUpdate() != 1) {
                throw new SQLException("Không thể thêm ví.");
            }

            try (ResultSet result = statement.getGeneratedKeys()) {
                if (result.next()) {
                    return result.getLong(1);
                }
            }

            throw new SQLException("Không lấy được ID ví vừa tạo.");
        }
    }
    public List<WalletBalanceResponse> findBalancesByUserId(long userId)
            throws SQLException {

        String sql = """
            SELECT
                w.id,
                w.name,
                w.opening_balance,
                COALESCE(SUM(
                    CASE
                        WHEN t.transaction_type = 'INCOME'
                        THEN t.amount
                        ELSE 0
                    END
                ), 0) AS total_income,
                COALESCE(SUM(
                    CASE
                        WHEN t.transaction_type = 'EXPENSE'
                        THEN t.amount
                        ELSE 0
                    END
                ), 0) AS total_expense
            FROM wallets w
            LEFT JOIN transactions t
                ON t.wallet_id = w.id
                AND t.user_id = w.user_id
            WHERE w.user_id = ?
                AND w.is_archived = FALSE
            GROUP BY w.id, w.name, w.opening_balance
            ORDER BY w.name, w.id
            """;

        List<WalletBalanceResponse> wallets = new ArrayList<>();

        try (
                Connection connection = DatabaseConnection.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, userId);

            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    BigDecimal openingBalance =
                            result.getBigDecimal("opening_balance");

                    BigDecimal totalIncome =
                            result.getBigDecimal("total_income");

                    BigDecimal totalExpense =
                            result.getBigDecimal("total_expense");

                    BigDecimal balance = openingBalance
                            .add(totalIncome)
                            .subtract(totalExpense);

                    wallets.add(new WalletBalanceResponse(
                            result.getLong("id"),
                            result.getString("name"),
                            openingBalance,
                            totalIncome,
                            totalExpense,
                            balance
                    ));
                }
            }
        }

        return wallets;
    }
}