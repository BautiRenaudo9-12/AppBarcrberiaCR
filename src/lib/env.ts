import { z } from "zod";

const envSchema = z.object({
  VITE_ADMIN_EMAIL: z.string().email(),
  VITE_VAPID_KEY: z.string().min(1, "VAPID Key is required"),
  VITE_FIREBASE_CONFIG: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid JSON for VITE_FIREBASE_CONFIG" }
  ),
});

export const validateEnv = () => {
  const env = {
    VITE_ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL,
    VITE_VAPID_KEY: import.meta.env.VITE_VAPID_KEY,
    VITE_FIREBASE_CONFIG: import.meta.env.VITE_FIREBASE_CONFIG,
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    // Fail fast: don't let the app boot with invalid/missing configuration.
    throw new Error("Invalid environment configuration. Check VITE_* variables.");
  }

  console.log("✅ Environment configuration valid");
};
