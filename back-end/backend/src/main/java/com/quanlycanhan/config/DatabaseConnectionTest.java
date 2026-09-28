package com.quanlycanhan.config;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class DatabaseConnectionTest {

    public static void main(String[] args) throws SQLException {
        String url = "jdbc:mysql://localhost:3306/quan_ly_ca_nhan";
        String username = "qlcn_app";
        String password = System.getenv("DB_PASSWORD");

        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "Chưa thiết lập biến môi trường DB_PASSWORD"
            );
        }

        String sql = """
                SELECT id, title, transaction_type,
                       amount, transaction_date, note
                FROM transactions
                ORDER BY transaction_date DESC, id DESC
                """;

        try (
                Connection connection =
                        DatabaseConnection.getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql);
                ResultSet result = statement.executeQuery()
        ) {
            int count = 0;

            while (result.next()) {
                System.out.println("--------------------");
                System.out.println("Mã: " + result.getLong("id"));
                System.out.println("Tên: " + result.getString("title"));
                System.out.println(
                        "Loại: " + result.getString("transaction_type")
                );
                System.out.println(
                        "Số tiền: " + result.getBigDecimal("amount") + " VND"
                );
                System.out.println(
                        "Ngày: " + result.getDate("transaction_date")
                );

                String note = result.getString("note");
                System.out.println(
                        "Ghi chú: " + (note == null ? "Không có" : note)
                );

                count++;
            }

            System.out.println("Tổng số giao dịch: " + count);
        }
    }
}