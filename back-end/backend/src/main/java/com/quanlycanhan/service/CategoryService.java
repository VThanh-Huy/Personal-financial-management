package com.quanlycanhan.service;

import com.quanlycanhan.dao.CategoryDAO;

import java.sql.SQLException;

public class CategoryService {

    private final CategoryDAO categoryDAO = new CategoryDAO();

    public long createCategory(
            long userId,
            String name,
            String transactionType
    ) throws SQLException {

        if (userId <= 0) {
            throw new IllegalArgumentException(
                    "Thông tin người dùng không hợp lệ."
            );
        }

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException(
                    "Tên danh mục không được để trống."
            );
        }

        String normalizedName = name.strip();

        if (normalizedName.length() > 100) {
            throw new IllegalArgumentException(
                    "Tên danh mục không được vượt quá 100 ký tự."
            );
        }

        if (!"INCOME".equals(transactionType)
                && !"EXPENSE".equals(transactionType)) {
            throw new IllegalArgumentException(
                    "Loại danh mục phải là INCOME hoặc EXPENSE."
            );
        }

        try {
            return categoryDAO.insert(
                    userId,
                    normalizedName,
                    transactionType
            );
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) {
                throw new IllegalArgumentException(
                        "Tên danh mục đã tồn tại trong loại giao dịch này, "
                                + "có thể nằm trong danh sách đã lưu trữ."
                );
            }

            throw e;
        }
    }
}