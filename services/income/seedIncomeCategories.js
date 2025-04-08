import mongoose from "mongoose";
import { addCategoriesService } from "./src/services/incomeService.js";
import { incomeCategoryCodesEnum } from "../smart-ai/src/data/incomeModelData.js";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const seedIncomeCategories = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Prepare categories payload
        const categoriesPayload = incomeCategoryCodesEnum.map((code) => ({
            name: code.replace(/([A-Z])/g, " $1").trim(),
            code,
            description: `Default description for ${code}`,
            color: "blue",
            image: "categoryImages/default.png",
            isOriginal: true,
        }));

        // Seed categories
        const createdCategories = await addCategoriesService(categoriesPayload);
        console.log("Income Categories seeded successfully:", createdCategories);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding income categories:", error);
        process.exit(1);
    }
};

seedIncomeCategories();
