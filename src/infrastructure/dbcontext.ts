import { PrismaPg } from "@prisma/adapter-pg";
import config from "../config/config";
import type { Credential } from "../prisma/generated/prisma/browser";
import {
	type Prisma,
	PrismaClient,
	type User,
} from "../prisma/generated/prisma/client";

export const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: config.DATABASE_URL }),
});

export async function GetUser(id: string): Promise<User | null> {
	return client.user.findFirst({ where: { id } });
}

export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
	return client.user.create({ data });
}

export async function createUserCredentials(
	userid: string,
): Promise<Credential> {
	return client.credential.create({ data: { userId: userid } });
}

export async function getCredentialByEmail(
	email: string,
): Promise<Credential | null> {
	return client.credential.findFirst({ where: { email, providerId: null } });
}

export async function createUserWithLocalCredentials(
	email: string,
	passwordHash: string,
): Promise<User> {
	return client.user.create({
		data: { credentials: { create: { email, passwordHash } } },
	});
}
