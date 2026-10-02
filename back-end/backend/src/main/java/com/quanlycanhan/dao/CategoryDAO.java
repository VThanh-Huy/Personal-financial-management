package com.quanlycanhan.dao;

import com.quanlycanhan.config.DatabaseConnection;
import com.quanlycanhan.dto.CategoryOption;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.sql.Statement;
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
    public long insert(
            long userId,
            String name,
            String transactionType
    ) throws SQLException {

        String sql = """
            INSERT INTO categories (user_id, name, transaction_type)
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
            statement.setString(3, transactionType);

            if (statement.executeUpdate() != 1) {
                throw new SQLException("Không thể thêm danh mục.");
            }

            try (ResultSet result = statement.getGeneratedKeys()) {
                if (result.next()) {
                    return result.getLong(1);
                }
            }

            throw new SQLException("Không lấy được ID danh mục vừa tạo.");
        }
    }
}