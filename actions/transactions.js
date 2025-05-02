"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import OpenAI from "openai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Scan Receipt
export async function scanReceipt_Gemini(file) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      // Convert ArrayBuffer to Base64
      const base64String = Buffer.from(arrayBuffer).toString("base64");
  
      const prompt = `
        Analyze this receipt image and extract the following information in JSON format:
        - Total amount (just the number)
        - Date (in ISO format)
        - Description or items purchased (brief summary)
        - Merchant/store name
        - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
        
        Only respond with valid JSON in this exact format:
        {
          "amount": number,
          "date": "ISO date string",
          "description": "string",
          "merchantName": "string",
          "category": "string"
        }
  
        If its not a recipt, return an empty object
      `;
  
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64String,
            mimeType: file.type,
          },
        },
        prompt,
      ]);
  
      const response = await result.response;
      const text = response.text();
      const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
  
      try {
        const data = JSON.parse(cleanedText);
        return {
          amount: parseFloat(data.amount),
          date: new Date(data.date),
          description: data.description,
          category: data.category,
          merchantName: data.merchantName,
        };
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Invalid response format from Gemini");
      }
    } catch (error) {
      console.error("Error scanning receipt:", error);
      throw new Error("Failed to scan receipt");
    }
  }
  

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  export async function scanReceipt_gpt(file) {
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
  
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: `Extract this receipt into JSON with keys: amount (number), date (ISO), description (string), merchantName (string), category (from list). If not a receipt, return {}.`,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });
  
    const text = response.choices[0].message.content;
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error("Failed to parse response from OpenAI");
    }
  }
  