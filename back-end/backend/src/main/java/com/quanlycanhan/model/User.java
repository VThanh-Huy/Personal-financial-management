package com.quanlycanhan.model;

public record User(
        long id,
        String fullName,
        String email,
        String passwordHash
) {
}