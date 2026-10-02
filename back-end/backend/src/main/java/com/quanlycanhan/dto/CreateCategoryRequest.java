package com.quanlycanhan.dto;

public record CreateCategoryRequest(
        String name,
        String transactionType
) {
}