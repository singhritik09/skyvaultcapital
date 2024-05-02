import express from "express";
import cors from "cors";
import connectDB from "./database.js";
import session from "express-session";
import bcrypt from "bcrypt";
import MongoStore from "connect-mongo";
import AuditLogs from "./models/BankingModels/audit.js";
import axios from "axios";
import Query from "./models/BankingModels/query.js";
import sendEmail from "./utils/mail.js";
import { RECEIVER_EMAIL } from "./constants.js";
import router from "./routes.js";
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true // Enable sending cookies
}));

app.use(session({
  secret: 'secretkey', // Add your secret
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set secure: true if using HTTPS
}));

app.use("/", router); // All routes defined in router.js will be prefixed with '/'
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
