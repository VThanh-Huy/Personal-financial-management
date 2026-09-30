package com.quanlycanhan.dao;

import com.quanlycanhan.config.DatabaseConnection;
import com.quanlycanhan.dto.CategoryOption;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CategoryDAO {

    public List<CategoryOption> findActiveByUserId(long userId)
            throws SQLException {

        String sql = """
                SELECT id, name, transaction_type
                FROM categories
                WHERE user_id = ?
                  AND is_archived = FALSE
                ORDER BY transaction_type, name, id
                """;

        List<CategoryOption> categories = new ArrayList<>();

        try (
                Connection connection =
                        DatabaseConnection.getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setLong(1, userId);

            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    categories.add(new CategoryOption(
                            result.getLong("id"),
                            result.getString("name"),
                            result.getString("transaction_type")
                    ));
                }
            }
        }

        return categories;
    }
}