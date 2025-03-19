import { currentUser } from "@clerk/nextjs/server";
import {db} from "@/lib/prisma";

export const checkUser = async () => {
    const user = await currentUser();
    if (!user) {
        return null;
    }
    
    try {
        const prismaUser = await db.user.findUnique({
            where: {
                clerkUserId: user.id,
            },
        });
        
        if (!prismaUser) {
            const newUser = await db.user.create({
                data: {
                    clerkUserId: user.id,
                    email: user.emailAddresses[0].emailAddress,
                    name: user.fullName,
                    imageUrl: user.imageUrl,
                },
            })
        }
        return prismaUser;
        
    } catch (error) {
        console.error("Error fetching user from database:", error);
        return null;
    }
};