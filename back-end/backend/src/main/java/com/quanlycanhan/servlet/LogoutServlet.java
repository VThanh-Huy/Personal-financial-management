package com.quanlycanhan.servlet;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/api/auth/logout")
public class LogoutServlet extends HttpServlet {

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        // Xóa cookie session ở client.
        Cookie cookie = new Cookie("JSESSIONID", "");

        String contextPath = request.getContextPath();

        cookie.setPath(
                contextPath.isEmpty() ? "/" : contextPath
        );
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        cookie.setSecure(request.isSecure());

        response.addCookie(cookie);
        response.setHeader("Cache-Control", "no-store");
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }
}