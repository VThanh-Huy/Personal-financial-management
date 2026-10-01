package com.quanlycanhan.servlet;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.quanlycanhan.dao.TransactionDAO;
import com.quanlycanhan.model.Transaction;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;
import java.util.List;
import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.quanlycanhan.dto.CreateTransactionRequest;
import com.quanlycanhan.service.TransactionService;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
@WebServlet("/api/transactions")
public class TransactionServlet extends HttpServlet {

    // Chỉ dùng cho bản thử nghiệm trên máy.
    // Đổi thành ID người dùng mẫu thực tế nếu khác 1.
    private static final long DEMO_USER_ID = 1L;

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            TransactionDAO dao = new TransactionDAO();

            List<Transaction> transactions =
                    dao.findByUserId(DEMO_USER_ID);

            JsonArray data = new JsonArray();

            for (Transaction transaction : transactions) {
                JsonObject item = new JsonObject();

                item.addProperty("id", transaction.getId());
                item.addProperty("userId", transaction.getUserId());
                item.addProperty("walletId", transaction.getWalletId());
                item.addProperty("categoryId", transaction.getCategoryId());
                item.addProperty("title", transaction.getTitle());
                item.addProperty(
                        "transactionType",
                        transaction.getTransactionType()
                );
                item.addProperty("amount", transaction.getAmount());
                item.addProperty(
                        "transactionDate",
                        transaction.getTransactionDate().toString()
                );
                item.addProperty("note", transaction.getNote());
                item.addProperty(
                        "createdAt",
                        transaction.getCreatedAt().toString()
                );

                data.add(item);
            }

            response.getWriter().write(data.toString());

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log("Không thể đọc giao dịch", e);

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            JsonObject error = new JsonObject();
            error.addProperty(
                    "message",
                    "Không thể tải danh sách giao dịch."
            );

            response.getWriter().write(error.toString());
        }
    }
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String contentType = request.getContentType();

        if (contentType == null
                || !contentType.split(";", 2)[0].trim()
                .equalsIgnoreCase("application/json")) {

            writeError(response, 415, "Yêu cầu phải dùng application/json.");
            return;
        }

        try {
            Gson gson = new Gson();

            CreateTransactionRequest input = gson.fromJson(
                    request.getReader(),
                    CreateTransactionRequest.class
            );

            if (input == null) {
                throw new IllegalArgumentException(
                        "Nội dung yêu cầu không được để trống."
                );
            }

            if (input.walletId() == null || input.categoryId() == null) {
                throw new IllegalArgumentException(
                        "Bạn phải chọn ví và danh mục."
                );
            }

            if (input.transactionDate() == null
                    || input.transactionDate().isBlank()) {
                throw new IllegalArgumentException(
                        "Bạn phải nhập ngày giao dịch."
                );
            }

            LocalDate transactionDate =
                    LocalDate.parse(input.transactionDate());

            TransactionService service = new TransactionService();

            long newId = service.createTransaction(
                    DEMO_USER_ID,
                    input.walletId(),
                    input.categoryId(),
                    input.title(),
                    input.transactionType(),
                    input.amount(),
                    transactionDate,
                    input.note()
            );

            JsonObject result = new JsonObject();
            result.addProperty("id", newId);
            result.addProperty("message", "Thêm giao dịch thành công.");

            response.setStatus(HttpServletResponse.SC_CREATED);
            response.getWriter().write(result.toString());

        } catch (JsonParseException e) {
            writeError(response, 400, "JSON không hợp lệ hoặc sai kiểu dữ liệu.");

        } catch (DateTimeParseException e) {
            writeError(response, 400, "Ngày phải hợp lệ và có dạng yyyy-MM-dd.");

        } catch (IllegalArgumentException e) {
            writeError(response, 400, e.getMessage());

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log("Không thể thêm giao dịch", e);
            writeError(response, 500, "Không thể lưu giao dịch lúc này.");
        }
    }

    private void writeError(
            HttpServletResponse response,
            int status,
            String message
    ) throws IOException {

        response.setStatus(status);

        JsonObject error = new JsonObject();
        error.addProperty("message", message);

        response.getWriter().write(error.toString());
    }

    @Override
    protected void doDelete(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String idParameter = request.getParameter("id");

            if (idParameter == null || idParameter.isBlank()) {
                throw new IllegalArgumentException(
                        "Thiếu mã giao dịch cần xóa."
                );
            }

            long transactionId = Long.parseLong(idParameter);

            TransactionService service = new TransactionService();

            boolean deleted = service.deleteTransaction(
                    DEMO_USER_ID,
                    transactionId
            );

            if (!deleted) {
                writeError(
                        response,
                        404,
                        "Không tìm thấy giao dịch có thể xóa."
                );
                return;
            }

            response.setStatus(HttpServletResponse.SC_NO_CONTENT);

        } catch (NumberFormatException e) {
            writeError(response, 400, "Mã giao dịch phải là số nguyên hợp lệ.");

        } catch (IllegalArgumentException e) {
            writeError(response, 400, e.getMessage());

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log("Không thể xóa giao dịch", e);
            writeError(response, 500, "Không thể xóa giao dịch lúc này.");
        }
    }

    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String contentType = request.getContentType();

        if (contentType == null
                || !contentType.split(";", 2)[0].trim()
                .equalsIgnoreCase("application/json")) {

            writeError(response, 415, "Yêu cầu phải dùng application/json.");
            return;
        }

        try {
            String idParameter = request.getParameter("id");

            if (idParameter == null || idParameter.isBlank()) {
                throw new IllegalArgumentException(
                        "Thiếu mã giao dịch cần sửa."
                );
            }

            long transactionId = Long.parseLong(idParameter);

            Gson gson = new Gson();

            CreateTransactionRequest input = gson.fromJson(
                    request.getReader(),
                    CreateTransactionRequest.class
            );

            if (input == null) {
                throw new IllegalArgumentException(
                        "Nội dung yêu cầu không được để trống."
                );
            }

            if (input.walletId() == null || input.categoryId() == null) {
                throw new IllegalArgumentException(
                        "Bạn phải chọn ví và danh mục."
                );
            }

            if (input.transactionDate() == null
                    || input.transactionDate().isBlank()) {
                throw new IllegalArgumentException(
                        "Bạn phải nhập ngày giao dịch."
                );
            }

            LocalDate transactionDate =
                    LocalDate.parse(input.transactionDate());

            TransactionService service = new TransactionService();

            boolean updated = service.updateTransaction(
                    DEMO_USER_ID,
                    transactionId,
                    input.walletId(),
                    input.categoryId(),
                    input.title(),
                    input.transactionType(),
                    input.amount(),
                    transactionDate,
                    input.note()
            );

            if (!updated) {
                writeError(
                        response,
                        404,
                        "Không tìm thấy giao dịch có thể sửa."
                );
                return;
            }

            JsonObject result = new JsonObject();
            result.addProperty("id", transactionId);
            result.addProperty("message", "Cập nhật giao dịch thành công.");

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(result.toString());

        } catch (NumberFormatException e) {
            writeError(response, 400, "Mã giao dịch phải là số nguyên hợp lệ.");

        } catch (JsonParseException e) {
            writeError(response, 400, "JSON không hợp lệ hoặc sai kiểu dữ liệu.");

        } catch (DateTimeParseException e) {
            writeError(response, 400, "Ngày phải hợp lệ và có dạng yyyy-MM-dd.");

        } catch (IllegalArgumentException e) {
            writeError(response, 400, e.getMessage());

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log("Không thể cập nhật giao dịch", e);
            writeError(response, 500, "Không thể cập nhật giao dịch lúc này.");
        }
    }
}