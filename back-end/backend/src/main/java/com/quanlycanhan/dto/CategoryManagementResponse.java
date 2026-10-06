package com.quanlycanhan.dto;

public record CategoryManagementResponse(
        long id,
        String name,
        String transactionType,
        boolean archived
) {
}