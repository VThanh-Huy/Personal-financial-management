package com.quanlycanhan.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class Transaction {

    private final long id;
    private final long userId;
    private final long walletId;
    private final long categoryId;
    private final String title;
    private final String transactionType;
    private final BigDecimal amount;
    private final LocalDate transactionDate;
    private final String note;
    private final LocalDateTime createdAt;

    public Transaction(
            long id,
            long userId,
            long walletId,
            long categoryId,
            String title,
            String transactionType,
            BigDecimal amount,
            LocalDate transactionDate,
            String note,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.walletId = walletId;
        this.categoryId = categoryId;
        this.title = title;
        this.transactionType = transactionType;
        this.amount = amount;
        this.transactionDate = transactionDate;
        this.note = note;
        this.createdAt = createdAt;
    }

    public long getId() {
        return id;
    }

    public long getUserId() {
        return userId;
    }

    public long getWalletId() {
        return walletId;
    }

    public long getCategoryId() {
        return categoryId;
    }

    public String getTitle() {
        return title;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public String getNote() {
        return note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}