//log setup
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDirectory = path.join(__dirname, "..", "logs");
initLogger(logDirectory);

import { showLogo } from "@expensio/sharedlib";

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const requiredEnvVars = [
	"NODE_ENV",
	"JWT_SECRET",
	"PORT",
	"EMAIL_PASSWORD",
	"EMAIL_FOR_SMTP",
	"PROD_DOMAIN",
	"TWILIO_ACCOUNT_SID",
	"TWILIO_AUTH_TOKEN",
	"TWILIO_PHONE_NUMBER",
	"DB_USER",
	"DB_PASSWORD",
	"DB_HOST",
	"DB_PORT",
	"DB_NAME",
	"SMTP_HOST",
	"SMTP_PORT",
	"KAFKA_BROKER_URL",
	// "DB_AIVEN_POSTGRES_CERT",
];

const checkEnvVariables = () => {
	const unsetEnv = requiredEnvVars.filter(
		(envVar) => typeof process.env[envVar] === "undefined"
	);
	if (unsetEnv.length > 0) {
		console.error(
			`Required ENV variables are not set: [${unsetEnv.join(", ")}]`
		);
		process.exit(1);
	}
};
checkEnvVariables();

import bodyParser from "body-parser";
import {
	errorHandlingMiddleware,
	initLogger,
	logError,
	logInfo,
} from "@expensio/sharedlib";
import userRoutes from "./routes/userRoutes.js";
import pool from "./config/db.js";
const app = express();

//start RabbitMQ

import { startKafka } from "./config/startKafka.js";
const startServices = async () => {
	showLogo();
	console.log(
		`${process.env.SERVICE_NAME.toUpperCase()} Service is BOOTING UP...`
	);
	try {
		await startKafka();
	} catch (error) {
		logError("Failed to start services: " + error);
		process.exit(1);
	}
};
await startServices();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Use routes
app.use("/api/user", userRoutes);
app.use(errorHandlingMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	logInfo(`User Service is running on port ${PORT}`);
});

process.on("SIGINT", () => {
	pool.end(() => {
		logInfo("PostgreSQL pool has ended");
	});
});
