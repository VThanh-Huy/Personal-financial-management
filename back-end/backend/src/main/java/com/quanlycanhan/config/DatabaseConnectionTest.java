package com.quanlycanhan.config;

import java.sql.Connection;
import java.sql.DriverManager;
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

        String sql = "SELECT DATABASE() AS db_name";

        try (
                Connection connection =
                        DriverManager.getConnection(url, username, password);
                PreparedStatement statement =
                        connection.prepareStatement(sql);
                ResultSet result = statement.executeQuery()
        ) {
            if (result.next()) {
                System.out.println("Kết nối MySQL thành công!");
                System.out.println(
                        "Cơ sở dữ liệu: " + result.getString("db_name")
                );
            }
        }
    }
}