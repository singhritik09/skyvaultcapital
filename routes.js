import express, { response } from "express";
import cors from 'cors';
import connectDB from "./database.js";
import BankingUsers from './models/BankingModels/users.js';
import Loan from "./models/BankingModels/loan.js";
import Employees from "./models/BankingModels/employee.js";
import ApprovedLoan from "./models/BankingModels/approved.js";
import Transactions from "./models/BankingModels/transactions.js";
import UserTransaction from "./models/BankingModels/userTransactions.js";
import Bonds from "./models/BankingModels/bonds.js";
import BondsOrder from "./models/BankingModels/bondOrders.js";
import session from 'express-session';
import bcrypt from 'bcrypt';
import MongoStore from 'connect-mongo';
import AuditLogs from "./models/BankingModels/audit.js";
import axios from "axios";
import Query from "./models/BankingModels/query.js";
import sendEmail from './utils/mail.js';
import { RECEIVER_EMAIL } from "./constants.js";

connectDB();

const router=express.Router();
const app=express();
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

function generateRandomNumber() {
    return Math.floor(100 + Math.random() * 900);
  }
  function getCurrentDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
  
    return dd + '/' + mm + '/' + yyyy;
  }
  
  
  function generateLoanId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let loanId = '';
  
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      loanId += characters[randomIndex];
    }
  
    return loanId;
  }
  
  function calculateAmountPerMonth(amount, time, interestRate) {
    const monthlyInterestRate = (interestRate / 100) / 12;
  
    const numberOfMonths = time * 12;
    const monthlyPayment = (amount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -numberOfMonths));
  
    return monthlyPayment.toFixed(2);
  }
  router.get('/', async (req, res) => {
    console.log("Home: ", req.session)
    res.send("user");
  });
  
router.post("/signup", async (req, res) => {
    const { name, email, password, cpass, pancardNum, mobileNum } = req.body;
    var aname = name;
    const fullName = name.replace(/\s+/g, '');
    const finalName = fullName.toLowerCase()
    const userId = finalName + "@sky" + generateRandomNumber()
    const existingUser = await BankingUsers.findOne({ $or: [{ email: email }, { mobileNum: mobileNum }] });
    const hashPsw = await bcrypt.hash(password, 12);
    const panRegex = /^[A-Za-z]{5}\d{4}[A-Za-z]$/;
  
  
    if (existingUser) {
      return res.status(400).json({ message: "PRESENT" });
    }
    else {
  
      
      try {
        if (!panRegex.test(pancardNum)) {
          console.log("Invalid card")
          return res.status(401).json({ message: "Invalid Card" });
        }
  
        if (password === cpass) {
          const user = await BankingUsers.create({
            userId: userId,
            name: aname,
            email: email,
            password: hashPsw,
            pancardNum: pancardNum,
            mobileNum: mobileNum,
            balance:0,
            transactionHistory:[]
          });
          console.log("Inserted", user);
          const name = user.name;
          res.status(200).json({ message: "SUCCESS", name: name });
        }
        else {
          return res.status(202).json({ message: "NOTMATCH" });
        }
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });
  const authenticate = (req, res, next) => {
    if (req.session.authenticated) {
        next(); 
    } else {
        res.status(401).json({ message: "Unauthorized" }); // User is not authenticated, send unauthorized response
    }
  };
  
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
        const user = await BankingUsers.findOne({ email });
  
        if (!user) {
            return res.status(202).json({ message: "NOTMATCH" });
        }
  
        const checkEncrypted = await bcrypt.compare(password, user.password);
        
        if (checkEncrypted) {
            req.session.authenticated = true;
            req.session.userId = user.userId;
            req.session.isDashboard = false;
            
            await req.session.save();
  
            console.log("Login session:", req.session);
            return res.status(200).json({ message: "SUCCESS", userId: user.userId });
        } else {
            return res.status(202).json({ message: "NOTMATCH" });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.post("/logout",async(req,res)=>{
  
    try{
      req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: "Internal server error" });
        }
        console.log("Session destroyed");
        return res.status(200).json({ message: "Logged out successfully" });
      });
    }catch(error){
      console.log("Error in logout");
      return res.status(500).json({"message":"Internal Server Error"})
    }
  
  });
  
  // Assuming you have your Express server set up with the authenticate middleware
  
  // Route with authentication middleware
  router.get("/auth/status", authenticate, (req, res) => {
    // This route will only be accessible to authenticated users
    // If the user reaches here, it means they are authenticated
    res.status(200).json({ authenticated: true });
  });
  
  router.get("/dashboard", async (req, res) => {
    const userId = req.session.userId;
    try {
        
        const user = await BankingUsers.find({ userId });
  
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
  
        // Send user data along with authentication status
        res.status(200).json({ authenticated: true, user });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: "Internal server error" });
    }
  });
  
  
  router.post("/query",async (req,res)=>{
      const{email,password,query,description}=req.body
      const queryIns=await Query.create({
        email:email,
        query:query,
        description:description
      })
      console.log("Query Sent")
      const emailSent = await sendEmail(email,password ,RECEIVER_EMAIL, query, description);
  
      if (emailSent) {
        res.status(200).json({ message: "Successful" });
    } else {
        res.status(500).json({ message: "Error sending email" });
    }
  });
  
  
  router.post("/employee-login", async (req, res) => {
    const { employeeId, password } = req.body;
    const datetime = new Date();
  
    try {
      const employee = await Employees.findOne({ employeeId: employeeId });
      console.log(employee)
      if (!employee) {
        return res.status(202).json({ message: "NOTMATCH" });
      }
      if (employee.password === password) {
        const audit=await AuditLogs.create({
          employeeId:employeeId,
          role:employee.role,
          date:datetime
        });
        return res.status(200).json({ message: "SUCCESS" });
      } else {
        return res.status(202).json({ message: "NOTMATCH" });
      }
    } catch (error) {
      console.error("Error during employee login:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  router.post("/loan", async (req, res) => {
    const { amount, time, pancardNum } = req.body
    const user = await BankingUsers.findOne({ pancardNum: pancardNum })
    if (!user) {
      return res.status(202).json({ message: "CREATE" })
    }
  
    if (amount < 5000) {
      return res.status(400).json({ message: "Low amount" })
    }
    const loanId = generateLoanId();
    const userId = user.userId;
    const interest = 10;
    const amountPermonth = calculateAmountPerMonth(amount, time, interest);
  
    const issueDate = getCurrentDate().toString();
    const returnDate = "24/03/2024";
    const returned = false;
    const mobileNum = user.mobileNum;
    const loan = await Loan.create({
      loanId: loanId,
      userId: userId,
      pancardNum: pancardNum,
      amount: amount,
      interest: interest,
      amountPermonth: amountPermonth,
      issueDate: issueDate,
      returnDate: returnDate,
      returned: returned,
      mobileNum: mobileNum,
      approved: false
    })
    console.log("Loan application submitted ", loan)
    return res.status(200).json({ message: "SUCCESS" })
  
  })
  
  router.get("/loan-applications", async (req, res) => {
    try {
      const response = await Loan.find({});
      console.log(response);
      return res.send(response);
    } catch (error) {
      console.error("Error fetching loans:", error);
      return res.status(500).send("Internal Server Error");
    }
  })
  
  router.post("/loan-applications", async (req, res) => {
    const approve = req.body.approve;
    const loanId = req.body.loanId;
    console.log(approve);
    console.log(loanId);
    try {
      const loan = await Loan.findOne({ loanId: loanId });
  
      if (!loan) {
        return res.status(404).send("Loan not found");
      }
      loan.approved = approve;
      await loan.save();
      if (approve) {
        const approvedLoan = await ApprovedLoan.create({
          loanId: loan.loanId,
          userId: loan.userId,
          pancardNum: loan.pancardNum,
          amount: loan.amount,
          interest: loan.interest,
          amountPermonth: loan.amountPermonth,
          issueDate: loan.issueDate,
          returnDate: loan.returnDate,
          returned: loan.returned,
          mobileNum: loan.mobileNum,
          approved: loan.approved
        });
      }
      await loan.deleteOne();
      // console.log("Approval status updated:", approve, "for loanId:", loanId);
      res.send("Approval status updated");
    } catch (error) {
      console.error("Error updating approval status:", error);
      res.status(500).send("Internal Server Error");
    }
  })
  
  router.get("/approved-loans",async(req,res)=>{
    const loans=await ApprovedLoan.find({});
    res.send(loans);
  })
  
  router.post("/transaction", async (req, res) => {
    const { amount, receiverId, password } = req.body;
    const userId=req.session.userId;
    const senderId=userId;
    const sender = await BankingUsers.findOne({ userId: senderId });
    const receiver = await BankingUsers.findOne({ userId: receiverId });
    const transactionAmount = parseFloat(amount);
    console.log(sender.email);
    console.log(receiver.email);
    const checkEncrypted = await bcrypt.compare(password, sender.password);
  
    if (!sender || !receiver) {
      return res.status(202).json({ message: "NOTEXIST" });
    }
    if (!checkEncrypted) {
      console.log("Not match pass")
      return res.status(202).json({ message: "NOTMATCH" });
    } else if (senderId === receiverId) {
      return res.status(202).json({ message: "IDMATCH" });
    } else if (amount > sender.balance) {
      return res.status(202).json({ message: "EXCEEDED" });
    } else {
      const datetime = new Date();
      const uid = generateLoanId();
  
      const senderTransaction = {
        transactionId: uid,
        userId: senderId,
        receiverId: receiverId,
        amount: -transactionAmount, // Negative amount for debiting sender's account
        debit: true,
        time: datetime
      };
  
      const receiverTransaction = {
        transactionId: uid,
        userId: receiverId,
        receiverId: senderId,
        amount: transactionAmount,
        credit: true,
        time: datetime
      };
  
      sender.balance -= transactionAmount;
      receiver.balance += transactionAmount;
  
      sender.transactionHistory.push(senderTransaction);
      receiver.transactionHistory.push(receiverTransaction);
  
      const transaction = await Transactions.create({
        transactionId: generateLoanId(),
        amount: transactionAmount,
        senderId: senderId,
        receiverId: receiverId,
        time: datetime
      })
  
  
      await sender.save();
      await receiver.save();
  
      console.log(transaction);
      return res.status(200).json({ message: "SUCCESS" });
    }
  });
  
  
  router.get("/bonds", async (req, res) => {
    const userId=req.session.userId;
    const data = await Bonds.find({});
    res.send(data);
  })
  
  router.post("/bonds", async (req, res) => {
    
    const userId=req.session.userId;
    const user=await BankingUsers.findOne({userId:userId});
    console.log("userID:",userId);
    const { bondId, quantity,password } = req.body;
    const bond = await Bonds.findOne({ bondId: bondId })
    const transactionAmount = parseInt(bond.price);
    const total = transactionAmount * quantity;
    const checkEncrypted = await bcrypt.compare(password, user.password);
  
    if(checkEncrypted){
      try {
        const newTransaction = await BondsOrder.create({
          bondId: bondId,
          userId:userId,
          bondName: bond.bondName,
          price: bond.price,
          interest: bond.interest,
          totalAmount: total
        })
        bond.maxAvailable -= quantity;
        await bond.save();
        const order ={
          bondId: bondId,
          userId:userId,
          bondName: bond.bondName,
          price: bond.price,
          interest: bond.interest,
          totalAmount: total
        }
  
        user.balance -= total;
    
        user.bondPurchase.push(order);
        await user.save();
        console.log(user.bondPurchase);
      }
      catch (e) {
        console.log("Error:", e)
      }
    
    }
    return res.status(200).json({ message: "SUCCESS" });
  });
  
  router.get("/transaction-history", async (req, res) => {
    const userId = req.session.userId;
    try {
        const user= await BankingUsers.findOne({ userId });
  
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ message: "User not found" });
        }
  
        let transactionHistory = user.transactionHistory;
        
        res.status(200).json(transactionHistory);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  
  router.get("/audit-logs",async(req,res)=>{
    const data=await AuditLogs.find({}).sort({ date: -1 });;
    res.send(data);
  })

  export default router;
