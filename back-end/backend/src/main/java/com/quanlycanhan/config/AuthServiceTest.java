package com.quanlycanhan.config;

import com.quanlycanhan.dto.UserResponse;
import com.quanlycanhan.service.AuthService;

import java.sql.SQLException;
import java.util.UUID;

public class AuthServiceTest {

    public static void main(String[] args) throws SQLException {
        AuthService service = new AuthService();

        // Email mới mỗi lần chạy để tránh trùng với lần thử trước.
        String email = "test-" + UUID.randomUUID() + "@example.com";

        // Chỉ là mật khẩu thử, không dùng cho tài khoản thật.
        String password = "Mat khau thu nghiem 2026!";

        // 1. Đăng ký thành công.
        UserResponse registeredUser = service.register(
                "Nguoi dung thu nghiem",
                email,
                password
        );

        System.out.println("Đăng ký thành công.");
        System.out.println("ID: " + registeredUser.id());
        System.out.println("Email: " + registeredUser.email());

        // 2. Đăng nhập với mật khẩu đúng.
        UserResponse loggedInUser = service.login(email, password);

        if (loggedInUser.id() != registeredUser.id()) {
            throw new IllegalStateException(
                    "Đăng nhập trả về sai người dùng."
            );
        }

        System.out.println("Đăng nhập đúng mật khẩu: đạt.");

        // 3. Đăng nhập với mật khẩu sai.
        expectRejected(
                "Đăng nhập sai mật khẩu",
                () -> service.login(email, "Mat khau sai 2026!")
        );

        // 4. Đăng ký trùng email.
        expectRejected(
                "Đăng ký trùng email",
                () -> service.register(
                        "Nguoi dung khac",
                        email,
                        password
                )
        );

        System.out.println("Hoàn tất các kiểm tra.");
    }

    private static void expectRejected(
            String testName,
            CheckedAction action
    ) throws SQLException {

        try {
            action.run();
        } catch (IllegalArgumentException e) {
            System.out.println(
                    testName + ": đã từ chối — " + e.getMessage()
            );
            return;
        }

        throw new IllegalStateException(
                testName + ": thất bại vì dữ liệu sai đã được chấp nhận."
        );
    }

    @FunctionalInterface
    private interface CheckedAction {
        void run() throws SQLException;
    }
}