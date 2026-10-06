package com.quanlycanhan.dto;

public record UpdateCategoryArchiveRequest(
        Long categoryId,
        Boolean archived
) {
}