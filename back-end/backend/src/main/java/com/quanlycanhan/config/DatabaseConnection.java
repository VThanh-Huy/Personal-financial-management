package com.quanlycanhan.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    private static final String URL =
            "jdbc:mysql://localhost:3306/quan_ly_ca_nhan";

    private static final String USERNAME = "qlcn_app";

    public static Connection getConnection() throws SQLException {
        String password = System.getenv("DB_PASSWORD");

        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "Chưa thiết lập biến môi trường DB_PASSWORD"
            );
        }

        return DriverManager.getConnection(URL, USERNAME, password);
    }
}