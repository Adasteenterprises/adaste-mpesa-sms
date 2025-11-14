// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------- File Storage ----------------------
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const LOANS_FILE = path.join(DATA_DIR, "loans.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(LOANS_FILE)) fs.writeFileSync(LOANS_FILE, "[]");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const ADMIN_BOOTSTRAP_KEY = process.env.ADMIN_BOOTSTRAP_KEY || "bootstrap_change_me";

// Helpers
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJson = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

const generateId = (prefix, list) => `${prefix}${list.length + 1}`;

function findUserByEmail(email) {
  const users = readJson(USERS_FILE);
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// ---------------------- Auth Middleware ----------------------
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing token" });

  const token = auth.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

const roleRequired = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: "Forbidden" });
  next();
};

// ---------------------- Bootstrap Admin ----------------------
app.post("/api/bootstrap-admin", (req, res) => {
  const { name, email, password, key } = req.body;

  if (key !== ADMIN_BOOTSTRAP_KEY)
    return res.status(403).json({ error: "Invalid bootstrap key" });

  const users = readJson(USERS_FILE);
  if (users.some((u) => u.role === "admin"))
    return res.status(400).json({ error: "Admin already exists" });

  const hashed = bcrypt.hashSync(password, 10);

  const admin = {
    id: generateId("A", users.filter((u) => u.role === "admin")),
    name,
    email,
    password: hashed,
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  users.push(admin);
  writeJson(USERS_FILE, users);

  res.json({
    message: "Admin created",
    admin: { id: admin.id, name: admin.name, email: admin.email },
  });
});

// ---------------------- Login ----------------------
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  const user = findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  if (!bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  const safe = { ...user };
  delete safe.password;

  res.json({ token, user: safe });
});

// ---------------------- OFFICER ROUTES ----------------------

// GET all officers
app.get(
  "/api/officers",
  authMiddleware,
  roleRequired(["admin", "officer"]),
  (req, res) => {
    const users = readJson(USERS_FILE);
    const officers = users
      .filter((u) => u.role === "officer")
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
      }));
    res.json({ officers });
  }
);

// CREATE officer
app.post(
  "/api/officers",
  authMiddleware,
  roleRequired(["admin"]),
  (req, res) => {
    const { name, email } = req.body;

    if (findUserByEmail(email))
      return res.status(400).json({ error: "Email already exists" });

    const users = readJson(USERS_FILE);
    const defaultPassword = "TempPass123";
    const hashed = bcrypt.hashSync(defaultPassword, 10);

    const officer = {
      id: generateId("O", users.filter((u) => u.role === "officer")),
      name,
      email,
      password: hashed,
      role: "officer",
      createdAt: new Date().toISOString(),
    };

    users.push(officer);
    writeJson(USERS_FILE, users);

    res.json({
      message: "Officer created successfully",
      officer: { id: officer.id, name: officer.name, email: officer.email },
      defaultPassword,
    });
  }
);

// ---------------------- ADMIN: Create Investor ----------------------
app.post(
  "/api/admin/create-investor",
  authMiddleware,
  roleRequired(["admin"]),
  (req, res) => {
    const { name, email, password } = req.body;

    if (findUserByEmail(email))
      return res.status(400).json({ error: "Email exists" });

    const users = readJson(USERS_FILE);
    const hashed = bcrypt.hashSync(password, 10);

    const investor = {
      id: generateId("I", users.filter((u) => u.role === "investor")),
      name,
      email,
      password: hashed,
      role: "investor",
      investments: [],
      createdAt: new Date().toISOString(),
    };

    users.push(investor);
    writeJson(USERS_FILE, users);

    res.json({ message: "Investor created", investor });
  }
);

// ---------------------- CREATE CLIENT ----------------------
app.post(
  "/api/officer/create-client",
  authMiddleware,
  roleRequired(["officer", "admin"]),
  (req, res) => {
    const { name, email, phone, initialPassword } = req.body;

    if (findUserByEmail(email))
      return res.status(400).json({ error: "Email exists" });

    const users = readJson(USERS_FILE);
    const hashed = bcrypt.hashSync(initialPassword, 10);

    const client = {
      id: generateId("C", users.filter((u) => u.role === "client")),
      name,
      email,
      phone,
      password: hashed,
      role: "client",
      loanBalance: 0,
      createdAt: new Date().toISOString(),
    };

    users.push(client);
    writeJson(USERS_FILE, users);

    res.json({ message: "Client created", client });
  }
);

// ---------------------- CLIENT: Change password ----------------------
app.post(
  "/api/client/change-password",
  authMiddleware,
  roleRequired(["client"]),
  (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const users = readJson(USERS_FILE);
    const user = users.find((u) => u.id === req.user.id);

    if (!bcrypt.compareSync(oldPassword, user.password))
      return res.status(401).json({ error: "Old password incorrect" });

    user.password = bcrypt.hashSync(newPassword, 10);
    writeJson(USERS_FILE, users);

    res.json({ message: "Password updated" });
  }
);

// ---------------------- LOAN APPLY ----------------------
app.post(
  "/api/loans/apply",
  authMiddleware,
  roleRequired(["client"]),
  (req, res) => {
    const { amount, term, purpose } = req.body;

    const loans = readJson(LOANS_FILE);

    const loan = {
      id: generateId("L", loans),
      clientId: req.user.id,
      amount,
      term,
      purpose,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    loans.push(loan);
    writeJson(LOANS_FILE, loans);

    res.json({ message: "Loan submitted", loan });
  }
);

// ---------------------- NEW IMPORTANT ADMIN ROUTES ----------------------

// Get ALL loans (matches frontend)
app.get(
  "/api/loans/all",
  authMiddleware,
  roleRequired(["admin", "officer"]),
  (req, res) => {
    const loans = readJson(LOANS_FILE);
    const users = readJson(USERS_FILE);

    const detailed = loans.map((loan) => {
      const client = users.find((u) => u.id === loan.clientId);
      return {
        ...loan,
        clientName: client ? client.name : "Unknown",
      };
    });

    res.json({ loans: detailed });
  }
);

// Update loan (approve/decline)
app.put(
  "/api/loans/update/:id",
  authMiddleware,
  roleRequired(["admin"]),
  (req, res) => {
    const { status } = req.body;
    const loans = readJson(LOANS_FILE);
    const loan = loans.find((l) => l.id === req.params.id);

    if (!loan) return res.status(404).json({ error: "Loan not found" });

    if (!["approved", "declined"].includes(status.toLowerCase()))
      return res.status(400).json({ error: "Invalid status" });

    loan.status = status.toLowerCase();
    loan.updatedAt = new Date().toISOString();

    writeJson(LOANS_FILE, loans);

    res.json({ message: "Loan updated", loan });
  }
);

// ---------------------- GET CLIENTS ----------------------
app.get(
  "/api/clients",
  authMiddleware,
  roleRequired(["admin", "officer"]),
  (req, res) => {
    const users = readJson(USERS_FILE);
    const clients = users
      .filter((u) => u.role === "client")
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
      }));
    res.json(clients);
  }
);

// ---------------------- GET LOANS ----------------------
app.get("/api/loans", authMiddleware, (req, res) => {
  const loans = readJson(LOANS_FILE);

  if (req.user.role === "client")
    return res.json(loans.filter((l) => l.clientId === req.user.id));

  if (req.user.role === "investor") return res.json([]);

  res.json(loans);
});

// ---------------------- WHO AM I ----------------------
app.get("/api/me", authMiddleware, (req, res) => {
  const users = readJson(USERS_FILE);
  const user = users.find((u) => u.id === req.user.id);
  const safe = { ...user };
  delete safe.password;
  res.json(safe);
});

// ---------------------- ROOT ----------------------
app.get("/", (req, res) => {
  res.send("✅ ADASTE Loan System JSON Backend Running");
});

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
