package com.quanlycanhan.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.quanlycanhan.dto.RegisterRequest;
import com.quanlycanhan.dto.UserResponse;
import com.quanlycanhan.service.AuthService;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/api/auth/register")
public class RegisterServlet extends HttpServlet {

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");

        String contentType = request.getContentType();

        if (contentType == null
                || !contentType.split(";", 2)[0].trim()
                .equalsIgnoreCase("application/json")) {

            writeError(
                    response,
                    415,
                    "Yêu cầu phải dùng application/json."
            );
            return;
        }

        try {
            Gson gson = new Gson();

            RegisterRequest input = gson.fromJson(
                    request.getReader(),
                    RegisterRequest.class
            );

            if (input == null) {
                throw new IllegalArgumentException(
                        "Nội dung đăng ký không được để trống."
                );
            }

            AuthService service = new AuthService();

            UserResponse user = service.register(
                    input.fullName(),
                    input.email(),
                    input.password()
            );

            response.setStatus(HttpServletResponse.SC_CREATED);
            response.getWriter().write(gson.toJson(user));

        } catch (JsonParseException e) {
            writeError(
                    response,
                    400,
                    "JSON không hợp lệ hoặc sai kiểu dữ liệu."
            );

        } catch (IllegalArgumentException e) {
            writeError(response, 400, e.getMessage());

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log("Không thể đăng ký tài khoản", e);

            writeError(
                    response,
                    500,
                    "Không thể tạo tài khoản lúc này."
            );
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
}