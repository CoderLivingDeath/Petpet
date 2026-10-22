import {
	createUser,
	createUserCredentials,
	createUserWithLocalCredentials,
	GetUser,
	getCredentialByEmail,
} from "../infrastructure/dbcontext";
import { fail, ok, type Result } from "../infrastructure/Result";
import {
	type Credential,
	Prisma,
	type User,
} from "../prisma/generated/prisma/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string): string | null {
	const normalized = email.trim().toLowerCase();
	return EMAIL_PATTERN.test(normalized) ? normalized : null;
}

function validatePassword(password: string): string | null {
	if (password.length < MIN_PASSWORD_LENGTH) {
		return `password must be at least ${MIN_PASSWORD_LENGTH} characters`;
	}
	return null;
}

export async function getUserById(id: string): Promise<Result<User>> {
	const user = await GetUser(id);

	if (user == null) return fail({ message: "User not found" });

	return ok(user);
}

export async function createNewUser(name: string): Promise<Result<User>> {
	if (!name.trim()) return fail({ message: "name is required" });

	try {
		const user = await createUser({ name });
		return ok(user);
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === "P2002") return fail({ message: "user already exists" });
		}
		if (e instanceof Error) return fail({ message: e.message });
		return fail({ message: "unknown error" });
	}
}

export async function createNewUserCredentials(
	userId: string,
): Promise<Result<Credential>> {
	if (!userId) return fail({ message: "userId is required" });

	try {
		const credentials = await createUserCredentials(userId);
		return ok(credentials);
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === "P2003") return fail({ message: "user not found" });
			if (e.code === "P2002")
				return fail({ message: "credentials already exist" });
		}
		if (e instanceof Error) return fail({ message: e.message });
		return fail({ message: "unknown error" });
	}
}

export async function register(
	email: string,
	password: string,
): Promise<Result<User>> {
	const normalizedEmail = normalizeEmail(email);
	if (normalizedEmail == null) return fail({ message: "invalid email" });

	const passwordError = validatePassword(password);
	if (passwordError) return fail({ message: passwordError });

	try {
		const existing = await getCredentialByEmail(normalizedEmail);
		if (existing) return fail({ message: "email already registered" });

		const passwordHash = await Bun.password.hash(password);
		const user = await createUserWithLocalCredentials(
			normalizedEmail,
			passwordHash,
		);
		return ok(user);
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === "P2002")
				return fail({ message: "email already registered" });
		}
		if (e instanceof Error) return fail({ message: e.message });
		return fail({ message: "unknown error" });
	}
}

export async function login(
	email: string,
	password: string,
): Promise<Result<User>> {
	const normalizedEmail = normalizeEmail(email);
	if (normalizedEmail == null) return fail({ message: "invalid email" });

	const credential = await getCredentialByEmail(normalizedEmail);
	if (credential?.passwordHash == null) {
		return fail({ message: "invalid email or password" });
	}

	const passwordMatches = await Bun.password.verify(
		password,
		credential.passwordHash,
	);
	if (!passwordMatches) return fail({ message: "invalid email or password" });

	return getUserById(credential.userId);
}
