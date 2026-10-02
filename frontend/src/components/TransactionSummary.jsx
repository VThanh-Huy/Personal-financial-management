const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export default function TransactionSummary({ transactions }) {
  let totalIncome = 0n;
  let totalExpense = 0n;

  for (const transaction of transactions) {
    const amount = BigInt(transaction.amount);

    if (transaction.transactionType === "INCOME") {
      totalIncome += amount;
    } else if (transaction.transactionType === "EXPENSE") {
      totalExpense += amount;
    }
  }

  const difference = totalIncome - totalExpense;

  return (
    <section
      className="transaction-summary"
      aria-label="Tổng hợp giao dịch trong kết quả lọc"
    >
      <article className="summary-card summary-income">
        <h3>Tổng thu</h3>
        <p className="summary-value">
          {moneyFormatter.format(totalIncome)}
        </p>
        <p className="summary-description">
          Thu nhập trong kết quả lọc
        </p>
      </article>

      <article className="summary-card summary-expense">
        <h3>Tổng chi</h3>
        <p className="summary-value">
          {moneyFormatter.format(totalExpense)}
        </p>
        <p className="summary-description">
          Chi tiêu trong kết quả lọc
        </p>
      </article>

      <article className="summary-card summary-difference">
        <h3>Chênh lệch thu − chi</h3>
        <p
          className={`summary-value ${
            difference < 0n ? "amount-expense" : "amount-income"
          }`}
        >
          {moneyFormatter.format(difference)}
        </p>
        <p className="summary-description">
          Không bao gồm số dư ban đầu
        </p>
      </article>
    </section>
  );
}