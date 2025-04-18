// src/pages/auth/UserDataForm.jsx
import React, { useEffect, useState } from "react"; // Added useState
import {
	CssBaseline,
	Box,
	Typography,
	Button,
	TextField,
	Grid,
	Link,
} from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate, useLocation } from "react-router-dom";
import {
	useVerifyOtpMutation,
	useCheckUsernameAvailabilityMutation, // Imported the mutation hook
} from "../../state/api";
import { useDispatch } from "react-redux";
import { setUserInfo, setToken } from "../../state/authSlice";
import { toast, ToastContainer } from "react-toastify";
import { motion } from "framer-motion";
import { Formik, Form, useFormikContext } from "formik"; // Imported useFormikContext
import * as yup from "yup";
import "react-toastify/dist/ReactToastify.css";
import backgroundImage from "/auth-background.jpg"; // Replace with your image path

const BackgroundContainer = styled(Box)({
	minHeight: "100vh",
	backgroundImage: `url(${backgroundImage})`,
	backgroundSize: "cover",
	backgroundPosition: "center",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
});

const GlassCard = styled(Box)(({ theme }) => ({
	backdropFilter: "blur(10px)",
	backgroundColor: "rgba(255, 255, 255, 0.1)",
	padding: theme.spacing(6),
	borderRadius: theme.spacing(2),
	boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
	maxWidth: 600,
	width: "100%",
}));

const StyledButton = styled(Button)(({ theme }) => ({
	marginTop: theme.spacing(4),
	padding: theme.spacing(1.5),
	fontSize: "1.2rem",
	fontWeight: "bold",
	borderRadius: theme.spacing(1),
	backgroundColor: "#238efa",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	"& .MuiInputBase-input": {
		color: "#fff",
	},
	"& label": {
		color: "#aaa",
	},
	"& label.Mui-focused": {
		color: "#fff",
	},
	"& .MuiInput-underline:after": {
		borderBottomColor: "#fff",
	},
	"& .MuiOutlinedInput-root": {
		"& fieldset": {
			borderColor: "#aaa",
		},
		"&:hover fieldset": {
			borderColor: "#fff",
		},
		"&.Mui-focused fieldset": {
			borderColor: "#fff",
		},
	},
}));

// Define the UsernameField component
const UsernameField = () => {
	const { values, handleChange, handleBlur, touched, errors } =
		useFormikContext();
	const [usernameAvailability, setUsernameAvailability] = useState("");
	const [checkUsernameAvailability] = useCheckUsernameAvailabilityMutation();

	useEffect(() => {
		// Initialize a timer for debouncing
		const handler = setTimeout(() => {
			const username = values.username.trim();

			if (username) {
				// Call the mutation to check availability
				checkUsernameAvailability({ username })
					.unwrap()
					.then((response) => {
						if (response.isAvailable) {
							setUsernameAvailability("Username available");
						} else {
							setUsernameAvailability("Username not available");
						}
					})
					.catch((error) => {
						// Display the error message from backend
						console.log(error);
						setUsernameAvailability(
							error?.data?.error?.message || "Error checking username"
						);
					});
			} else {
				// If username is empty, clear the message
				setUsernameAvailability("");
			}
		}, 1000); // 1 second debounce

		// Cleanup the timer on effect cleanup
		return () => {
			clearTimeout(handler);
		};
	}, [values.username, checkUsernameAvailability]);

	return (
		<Grid item xs={12}>
			<StyledTextField
				variant="outlined"
				fullWidth
				label="Username"
				name="username"
				value={values.username}
				onChange={handleChange}
				onBlur={handleBlur}
				error={touched.username && Boolean(errors.username)}
				helperText={touched.username && errors.username}
			/>
			{/* Display username availability message */}
			{usernameAvailability && (
				<Typography
					variant="body2"
					sx={{
						color:
							usernameAvailability === "Username available"
								? "#79fc3d"
								: "#f75959",
						mt: 1,
					}}
				>
					{usernameAvailability}
				</Typography>
			)}
		</Grid>
	);
};

const UserDataForm = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const email = location.state?.email || "";
	const initialOtp = location.state?.otp || "";
	const [verifyOtp] = useVerifyOtpMutation();

	useEffect(() => {
		if (!email) navigate("/login");
	}, [email, navigate]);

	const formSchema = yup.object().shape({
		firstName: yup.string().required("This is a required field."),
		lastName: yup.string(),
		username: yup.string().required("This is a required field."),
		bio: yup.string(),
		// dateOfBirth: yup.date().nullable(),
		phone: yup
			.string()
			.matches(
				/^\+91\d{10}$/,
				"Invalid phone number. Must start with +91 followed by 10 digits."
			)
			.required("This is a required field."),
		otp: yup
			.string()
			.length(6, "OTP must be 6 digits")
			.required("OTP is required"),
	});

	// const currentDate = new Date().toISOString().split("T")[0];

	const handleSubmit = async (values, { setSubmitting }) => {
		try {
			const response = await verifyOtp({
				email,
				otp: values.otp,
				userData: { ...values, email },
			}).unwrap();

			if (response.token) {
				dispatch(setUserInfo(response.user));
				dispatch(setToken(response.token));
				toast.success(response.message);
				navigate("/dashboard");
			} else {
				toast.error(response.message || "Failed to complete registration");
			}
		} catch (err) {
			const message = err.data?.error?.message || "Error submitting user data.";
			console.error(err);
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<BackgroundContainer>
			<CssBaseline />
			<ToastContainer />
			<GlassCard
				component={motion.div}
				initial={{ opacity: 0, y: 50 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 1 }}
			>
				<Typography
					variant="h4"
					align="center"
					gutterBottom
					sx={{ color: "#fff" }}
				>
					Complete Your Profile
				</Typography>
				<Formik
					initialValues={{
						firstName: "",
						lastName: "",
						username: "",
						bio: "",
						// dateOfBirth: currentDate,
						phone: "",
						otp: initialOtp,
					}}
					validationSchema={formSchema}
					onSubmit={handleSubmit}
				>
					{({
						errors,
						touched,
						handleChange,
						handleBlur,
						values,
						isSubmitting,
					}) => (
						<Form>
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<StyledTextField
										variant="outlined"
										fullWidth
										label="First Name"
										name="firstName"
										value={values.firstName}
										onChange={handleChange}
										onBlur={handleBlur}
										error={touched.firstName && Boolean(errors.firstName)}
										helperText={touched.firstName && errors.firstName}
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<StyledTextField
										variant="outlined"
										fullWidth
										label="Last Name"
										name="lastName"
										value={values.lastName}
										onChange={handleChange}
										onBlur={handleBlur}
										error={touched.lastName && Boolean(errors.lastName)}
										helperText={touched.lastName && errors.lastName}
									/>
								</Grid>
								{/* Replace the existing Username field with UsernameField component */}
								<UsernameField />
								<Grid item xs={12}>
									<StyledTextField
										variant="outlined"
										fullWidth
										label="Email"
										name="email"
										value={email}
										disabled
									/>
								</Grid>
								<Grid item xs={12}>
									<StyledTextField
										variant="outlined"
										fullWidth
										label="Phone Number"
										name="phone"
										placeholder="+917XXXXXXXXX"
										value={values.phone}
										onChange={handleChange}
										onBlur={handleBlur}
										error={touched.phone && Boolean(errors.phone)}
										helperText={touched.phone && errors.phone}
									/>
								</Grid>
								{/* <Grid item xs={12}>
                                    <StyledTextField
                                        variant="outlined"
                                        fullWidth
                                        label="Date of Birth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={values.dateOfBirth}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        error={touched.dateOfBirth && Boolean(errors.dateOfBirth)}
                                        helperText={touched.dateOfBirth && errors.dateOfBirth}
                                    />
                                </Grid> */}
								<Grid item xs={12}>
									<StyledTextField
										variant="outlined"
										fullWidth
										label="Bio"
										name="bio"
										multiline
										rows={4}
										value={values.bio}
										onChange={handleChange}
										onBlur={handleBlur}
										error={touched.bio && Boolean(errors.bio)}
										helperText={touched.bio && errors.bio}
									/>
								</Grid>
								<Grid item xs={12}>
									<Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
										Enter OTP
									</Typography>
									<StyledTextField
										variant="outlined"
										fullWidth
										name="otp"
										value={values.otp}
										onChange={handleChange}
										onBlur={handleBlur}
										error={touched.otp && Boolean(errors.otp)}
										helperText={touched.otp && errors.otp}
										InputProps={{
											style: {
												letterSpacing: "0.5rem",
												fontSize: "1.5rem",
												textAlign: "center",
												color: "#fff",
											},
										}}
									/>
								</Grid>
							</Grid>
							<StyledButton
								type="submit"
								fullWidth
								variant="contained"
								color="primary"
								disabled={isSubmitting}
								component={motion.button}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								Submit
							</StyledButton>
						</Form>
					)}
				</Formik>
				<Grid container justifyContent="center" sx={{ mt: 2 }}>
					<Grid item>
						<Link href="/login" variant="body2" sx={{ color: "#fff" }}>
							{"Back to Login"}
						</Link>
					</Grid>
				</Grid>
			</GlassCard>
		</BackgroundContainer>
	);
};

export default UserDataForm;
