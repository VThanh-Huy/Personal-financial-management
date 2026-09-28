package com.quanlycanhan.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Transaction {

    private long id;
    private String title;
    private String transactionType;
    private BigDecimal amount;
    private LocalDate transactionDate;
    private String note;

    public Transaction(long id,
                       String title,
                       String transactionType,
                       BigDecimal amount,
                       LocalDate transactionDate,
                       String note) {
        this.id = id;
        this.title = title;
        this.transactionType = transactionType;
        this.amount = amount;
        this.transactionDate = transactionDate;
        this.note = note;
    }

    public long getId() {
        return id;
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
}