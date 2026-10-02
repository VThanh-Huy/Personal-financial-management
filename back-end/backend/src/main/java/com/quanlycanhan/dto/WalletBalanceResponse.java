package com.quanlycanhan.dto;

import java.math.BigDecimal;

public record WalletBalanceResponse(
        long id,
        String name,
        BigDecimal openingBalance,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal balance
) {
}