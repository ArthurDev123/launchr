"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {};

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);
  const isSignup = mode === "signup";
  const state = isSignup ? signUpState : signInState;
  const action = isSignup ? signUpAction : signInAction;
  const pending = isSignup ? signUpPending : signInPending;

  return <div className="auth-card">
    <div className="auth-tabs"><button className={!isSignup ? "selected" : ""} onClick={() => setMode("login")} type="button">Entrar</button><button className={isSignup ? "selected" : ""} onClick={() => setMode("signup")} type="button">Crear cuenta</button></div>
    <div className="auth-intro"><span className="eyebrow">MYLAUNCHR</span><h1>{isSignup ? "Crea tu espacio." : "Qué bueno verte."}</h1><p>{isSignup ? "Comparte tus landings con el mundo y empieza a vender." : "Entra a tu espacio de creador para seguir lanzando."}</p></div>
    <form action={action} className="auth-form">
      {isSignup && <label>Nombre completo<input name="name" type="text" autoComplete="name" placeholder="Tu nombre" required /></label>}
      {isSignup && <label>Nombre de usuario<input name="username" type="text" autoComplete="username" placeholder="tu-nombre" pattern="[a-z0-9-]{3,30}" minLength={3} maxLength={30} required /><small>3–30 caracteres, minúsculas, números y guiones.</small></label>}
      {isSignup && <label>Teléfono<input name="phone" type="tel" autoComplete="tel" placeholder="+34 600 000 000" required /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" placeholder="tu@email.com" required /></label>
      <label>Contraseña<input name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} placeholder="Mínimo 8 caracteres" minLength={8} required /></label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-success" role="status">{state.message}</p>}
      <button className="button button-dark auth-submit" disabled={pending} type="submit">{pending ? "Un momento..." : isSignup ? "Crear mi cuenta" : "Entrar en myLaunchr"} <i>↗</i></button>
    </form>
    <p className="auth-switch">{isSignup ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes cuenta?"} <button type="button" onClick={() => setMode(isSignup ? "login" : "signup")}>{isSignup ? "Inicia sesión" : "Crea una ahora"}</button></p>
  </div>;
}
