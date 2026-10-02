package com.quanlycanhan.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.quanlycanhan.dao.CategoryDAO;
import com.quanlycanhan.dto.CategoryOption;
import com.quanlycanhan.dto.CreateCategoryRequest;
import com.quanlycanhan.service.CategoryService;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/api/categories")
public class CategoryServlet extends HttpServlet {

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
            List<CategoryOption> categories =
                    categoryDAO.findActiveByUserId(userId);

            response.getWriter().write(gson.toJson(categories));

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log(
                    "Không thể đọc danh sách danh mục",
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
    protected void doPost(
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
            CreateCategoryRequest body = gson.fromJson(
                    request.getReader(),
                    CreateCategoryRequest.class
            );

            if (body == null) {
                writeError(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        "Dữ liệu tạo danh mục không được để trống."
                );
                return;
            }

            long categoryId = categoryService.createCategory(
                    userId,
                    body.name(),
                    body.transactionType()
            );

            JsonObject result = new JsonObject();
            result.addProperty("id", categoryId);
            result.addProperty("message", "Đã tạo danh mục.");

            response.setStatus(HttpServletResponse.SC_CREATED);
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
                    "Không thể tạo danh mục",
                    e
            );

            writeError(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Không thể tạo danh mục. Hãy thử lại sau."
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