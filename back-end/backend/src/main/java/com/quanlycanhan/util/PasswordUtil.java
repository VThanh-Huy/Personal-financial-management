package com.quanlycanhan.util;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

public final class PasswordUtil {

    private static final String FORMAT = "pbkdf2-sha256";
    private static final int ITERATIONS = 600_000;
    private static final int SALT_LENGTH = 16;
    private static final int KEY_LENGTH_BITS = 256;

    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordUtil() {
    }

    public static String hash(String password) {
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException(
                    "Mật khẩu không được để trống."
            );
        }

        byte[] salt = new byte[SALT_LENGTH];
        RANDOM.nextBytes(salt);

        byte[] hashedPassword = deriveKey(password, salt);

        return FORMAT
                + "$" + ITERATIONS
                + "$" + Base64.getEncoder().encodeToString(salt)
                + "$" + Base64.getEncoder().encodeToString(hashedPassword);
    }

    public static boolean verify(String password, String storedHash) {
        if (password == null || storedHash == null
                || storedHash.length() > 255) {
            return false;
        }

        String[] parts = storedHash.split("\\$", -1);

        if (parts.length != 4
                || !FORMAT.equals(parts[0])
                || !String.valueOf(ITERATIONS).equals(parts[1])) {
            return false;
        }

        byte[] salt;
        byte[] expectedHash;

        try {
            salt = Base64.getDecoder().decode(parts[2]);
            expectedHash = Base64.getDecoder().decode(parts[3]);
        } catch (IllegalArgumentException e) {
            return false;
        }

        if (salt.length != SALT_LENGTH
                || expectedHash.length != KEY_LENGTH_BITS / 8) {
            return false;
        }

        byte[] actualHash = deriveKey(password, salt);

        return MessageDigest.isEqual(expectedHash, actualHash);
    }

    private static byte[] deriveKey(String password, byte[] salt) {
        char[] characters = password.toCharArray();

        PBEKeySpec specification = new PBEKeySpec(
                characters,
                salt,
                ITERATIONS,
                KEY_LENGTH_BITS
        );

        Arrays.fill(characters, '\0');

        try {
            SecretKeyFactory factory =
                    SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");

            return factory.generateSecret(specification).getEncoded();

        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(
                    "Không thể xử lý mật khẩu.", e
            );
        } finally {
            specification.clearPassword();
        }
    }
}
