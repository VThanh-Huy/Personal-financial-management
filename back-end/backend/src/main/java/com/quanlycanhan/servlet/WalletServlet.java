package com.quanlycanhan.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.quanlycanhan.dao.WalletDAO;
import com.quanlycanhan.dto.WalletOption;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/api/wallets")
public class WalletServlet extends HttpServlet {

    // Cùng người dùng mẫu đang dùng trong TransactionServlet.
    private static final long DEMO_USER_ID = 1L;

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            WalletDAO dao = new WalletDAO();

            List<WalletOption> wallets =
                    dao.findActiveByUserId(DEMO_USER_ID);

            String json = new Gson().toJson(wallets);
            response.getWriter().write(json);

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log("Không thể đọc danh sách ví", e);

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            JsonObject error = new JsonObject();
            error.addProperty("message", "Không thể tải danh sách ví.");

            response.getWriter().write(error.toString());
        }
    }
}