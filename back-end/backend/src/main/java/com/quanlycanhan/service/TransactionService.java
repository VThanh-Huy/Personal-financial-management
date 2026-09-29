package com.quanlycanhan.service;

import com.quanlycanhan.dao.TransactionDAO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.time.LocalDate;

public class TransactionService {

    private static final BigDecimal MAX_AMOUNT =
            new BigDecimal("999999999999999");

    private final TransactionDAO transactionDAO = new TransactionDAO();

    public long createTransaction(
            long userId,
            long walletId,
            long categoryId,
            String title,
            String transactionType,
            BigDecimal amount,
            LocalDate transactionDate,
            String note
    ) throws SQLException {

        if (userId <= 0 || walletId <= 0 || categoryId <= 0) {
            throw new IllegalArgumentException(
                    "Mã người dùng, ví và danh mục phải lớn hơn 0."
            );
        }

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException(
                    "Tên giao dịch không được để trống."
            );
        }

        title = title.strip();

        if (title.length() > 150) {
            throw new IllegalArgumentException(
                    "Tên giao dịch không được vượt quá 150 ký tự."
            );
        }

        if (!"INCOME".equals(transactionType)
                && !"EXPENSE".equals(transactionType)) {
            throw new IllegalArgumentException(
                    "Loại giao dịch phải là INCOME hoặc EXPENSE."
            );
        }

        if (amount == null
                || amount.signum() <= 0
                || amount.compareTo(MAX_AMOUNT) > 0) {
            throw new IllegalArgumentException(
                    "Số tiền phải lớn hơn 0 và không vượt quá 15 chữ số."
            );
        }

        try {
            amount = amount.setScale(0, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException(
                    "Số tiền VNĐ phải là số nguyên đồng."
            );
        }

        if (transactionDate == null) {
            throw new IllegalArgumentException(
                    "Ngày giao dịch không được để trống."
            );
        }

        if (transactionDate.getYear() < 1000
                || transactionDate.getYear() > 9999) {
            throw new IllegalArgumentException(
                    "Ngày giao dịch nằm ngoài phạm vi được hỗ trợ."
            );
        }

        if (note != null) {
            note = note.strip();

            if (note.length() > 500) {
                throw new IllegalArgumentException(
                        "Ghi chú không được vượt quá 500 ký tự."
                );
            }

            if (note.isEmpty()) {
                note = null;
            }
        }

        boolean allowed = transactionDAO.canUseWalletAndCategory(
                userId,
                walletId,
                categoryId,
                transactionType
        );

        if (!allowed) {
            throw new IllegalArgumentException(
                    "Ví hoặc danh mục không hợp lệ, đã được lưu trữ, "
                            + "không thuộc bạn hoặc không khớp loại giao dịch."
            );
        }

        return transactionDAO.insert(
                userId,
                walletId,
                categoryId,
                title,
                transactionType,
                amount,
                transactionDate,
                note
        );
    }
}