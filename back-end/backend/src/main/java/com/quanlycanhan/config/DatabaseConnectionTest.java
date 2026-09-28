package com.quanlycanhan.config;

import com.quanlycanhan.dao.TransactionDAO;
import com.quanlycanhan.model.Transaction;

import java.sql.SQLException;
import java.util.List;

public class DatabaseConnectionTest {

    public static void main(String[] args) throws SQLException {
        // Thay bằng ID thực tế của người dùng mẫu nếu khác 1.
        long userId = 1L;

        TransactionDAO transactionDAO = new TransactionDAO();

        List<Transaction> transactions =
                transactionDAO.findByUserId(userId);

        for (Transaction transaction : transactions) {
            System.out.println("--------------------");
            System.out.println("Mã: " + transaction.getId());
            System.out.println("Tên: " + transaction.getTitle());
            System.out.println(
                    "Số tiền: " + transaction.getAmount() + " VND"
            );
            System.out.println(
                    "Ngày: " + transaction.getTransactionDate()
            );
        }

        System.out.println(
                "Tổng số giao dịch: " + transactions.size()
        );
    }
}