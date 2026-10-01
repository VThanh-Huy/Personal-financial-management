package com.quanlycanhan.dao;

import com.quanlycanhan.config.DatabaseConnection;
import com.quanlycanhan.model.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Optional;

public class UserDAO {

    public long insert(
            String fullName,
            String email,
            String passwordHash
    ) throws SQLException {

        String sql = """
                INSERT INTO users (full_name, email, password_hash)
                VALUES (?, ?, ?)
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
            statement.setString(1, fullName);
            statement.setString(2, email);
            statement.setString(3, passwordHash);

            int affectedRows = statement.executeUpdate();

            if (affectedRows != 1) {
                throw new SQLException("Không thể tạo tài khoản.");
            }

            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getLong(1);
                }

                throw new SQLException(
                        "Không lấy được mã tài khoản vừa tạo."
                );
            }
        }
    }

    public Optional<User> findByEmail(String email)
            throws SQLException {

        String sql = """
                SELECT id, full_name, email, password_hash
                FROM users
                WHERE email = ?
                """;

        try (
                Connection connection =
                        DatabaseConnection.getConnection();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setString(1, email);

            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    User user = new User(
                            result.getLong("id"),
                            result.getString("full_name"),
                            result.getString("email"),
                            result.getString("password_hash")
                    );

                    return Optional.of(user);
                }

                return Optional.empty();
            }
        }
    }
}