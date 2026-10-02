package com.quanlycanhan.dto;

import java.math.BigDecimal;

public record CreateWalletRequest(
        String name,
        BigDecimal openingBalance
) {
}