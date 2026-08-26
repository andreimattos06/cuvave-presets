/**
 * Tetos de tamanho de tudo que o usuário digita. Ficam num arquivo só para o
 * formulário (maxLength), o zod das server actions e as constraints do banco
 * (supabase/migrations/0004_security_limits.sql) contarem a mesma história.
 */
export const LIMITS = {
  /** RFC 5321: 64 no nome, 255 no domínio, 254 no endereço inteiro. */
  emailMax: 254,
  emailLocalMax: 64,
  emailDomainMax: 255,
  /** O bcrypt do Supabase Auth trunca em 72 bytes — acima disso é ilusão de força. */
  passwordMin: 8,
  passwordMax: 72,
  usernameMin: 3,
  usernameMax: 24,
  bandNameMax: 80,
  songTitleMax: 120,
  uploadTitleMin: 3,
  uploadTitleMax: 80,
  uploadNoteMax: 400,
  trackNameMax: 60,
  presetNameMax: 40,
  tracksPerUpload: 10,
  presetsPerTrack: 8,
  searchQueryMax: 80,
} as const;

/**
 * Corta qualquer campo de texto muito antes de qualquer validação mais cara.
 * Um POST com 5 MB num input não deve nem chegar ao regex.
 */
export const HARD_TEXT_MAX = 1000;
