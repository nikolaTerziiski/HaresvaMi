import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Въведи имейл адрес.")
      .email("Въведи валиден имейл адрес."),
    password: z.string().min(8, "Паролата трябва да е поне 8 символа."),
    confirmPassword: z.string().min(1, "Потвърди паролата си."),
    acceptTerms: z.boolean().refine((value) => value, {
      message: "Трябва да приемеш условията, за да продължиш.",
    }),
  })
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Паролите не съвпадат.",
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Въведи имейл адрес.")
    .email("Въведи валиден имейл адрес."),
  password: z.string().min(1, "Въведи паролата си."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Въведи имейл адрес.")
    .email("Въведи валиден имейл адрес."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Паролата трябва да е поне 8 символа."),
    confirmPassword: z.string().min(1, "Потвърди новата парола."),
  })
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Паролите не съвпадат.",
      });
    }
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const restaurantSetupSchema = z.object({
  restaurantName: z
    .string()
    .trim()
    .min(2, "Напиши името на ресторанта си.")
    .max(80, "Името е твърде дълго."),
});

export type RestaurantSetupFormValues = z.infer<typeof restaurantSetupSchema>;
