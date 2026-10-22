import dotenv from "dotenv";
import { z } from "zod";
import appsettings from "../../appsettings.json"

dotenv.config({ quiet: true });

// --- Схемы ---

const envSchema = z.object({
	DATABASE_URL: z.string().default(""),
})

const configSchema = z.object({
	Port: z.coerce.number().int().min(1).max(65535).default(3000),
	MinPasswordLength: z.coerce.number().int().min(4).default(6),
})

// --- Объединение (без deprecated .merge) ---

const fullConfigSchema = configSchema.extend(envSchema.shape)

// --- Парсинг ---

// Фильтруем undefined из process.env, чтобы не затирать appsettings
const env = Object.fromEntries(
	Object.entries(process.env).filter(([, v]) => v !== undefined)
)

const parsed = fullConfigSchema.safeParse({
	...appsettings,
	...env,
})

if (!parsed.success) {
	console.error("Invalid config:")
	console.error(parsed.error)
	process.exit(1)
}

const config = parsed.data

export type Config = z.infer<typeof fullConfigSchema>
export default config