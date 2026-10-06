package com.quanlycanhan.service;

import com.quanlycanhan.dao.WalletDAO;

import java.math.BigDecimal;
import java.sql.SQLException;
import com.quanlycanhan.exception.ResourceInUseException;
public class WalletService {

    private static final BigDecimal MAX_BALANCE =
            new BigDecimal("999999999999999");

    private final WalletDAO walletDAO = new WalletDAO();

    public long createWallet(
            long userId,
            String name,
            BigDecimal openingBalance
    ) throws SQLException {

        if (userId <= 0) {
            throw new IllegalArgumentException(
                    "Thông tin người dùng không hợp lệ."
            );
        }

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException(
                    "Tên ví không được để trống."
            );
        }

        String normalizedName = name.strip();

        if (normalizedName.length() > 100) {
            throw new IllegalArgumentException(
                    "Tên ví không được vượt quá 100 ký tự."
            );
        }

        if (openingBalance == null) {
            throw new IllegalArgumentException(
                    "Hãy nhập số dư ban đầu."
            );
        }

        if (openingBalance.abs().compareTo(MAX_BALANCE) > 0) {
            throw new IllegalArgumentException(
                    "Số dư ban đầu được có tối đa 15 chữ số."
            );
        }

        if (openingBalance.stripTrailingZeros().scale() > 0) {
            throw new IllegalArgumentException(
                    "Số dư ban đầu phải là số nguyên theo đơn vị đồng."
            );
        }

        try {
            return walletDAO.insert(
                    userId,
                    normalizedName,
                    openingBalance.setScale(0)
            );
        } catch (SQLException e) {
            // MySQL: vi phạm ràng buộc UNIQUE.
            if (e.getErrorCode() == 1062) {
                throw new IllegalArgumentException(
                        "Tên ví đã tồn tại, có thể nằm trong danh sách ví đã lưu trữ."
                );
            }

            throw e;
        }
    }

    public boolean changeArchiveStatus(
            long userId,
            Long walletId,
            Boolean archived
    ) throws SQLException {

        if (userId <= 0) {
            throw new IllegalArgumentException(
                    "Thông tin người dùng không hợp lệ."
            );
        }

        if (walletId == null || walletId <= 0) {
            throw new IllegalArgumentException(
                    "ID ví không hợp lệ."
            );
        }

        if (archived == null) {
            throw new IllegalArgumentException(
                    "Hãy cung cấp trạng thái lưu trữ."
            );
        }

        return walletDAO.updateArchiveStatus(
                walletId,
                userId,
                archived
        );
    }

    public boolean deleteWallet(
            long userId,
            long walletId
    ) throws SQLException {

        if (userId <= 0 || walletId <= 0) {
            throw new IllegalArgumentException(
                    "Thông tin người dùng hoặc ví không hợp lệ."
            );
        }

        try {
            return walletDAO.deleteByIdAndUserId(
                    walletId,
                    userId
            );
        } catch (SQLException e) {
            // MySQL: không thể xóa bản ghi đang được khóa ngoại tham chiếu.
            if (e.getErrorCode() == 1451) {
                throw new ResourceInUseException(
                        "Ví đã có giao dịch. Hãy lưu trữ ví thay vì xóa."
                );
            }

            throw e;
        }
    }
}