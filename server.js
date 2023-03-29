const express = require("express");
const dotenv = require("dotenv").config();
// security
const { default: helmet } = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hostValidator = require("host-validation");
const hpp = require("hpp");
// required files import
const connectDb = require("./config/dbConnection");
const AppError = require("./middleware/appError");
const globalErrorHandler = require("./middleware/globalErrorHandler");
const routerContact = require("./routes/contactRoutes");
const routerUsers = require("./routes/userRoutes");
const PORT = process.env.PORT;

const app = express();

// all global middlewares used here
app.use(express.json());
// passport.use(new Startegy(AUTH_OPTIONS, verifyCallback));
app.use(helmet()); //grp of middlewares for extra security
// app.use(passport.initialize());
app.use(mongoSanitize()); // used for NOSQL query injection attacks
app.use(xss()); // for data sanitization before storing on DBs
app.use(hpp()); // prevent parameter pollution and trims the parameter, (we can also whitelist some parameters)
app.use(
  hostValidator({ hosts: ["127.0.0.1:8000", "localhost:8000", "mydomain.com"] })
); // only whitelists these hosts to run our application

connectDb();

app.use("/api/users", routerUsers);
app.use("/api/contacts", routerContact);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`We are live on port: ${PORT}`);
});
