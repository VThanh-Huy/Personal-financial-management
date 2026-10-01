package com.quanlycanhan.dto;

public record UserResponse(
        long id,
        String fullName,
        String email
) {
}