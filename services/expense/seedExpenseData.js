import mongoose from "mongoose";
import { addCategoriesService, addCognitiveTriggersService } from "./src/services/expenseService.js";
import { expenseCategoryCodesEnum, expenseCognitiveTriggerCodesEnum } from "../smart-ai/src/data/expenseModelData.js";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const seedExpenseData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Prepare categories payload
        const categoriesPayload = expenseCategoryCodesEnum.map((code) => ({
            name: code.replace(/([A-Z])/g, " $1").trim(),
            code,
            description: `Default description for ${code}`,
            color: "blue",
            image: "categoryImages/default.png",
            isOriginal: true,
        }));

        // Prepare cognitive triggers payload
        const cognitiveTriggersPayload = expenseCognitiveTriggerCodesEnum.map((code) => ({
            name: code.replace(/([A-Z])/g, " $1").trim(),
            code,
            description: `Default description for ${code}`,
        }));

        // Seed categories and cognitive triggers
        const createdCategories = await addCategoriesService(categoriesPayload);
        const createdCognitiveTriggers = await addCognitiveTriggersService(cognitiveTriggersPayload);

        console.log("Expense Categories seeded successfully:", createdCategories);
        console.log("Expense Cognitive Triggers seeded successfully:", createdCognitiveTriggers);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding expense data:", error);
        process.exit(1);
    }
};

seedExpenseData();
