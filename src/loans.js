const loans = [];

export const applyLoan = (req, res) => {
  const { clientId, amount, term, purpose } = req.body;
  const loan = {
    id: `L${loans.length + 1}`,
    clientId,
    amount,
    term,
    purpose,
    status: "Pending",
  };
  loans.push(loan);
  res.json({ message: "Loan application submitted.", loan });
};

export const approveLoan = (req, res) => {
  const { id } = req.params;
  const loan = loans.find((l) => l.id === id);
  if (!loan) return res.status(404).json({ message: "Loan not found" });
  loan.status = "Approved";
  res.json({ message: "Loan approved successfully.", loan });
};

export const rejectLoan = (req, res) => {
  const { id } = req.params;
  const loan = loans.find((l) => l.id === id);
  if (!loan) return res.status(404).json({ message: "Loan not found" });
  loan.status = "Rejected";
  res.json({ message: "Loan rejected successfully.", loan });
};
