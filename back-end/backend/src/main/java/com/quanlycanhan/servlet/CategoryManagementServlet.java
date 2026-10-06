package com.quanlycanhan.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.quanlycanhan.dao.CategoryDAO;
import com.quanlycanhan.dto.UpdateCategoryArchiveRequest;
import com.quanlycanhan.service.CategoryService;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/api/category-management")
public class CategoryManagementServlet extends HttpServlet {

    private final Gson gson = new Gson();
    private final CategoryDAO categoryDAO = new CategoryDAO();
    private final CategoryService categoryService = new CategoryService();

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
                    gson.toJson(categoryDAO.findAllByUserId(userId))
            );
        } catch (SQLException | IllegalStateException e) {
            getServletContext().log(
                    "Không thể tải danh sách quản lý danh mục",
                    e
            );

            writeError(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Không thể tải danh sách danh mục."
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
            UpdateCategoryArchiveRequest body = gson.fromJson(
                    request.getReader(),
                    UpdateCategoryArchiveRequest.class
            );

            if (body == null) {
                writeError(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        "Dữ liệu yêu cầu không được để trống."
                );
                return;
            }

            boolean updated = categoryService.changeArchiveStatus(
                    userId,
                    body.categoryId(),
                    body.archived()
            );

            if (!updated) {
                writeError(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        "Không tìm thấy danh mục của bạn."
                );
                return;
            }

            JsonObject result = new JsonObject();
            result.addProperty("id", body.categoryId());
            result.addProperty("archived", body.archived());
            result.addProperty(
                    "message",
                    body.archived()
                            ? "Đã lưu trữ danh mục."
                            : "Đã khôi phục danh mục."
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
                    "Không thể cập nhật trạng thái danh mục",
                    e
            );

            writeError(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Không thể cập nhật trạng thái danh mục."
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