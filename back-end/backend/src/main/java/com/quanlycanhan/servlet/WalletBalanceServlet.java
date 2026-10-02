package com.quanlycanhan.servlet;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.quanlycanhan.dao.WalletDAO;
import com.quanlycanhan.dto.WalletBalanceResponse;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/api/wallet-balances")
public class WalletBalanceServlet extends HttpServlet {

    private final WalletDAO walletDAO = new WalletDAO();

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");

        long userId =
                (Long) request.getAttribute("authenticatedUserId");

        try {
            List<WalletBalanceResponse> wallets =
                    walletDAO.findBalancesByUserId(userId);

            JsonArray result = new JsonArray();

            for (WalletBalanceResponse wallet : wallets) {
                JsonObject item = new JsonObject();

                item.addProperty("id", wallet.id());
                item.addProperty("name", wallet.name());

                item.addProperty(
                        "openingBalance",
                        wallet.openingBalance().toPlainString()
                );
                item.addProperty(
                        "totalIncome",
                        wallet.totalIncome().toPlainString()
                );
                item.addProperty(
                        "totalExpense",
                        wallet.totalExpense().toPlainString()
                );
                item.addProperty(
                        "balance",
                        wallet.balance().toPlainString()
                );

                result.add(item);
            }

            response.getWriter().write(result.toString());

        } catch (SQLException | IllegalStateException e) {
            getServletContext().log(
                    "Không thể tính số dư ví",
                    e
            );

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            JsonObject error = new JsonObject();
            error.addProperty(
                    "message",
                    "Không thể tải số dư ví."
            );

            response.getWriter().write(error.toString());
        }
    }
}