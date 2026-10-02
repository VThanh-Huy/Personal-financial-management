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
}