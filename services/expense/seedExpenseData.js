import mongoose from "mongoose";
import dotenv from "dotenv";
import { addCategoriesService, addCognitiveTriggersService } from "./src/services/expenseService.js";
import {
    expenseCategoryCodesEnum,
    expenseCognitiveTriggerCodesEnum
} from "../smart-ai/src/data/expenseModelData.js";
import Category from "./src/models/Category.js";
import CognitiveTrigger from "./src/models/CognitiveTrigger.js";
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

const seedCategoriesAndTriggers = async () => {
    try {
        const categoriesPayload = expenseCategoryCodesEnum.map((code) => ({
            name: code,
            code,
            description: `Default description for ${code}`,
            color: "blue",
            image: "categoryImages/default.png",
            isOriginal: true,
        }));

        // Upsert categories: update existing or create new if not found
        const createdCategories = [];
        for (const categoryData of categoriesPayload) {
            let category = await Category.findOne({ code: categoryData.code });
            if (category) {
                // Update the description with the seed data if needed
                category.description = categoryData.description;
                await category.save();
            } else {
                category = new Category(categoryData);
                await category.save();
            }
            createdCategories.push(category);
        }
        console.log("Categories seeded successfully:", createdCategories);

        const cognitiveTriggerDescriptionsMapping = {
            impulseBuying: "A sudden urge to purchase without prior planning.",
            socialInfluence: "Buying influenced by peers, recommendations, or social norms.",
            emotionalSpending: "Purchases made to alleviate emotions such as stress or boredom.",
            scarcityPerception: "Buying due to fear of missing out on limited offers.",
            statusSeeking: "Purchases to signal wealth or status, often involving luxury goods.",
            rewardSeeking: "Spending motivated by the desire for discounts, loyalty points, or rewards.",
            habitualPurchasing: "Recurring purchases made out of routine or habit.",
            convenience: "Purchases made for the sake of ease, even at higher cost.",
            curiosity: "Buying something new to explore or experiment with.",
            selfIdentity: "Purchases that align with how you see or wish to present yourself.",
            guiltAvoidance: "Buying out of a sense of obligation, such as gifts for others.",
            obligation: "Purchases made out of a social or moral duty, such as donations.",
            nostalgia: "Spending triggered by memories or past experiences.",
            financialOptimism: "Spending in anticipation of future financial improvement.",
            cognitiveDissonance: "Justifying previous purchases by spending more."
        };

        const triggersPayload = expenseCognitiveTriggerCodesEnum.map((code) => ({
            name: code,
            code,
            description: cognitiveTriggerDescriptionsMapping[code] || `Default description for ${code}`,
        }));

        const createdTriggers = [];
        for (const triggerData of triggersPayload) {
            let trigger = await CognitiveTrigger.findOne({ code: triggerData.code });
            if (trigger) {
                // Update description if needed
                trigger.description = triggerData.description;
                await trigger.save();
            } else {
                trigger = new CognitiveTrigger(triggerData);
                await trigger.save();
            }
            createdTriggers.push(trigger);
        }

    console.log("Cognitive Triggers seeded successfully:", createdTriggers);

        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

connectDB().then(seedCategoriesAndTriggers);