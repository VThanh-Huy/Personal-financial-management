package com.quanlycanhan.dto;

public record LoginRequest(
        String email,
        String password
) {
}