package com.quanlycanhan.util;

public class PasswordUtilTest {

    public static void main(String[] args) {
        // Chỉ là dữ liệu thử, không dùng mật khẩu cá nhân.
        String password = "Mat khau thu nghiem 2026!";

        String hash1 = PasswordUtil.hash(password);
        String hash2 = PasswordUtil.hash(password);

        System.out.println(
                "Mật khẩu đúng: "
                        + PasswordUtil.verify(password, hash1)
        );

        System.out.println(
                "Mật khẩu sai: "
                        + PasswordUtil.verify("Sai mat khau", hash1)
        );

        System.out.println(
                "Hai lần băm khác nhau: "
                        + !hash1.equals(hash2)
        );

        System.out.println(
                "Chuỗi tài khoản mẫu bị từ chối: "
                        + !PasswordUtil.verify(
                        password,
                        "!DISABLED_DEMO_ACCOUNT"
                )
        );
    }
}