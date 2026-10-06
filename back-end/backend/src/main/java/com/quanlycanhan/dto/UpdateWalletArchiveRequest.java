package com.quanlycanhan.dto;

public record UpdateWalletArchiveRequest(
        Long walletId,
        Boolean archived
) {
}