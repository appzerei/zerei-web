// src/utils/format.ts

/**
 * Formata uma data ISO para dd/mm/aaaa
 * @param date string ISO (ex: "2025-04-01T00:00:00.000Z")
 * @param locale padrão 'pt-BR', use 'en-US' para inglês
 */
export function formatDate(date: string, locale: string = 'pt-BR'): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  
  /**
   * Formata dias de streak em texto legível
   * PT: "1 dia", "3 dias", "1 semana", "2 semanas e 3 dias"
   * EN: "1 day", "3 days", "1 week", "2 weeks and 3 days"
   */
  export function formatStreak(days: number, locale: string = 'pt-BR'): string {
    const isPT = locale === 'pt-BR';
    if (days <= 0) return isPT ? '0 dias' : '0 days';
  
    const weeks = Math.floor(days / 7);
    const remainder = days % 7;
  
    if (days === 1) return isPT ? '1 dia' : '1 day';
    if (days < 7)  return isPT ? `${days} dias` : `${days} days`;
  
    const weekLabel = weeks === 1
      ? (isPT ? '1 semana' : '1 week')
      : (isPT ? `${weeks} semanas` : `${weeks} weeks`);
  
    if (remainder === 0) return weekLabel;
  
    const dayLabel = remainder === 1
      ? (isPT ? '1 dia' : '1 day')
      : (isPT ? `${remainder} dias` : `${remainder} days`);
  
    return isPT
      ? `${weekLabel} e ${dayLabel}`
      : `${weekLabel} and ${dayLabel}`;
  }
  
  /**
   * Formata valor monetário em padrão brasileiro
   * PT: "R$ 89,90" | EN: "$89.90"
   */
  export function formatCurrency(value: number, locale: string = 'pt-BR'): string {
    if (locale === 'pt-BR') {
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
    return `$${value.toFixed(2)}`;
  }
  
  /**
   * Formata tempo relativo em português ou inglês
   * PT: "há 2 horas", "há 3 dias", "há 1 mês"
   * EN: "2 hours ago", "3 days ago", "1 month ago"
   */
  export function formatRelativeTime(date: string, locale: string = 'pt-BR'): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
  
    const isPT = locale === 'pt-BR';
    const diffMs      = Date.now() - d.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours   = Math.floor(diffMs / 3600000);
    const diffDays    = Math.floor(diffMs / 86400000);
    const diffMonths  = Math.floor(diffDays / 30);
    const diffYears   = Math.floor(diffDays / 365);
  
    if (diffMinutes < 1)   return isPT ? 'agora mesmo'   : 'just now';
    if (diffMinutes < 60)  return isPT ? `há ${diffMinutes} min`       : `${diffMinutes} min ago`;
    if (diffHours < 24)    return isPT ? `há ${diffHours} hora${diffHours > 1 ? 's' : ''}` : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30)     return isPT ? `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`    : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffMonths < 12)   return isPT ? `há ${diffMonths} mês${diffMonths > 1 ? 'es' : ''}` : `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return isPT ? `há ${diffYears} ano${diffYears > 1 ? 's' : ''}` : `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  }
  
  /**
   * Formata horas totais em formato legível
   * PT: "3h", "1d 6h" | EN: "3h", "1d 6h"
   */
  export function formatHours(totalHours: number): string {
    if (totalHours < 24) return `${totalHours}h`;
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }