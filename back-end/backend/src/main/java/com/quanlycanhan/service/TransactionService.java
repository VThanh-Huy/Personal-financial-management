package com.quanlycanhan.service;

import com.quanlycanhan.dao.TransactionDAO;

import java.math.BigDecimal;
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

        validateTransaction(
                userId, walletId, categoryId, title,
                transactionType, amount, transactionDate, note
        );

        return transactionDAO.insert(
                userId,
                walletId,
                categoryId,
                title.strip(),
                transactionType,
                amount.setScale(0),
                transactionDate,
                normalizeNote(note)
        );
    }

    public boolean updateTransaction(
            long userId,
            long transactionId,
            long walletId,
            long categoryId,
            String title,
            String transactionType,
            BigDecimal amount,
            LocalDate transactionDate,
            String note
    ) throws SQLException {

        if (transactionId <= 0) {
            throw new IllegalArgumentException(
                    "Mã giao dịch phải lớn hơn 0."
            );
        }

        validateTransaction(
                userId, walletId, categoryId, title,
                transactionType, amount, transactionDate, note
        );

        return transactionDAO.updateByIdAndUserId(
                transactionId,
                userId,
                walletId,
                categoryId,
                title.strip(),
                transactionType,
                amount.setScale(0),
                transactionDate,
                normalizeNote(note)
        );
    }

    public boolean deleteTransaction(long userId, long transactionId)
            throws SQLException {

        if (userId <= 0 || transactionId <= 0) {
            throw new IllegalArgumentException(
                    "Mã người dùng và giao dịch phải lớn hơn 0."
            );
        }

        return transactionDAO.deleteByIdAndUserId(
                transactionId,
                userId
        );
    }

    private void validateTransaction(
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

        if (title.strip().length() > 150) {
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

        if (amount.stripTrailingZeros().scale() > 0) {
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

        if (note != null && note.strip().length() > 500) {
            throw new IllegalArgumentException(
                    "Ghi chú không được vượt quá 500 ký tự."
            );
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
    }

    private String normalizeNote(String note) {
        if (note == null || note.isBlank()) {
            return null;
        }

        return note.strip();
    }
}