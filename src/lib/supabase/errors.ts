const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Já existe uma conta com esse e-mail.",
  "Password should be at least 6 characters":
    "A senha precisa ter pelo menos 8 caracteres.",
  "Unable to validate email address: invalid format":
    "Formato de e-mail inválido.",
};

export function translateAuthError(message: string) {
  return MESSAGES[message] ?? message;
}
