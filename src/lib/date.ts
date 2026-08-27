/**
 * Datas exibidas no site.
 *
 * O Postgres grava `timestamptz` em UTC e o servidor do Next roda em UTC (na
 * Vercel sempre, e em máquina de desenvolvimento quase sempre). Formatar com o
 * fuso do processo faz o horário da noite virar o dia seguinte: quem edita um
 * envio às 23h de terça no Brasil vê "editado em quarta".
 *
 * Por isso o fuso é explícito. Fixá-lo também mantém servidor e cliente
 * mostrando a mesma coisa — data calculada com o fuso do processo num lado e o
 * do navegador no outro é erro de hidratação na certa.
 *
 * O público do site é brasileiro; se um dia isso mudar, o caminho é guardar o
 * fuso no perfil e passá-lo aqui em vez de trocar a constante.
 */
const SITE_TIME_ZONE = "America/Sao_Paulo";

/** 26/08/2026 */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: SITE_TIME_ZONE });
}

/** agosto de 2026 */
export function formatMonthYear(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: SITE_TIME_ZONE,
    month: "long",
    year: "numeric",
  });
}
