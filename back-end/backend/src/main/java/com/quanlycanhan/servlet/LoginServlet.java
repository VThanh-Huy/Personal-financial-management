package com.quanlycanhan.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.quanlycanhan.dto.LoginRequest;
import com.quanlycanhan.dto.UserResponse;
import com.quanlycanhan.service.AuthService;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.security.SecureRandom;
import java.sql.SQLException;
import java.util.Base64;

@WebServlet("/api/auth/login")
public class LoginServlet extends HttpServlet {

    private static final SecureRandom RANDOM = new SecureRandom();

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

            writeError(response, 415, "Yêu cầu phải dùng application/json.");
            return;
        }

        try {
            Gson gson = new Gson();

            LoginRequest input = gson.fromJson(
                    request.getReader(),
                    LoginRequest.class
            );

            if (input == null) {
                writeError(response, 400, "Nội dung đăng nhập bị trống.");
                return;
            }

            AuthService service = new AuthService();

            UserResponse user = service.login(
                    input.email(),
                    input.password()
            );

            // Hủy phiên cũ sau khi xác thực thành công.
            HttpSession oldSession = request.getSession(false);

            if (oldSession != null) {
                oldSession.invalidate();
            }

            // Tạo phiên mới để không tiếp tục sử dụng ID phiên cũ.
            HttpSession session = request.getSession(true);

            session.setAttribute("userId", user.id());
            session.setAttribute("fullName", user.fullName());
            session.setAttribute("email", user.email());

            // Hết hạn sau 30 phút không có yêu cầu sử dụng phiên.
            session.setMaxInactiveInterval(30 * 60);

            // Chuẩn bị token bảo vệ các thao tác ghi ở bước Filter.
            byte[] tokenBytes = new byte[32];
            RANDOM.nextBytes(tokenBytes);

            String csrfToken = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(tokenBytes);

            session.setAttribute("csrfToken", csrfToken);

            JsonObject result = new JsonObject();
            result.add("user", gson.toJsonTree(user));
            result.addProperty("csrfToken", csrfToken);

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(result.toString());

        } catch (JsonParseException e) {
            writeError(response, 400, "JSON không hợp lệ.");

        } catch (IllegalArgumentException e) {
            writeError(response, 401, "Email hoặc mật khẩu không đúng.");

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log("Không thể đăng nhập", e);
            writeError(response, 500, "Không thể đăng nhập lúc này.");
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