package com.quanlycanhan.dao;

import com.quanlycanhan.config.DatabaseConnection;
import com.quanlycanhan.model.Transaction;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TransactionDAO {

    public List<Transaction> findByUserId(long userId)
            throws SQLException {

        String sql = """
                SELECT id, user_id, wallet_id, category_id,
                       title, transaction_type, amount,
                       transaction_date, note, created_at
                FROM transactions
                WHERE user_id = ?
                ORDER BY transaction_date DESC, id DESC
                """;

        List<Transaction> transactions = new ArrayList<>();

        try (
                Connection connection =
                        DatabaseConnection.getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setLong(1, userId);

            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    Transaction transaction = new Transaction(
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
                    );

                    transactions.add(transaction);
                }
            }
        }

        return transactions;
    }
}