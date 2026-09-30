package com.quanlycanhan.dao;

import com.quanlycanhan.config.DatabaseConnection;
import com.quanlycanhan.dto.WalletOption;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

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
}