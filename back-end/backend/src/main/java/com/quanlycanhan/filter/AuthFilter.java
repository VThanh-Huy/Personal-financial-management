package com.quanlycanhan.filter;

import com.google.gson.JsonObject;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;

@WebFilter("/api/*")
public class AuthFilter implements Filter {

    // Các địa chỉ phát triển hiện tại của project.
    private static final Set<String> ALLOWED_ORIGINS = Set.of(
            "http://localhost:5173",
            "http://localhost:8080"
    );

    @Override
    public void doFilter(
            ServletRequest servletRequest,
            ServletResponse servletResponse,
            FilterChain chain
    ) throws IOException, ServletException {

        HttpServletRequest request =
                (HttpServletRequest) servletRequest;

        HttpServletResponse response =
                (HttpServletResponse) servletResponse;

        response.setHeader("Cache-Control", "no-store");

        String path = request.getServletPath();
        String method = request.getMethod();

        boolean writing = !Set.of("GET", "HEAD", "OPTIONS")
                .contains(method);

        // Kiểm tra Origin khi trình duyệt gửi thao tác ghi.
        // PowerShell có thể không gửi header này.
        if (writing) {
            String origin = request.getHeader("Origin");

            if (origin != null && !ALLOWED_ORIGINS.contains(origin)) {
                writeError(response, 403, "Nguồn yêu cầu không được phép.");
                return;
            }
        }

        boolean publicAuthEndpoint =
                "/api/auth/register".equals(path)
                        || "/api/auth/login".equals(path);

        if (publicAuthEndpoint) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = request.getSession(false);

        if (session == null
                || !(session.getAttribute("userId") instanceof Long)) {
            writeError(response, 401, "Bạn cần đăng nhập.");
            return;
        }

        if (writing) {
            String expectedToken =
                    (String) session.getAttribute("csrfToken");

            String suppliedToken =
                    request.getHeader("X-CSRF-Token");

            if (expectedToken == null
                    || suppliedToken == null
                    || !MessageDigest.isEqual(
                    expectedToken.getBytes(StandardCharsets.UTF_8),
                    suppliedToken.getBytes(StandardCharsets.UTF_8)
            )) {

                writeError(response, 403, "CSRF token không hợp lệ.");
                return;
            }
        }

        request.setAttribute(
                "authenticatedUserId",
                session.getAttribute("userId")
        );

        chain.doFilter(request, response);
    }

    private void writeError(
            HttpServletResponse response,
            int status,
            String message
    ) throws IOException {

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        JsonObject error = new JsonObject();
        error.addProperty("message", message);

        response.getWriter().write(error.toString());
    }
}