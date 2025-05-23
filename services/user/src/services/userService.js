import * as userModel from "../models/userModel.js";
import * as otpModel from "../models/otpModel.js";
import pool from "../config/db.js";

import { produceEvent, TOPICS } from "@expensio/sharedlib";
import { EVENTS } from "@expensio/sharedlib";

import { sendVerificationEmailService } from "../services/emailService.js";

import { NotFoundError, InternalServerError } from "@expensio/sharedlib";
import { connectKafka } from "../config/connectKafka.js";

export const checkUsernameAvailabilityService = async (username) => {
	try {
		return await userModel.checkUsernameAvailabilityModel(username);
	} catch (error) {
		throw new InternalServerError("Failed to check username availability.");
	}
};

export const createUserService = async (userData) => {
	let user;
	try {
		user = await userModel.createUserModel(userData);
	} catch (error) {
		throw new InternalServerError("Failed to create user.");
	}

	// Verifying email
	// if (user.email) {
	// 	try {
	// 		await sendVerificationEmailService(user.id);
	// 	} catch (error) {
	// 		console.log("Error sending email verification: \n", error);
	// 	}
	// }

	return user;
};

export const findUserByIdService = async (userId) => {
	try {
		return await userModel.findUserByIdModel(userId);
	} catch (error) {
		throw new NotFoundError("User not found.");
	}
};

export const findUserByPhoneService = async (phone) => {
	try {
		return await userModel.findUserByPhoneModel(phone);
	} catch (error) {
		throw new NotFoundError("User not found by phone.");
	}
};

export const findUserByEmailService = async (email) => {
	try {
		return await userModel.findUserByEmailModel(email);
	} catch (error) {
		throw new NotFoundError("User not found by email.");
	}
};

export const updateUserProfileService = async (userId, updates) => {
	try {
		const updatedUserDetails = await userModel.updateUserProfileModel(
			userId,
			updates
		);
		return { user: updatedUserDetails };
	} catch (error) {
		throw new InternalServerError("Failed to update user profile.");
	}
};

export const verifyUserEmailService = async (email) => {
	try {
		await userModel.verifyUserEmailModel(email);
	} catch (error) {
		throw new InternalServerError("Failed to verify user email.");
	}
};

export const deleteUserService = async (userId, userPhone) => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		// Mark user_exists as FALSE in otp_requests
		await otpModel.markUserDoesNotExistsModel(userPhone, client);

		// Soft delete the user
		const rowsDeleted = await userModel.softDeleteUserModel(userId, client);

		if (rowsDeleted === 0) {
			throw new NotFoundError("User not found for deletion.");
		}

		await client.query("COMMIT");

		// Publish the UserDeleted event after commit ONLY
		const { producerInstance } = await connectKafka();
		await produceEvent(
			EVENTS.USER_DELETED,
			{ userId, userPhone },
			TOPICS.USER,
			producerInstance
		);

		return rowsDeleted;
	} catch (_error) {
		await client.query("ROLLBACK");

		throw new InternalServerError(
			"Failed to delete user and update OTP requests."
		);
	} finally {
		client.release();
	}
};

export const undoDeleteUserService = async (userId, userPhone) => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		// Mark user_exists as TRUE in otp_requests (compensating action)
		await otpModel.markUserExistsModel(userPhone, client);

		// Undo the soft deletion
		const rowsUpdated = await userModel.undoSoftDeleteUserModel(userId, client);

		if (rowsUpdated === 0) {
			throw new NotFoundError("User not found or not marked as deleted.");
		}

		await client.query("COMMIT");
		return rowsUpdated;
	} catch (error) {
		await client.query("ROLLBACK");

		// If rollback of the rollback fails, log it but don't propagate
		// (there's not much more we can do at this point)

		throw new InternalServerError("Failed to undo the deletion of the user.");
	} finally {
		client.release();
	}
};
