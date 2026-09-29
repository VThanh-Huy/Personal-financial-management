package com.quanlycanhan.config;

import com.quanlycanhan.dao.TransactionDAO;
import com.quanlycanhan.model.Transaction;
import com.quanlycanhan.service.TransactionService;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

public class DatabaseConnectionTest {

    public static void main(String[] args) throws SQLException {
        TransactionService service = new TransactionService();

        // Theo dữ liệu mẫu hiện tại:
        // Người dùng 1, ví Tiền mặt 1, danh mục Ăn uống 2.
        long userId = 1L;
        long walletId = 1L;
        long categoryId = 2L;

        // Kiểm tra dữ liệu không hợp lệ.
        try {
            service.createTransaction(
                    userId,
                    walletId,
                    categoryId,
                    "Giao dich thu nghiem khong hop le",
                    "EXPENSE",
                    new BigDecimal("-10000"),
                    LocalDate.of(2026, 9, 29),
                    null
            );

            throw new IllegalStateException(
                    "Kiểm tra thất bại: số tiền âm đã được chấp nhận!"
            );
        } catch (IllegalArgumentException e) {
            System.out.println("Đã từ chối dữ liệu sai: " + e.getMessage());
        }

        // Kiểm tra dữ liệu hợp lệ: thao tác này thực sự ghi vào MySQL.
        long newId = service.createTransaction(
                userId,
                walletId,
                categoryId,
                "An trua",
                "EXPENSE",
                new BigDecimal("45000"),
                LocalDate.of(2026, 9, 29),
                "Du lieu thu nghiem"
        );

        System.out.println("Đã thêm giao dịch, ID: " + newId);

        // Đọc lại từ MySQL để kiểm tra dữ liệu đã được lưu.
        TransactionDAO dao = new TransactionDAO();
        List<Transaction> transactions = dao.findByUserId(userId);

        Transaction savedTransaction = transactions.stream()
                .filter(transaction -> transaction.getId() == newId)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Không tìm thấy giao dịch vừa thêm."
                ));

        System.out.println("Tên: " + savedTransaction.getTitle());
        System.out.println("Số tiền: " + savedTransaction.getAmount());
        System.out.println("Tổng số giao dịch: " + transactions.size());
    }
}