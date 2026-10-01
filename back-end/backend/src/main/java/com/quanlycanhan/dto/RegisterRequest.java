package com.quanlycanhan.dto;

public record RegisterRequest(
        String fullName,
        String email,
        String password
) {
}