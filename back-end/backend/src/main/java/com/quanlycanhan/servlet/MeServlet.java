package com.quanlycanhan.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.quanlycanhan.dto.UserResponse;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/api/auth/me")
public class MeServlet extends HttpServlet {

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        HttpSession session = request.getSession(false);

        UserResponse user = new UserResponse(
                (Long) request.getAttribute("authenticatedUserId"),
                (String) session.getAttribute("fullName"),
                (String) session.getAttribute("email")
        );

        JsonObject result = new JsonObject();
        result.add("user", new Gson().toJsonTree(user));
        result.addProperty(
                "csrfToken",
                (String) session.getAttribute("csrfToken")
        );

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(result.toString());
    }
}