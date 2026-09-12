"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function credentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Introduce tu email y contraseña." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  return { email, password };
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const values = credentials(formData);
  if ("error" in values) return values;
  const supabase = await createClient();
  if (!supabase) return { error: "Falta configurar Supabase. Añade las variables de entorno." };
  const { error } = await supabase.auth.signInWithPassword(values);
  if (error) return { error: "El email o la contraseña no son correctos." };
  redirect("/mylaunchr");
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const values = credentials(formData);
  if ("error" in values) return values;
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 2) return { error: "Introduce tu nombre para crear el perfil." };
  if (!/^[a-z0-9-]{3,30}$/.test(username)) return { error: "El nombre de usuario debe tener entre 3 y 30 caracteres: minúsculas, números y guiones." };
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone) || phone.replace(/\D/g, "").length < 7) return { error: "Introduce un teléfono válido." };
  const supabase = await createClient();
  if (!supabase) return { error: "Falta configurar Supabase. Añade las variables de entorno." };
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: values.email, password: values.password,
    options: { data: { full_name: name, username, phone }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Revisa tu email para confirmar la cuenta y continuar." };
  redirect("/mylaunchr");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
