package com.quanlycanhan.service;

import com.quanlycanhan.dao.UserDAO;
import com.quanlycanhan.dto.UserResponse;
import com.quanlycanhan.model.User;
import com.quanlycanhan.util.PasswordUtil;

import java.sql.SQLException;
import java.util.Locale;
import java.util.Optional;

public class AuthService {

    private final UserDAO userDAO = new UserDAO();

    // Dùng để vẫn thực hiện kiểm tra băm khi email không tồn tại.
    private static final String DUMMY_HASH =
            PasswordUtil.hash("Dummy password for timing only!");

    public UserResponse register(
            String fullName,
            String email,
            String password
    ) throws SQLException {

        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException(
                    "Họ tên không được để trống."
            );
        }

        fullName = fullName.strip();

        if (fullName.length() > 100) {
            throw new IllegalArgumentException(
                    "Họ tên không được vượt quá 100 ký tự."
            );
        }

        email = normalizeEmail(email);

        if (password == null) {
            throw new IllegalArgumentException(
                    "Bạn phải nhập mật khẩu."
            );
        }

        int passwordLength = password.codePointCount(
                0,
                password.length()
        );

        if (passwordLength < 15 || passwordLength > 128) {
            throw new IllegalArgumentException(
                    "Mật khẩu phải có từ 15 đến 128 ký tự."
            );
        }

        String passwordHash = PasswordUtil.hash(password);

        try {
            long userId = userDAO.insert(
                    fullName,
                    email,
                    passwordHash
            );

            return new UserResponse(userId, fullName, email);

        } catch (SQLException e) {
            // MySQL 1062: vi phạm ràng buộc UNIQUE.
            // Với thao tác này, email là trường UNIQUE do người dùng nhập.
            if (e.getErrorCode() == 1062) {
                throw new IllegalArgumentException(
                        "Email đã được sử dụng."
                );
            }

            throw e;
        }
    }

    public UserResponse login(
            String email,
            String password
    ) throws SQLException {

        email = normalizeEmail(email);

        if (password == null || password.isEmpty()
                || password.codePointCount(0, password.length()) > 128) {
            throw new IllegalArgumentException(
                    "Email hoặc mật khẩu không đúng."
            );
        }

        Optional<User> result = userDAO.findByEmail(email);

        String storedHash = result
                .map(User::passwordHash)
                .orElse(DUMMY_HASH);

        // Tài khoản mẫu cũ chưa có mật khẩu đăng nhập hợp lệ.
        boolean demoDisabled =
                "!DISABLED_DEMO_ACCOUNT".equals(storedHash);

        boolean passwordMatches = PasswordUtil.verify(
                password,
                demoDisabled ? DUMMY_HASH : storedHash
        );

        if (result.isEmpty() || demoDisabled || !passwordMatches) {
            throw new IllegalArgumentException(
                    "Email hoặc mật khẩu không đúng."
            );
        }

        User user = result.get();

        return new UserResponse(
                user.id(),
                user.fullName(),
                user.email()
        );
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "Email không được để trống."
            );
        }

        String normalized = email.strip().toLowerCase(Locale.ROOT);

        if (normalized.length() > 255
                || !normalized.matches(
                "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        )) {
            throw new IllegalArgumentException(
                    "Email không hợp lệ."
            );
        }

        return normalized;
    }
}