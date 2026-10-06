package com.quanlycanhan.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.quanlycanhan.dao.WalletDAO;
import com.quanlycanhan.dto.UpdateWalletArchiveRequest;
import com.quanlycanhan.service.WalletService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;
import com.quanlycanhan.exception.ResourceInUseException;

@WebServlet("/api/wallet-management")
public class WalletManagementServlet extends HttpServlet {

    private final Gson gson = new Gson();
    private final WalletDAO walletDAO = new WalletDAO();
    private final WalletService walletService = new WalletService();

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        prepareResponse(response);

        long userId =
                (Long) request.getAttribute("authenticatedUserId");

        try {
            response.getWriter().write(
                    gson.toJson(walletDAO.findAllByUserId(userId))
            );
        } catch (SQLException | IllegalStateException e) {
            getServletContext().log(
                    "Không thể tải danh sách quản lý ví",
                    e
            );

            writeError(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Không thể tải danh sách ví."
            );
        }
    }

    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        request.setCharacterEncoding("UTF-8");
        prepareResponse(response);

        long userId =
                (Long) request.getAttribute("authenticatedUserId");

        String contentType = request.getContentType();

        if (contentType == null ||
                !contentType.split(";", 2)[0].trim()
                        .equalsIgnoreCase("application/json")) {

            writeError(
                    response,
                    HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE,
                    "Yêu cầu phải có Content-Type là application/json."
            );
            return;
        }

        try {
            UpdateWalletArchiveRequest body = gson.fromJson(
                    request.getReader(),
                    UpdateWalletArchiveRequest.class
            );

            if (body == null) {
                writeError(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        "Dữ liệu yêu cầu không được để trống."
                );
                return;
            }

            boolean updated = walletService.changeArchiveStatus(
                    userId,
                    body.walletId(),
                    body.archived()
            );

            if (!updated) {
                writeError(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        "Không tìm thấy ví của bạn."
                );
                return;
            }

            JsonObject result = new JsonObject();
            result.addProperty("id", body.walletId());
            result.addProperty("archived", body.archived());
            result.addProperty(
                    "message",
                    body.archived()
                            ? "Đã lưu trữ ví."
                            : "Đã khôi phục ví."
            );

            response.getWriter().write(result.toString());

        } catch (JsonParseException e) {
            writeError(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu JSON không hợp lệ."
            );

        } catch (IllegalArgumentException e) {
            writeError(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    e.getMessage()
            );

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log(
                    "Không thể cập nhật trạng thái ví",
                    e
            );

            writeError(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Không thể cập nhật trạng thái ví."
            );
        }
    }

    @Override
    protected void doDelete(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        prepareResponse(response);

        long userId =
                (Long) request.getAttribute("authenticatedUserId");

        String rawId = request.getParameter("id");

        if (rawId == null || rawId.isBlank()) {
            writeError(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Thiếu ID ví cần xóa."
            );
            return;
        }

        try {
            long walletId = Long.parseLong(rawId);

            boolean deleted = walletService.deleteWallet(
                    userId,
                    walletId
            );

            if (!deleted) {
                writeError(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        "Không tìm thấy ví của bạn."
                );
                return;
            }

            response.setStatus(HttpServletResponse.SC_NO_CONTENT);

        } catch (NumberFormatException e) {
            writeError(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    "ID ví phải là số nguyên hợp lệ."
            );

        } catch (IllegalArgumentException e) {
            writeError(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    e.getMessage()
            );

        } catch (ResourceInUseException e) {
            writeError(
                    response,
                    HttpServletResponse.SC_CONFLICT,
                    e.getMessage()
            );

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log("Không thể xóa ví", e);

            writeError(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Không thể xóa ví. Hãy thử lại sau."
            );
        }
    }

    private void prepareResponse(HttpServletResponse response) {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
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
}