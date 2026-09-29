package com.quanlycanhan.dto;

import java.math.BigDecimal;

public record CreateTransactionRequest(
        Long walletId,
        Long categoryId,
        String title,
        String transactionType,
        BigDecimal amount,
        String transactionDate,
        String note
) {
}