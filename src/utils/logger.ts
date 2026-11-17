// src/utils/logger.ts
import * as Sentry from '@sentry/react-native';

function getTimestamp(): string {
    return new Date().toISOString();
  }
  
  function redactSensitive(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email removido]')
    .replace(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/g, 'Bearer [token removido]')
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, '[chave removida]');
}

function parseError(error: unknown): string {
    let raw: string;
    if (error instanceof Error) raw = error.message;
    else if (typeof error === 'string') raw = error;
    else {
      try { raw = JSON.stringify(error); } catch { raw = 'Erro desconhecido'; }
    }
    return redactSensitive(raw);
  }
  
  export function logError(context: string, error: unknown): void {
    console.error(`[ZEREI][${context}] ${parseError(error)} | ${getTimestamp()}`);
    Sentry.captureException(error instanceof Error ? error : new Error(parseError(error)), {
      tags: { context },
    });
  }
  
  export function logEvent(event: string, data?: object): void {
    console.log(`[ZEREI][EVENT] ${event}${data ? ' | ' + JSON.stringify(data) : ''} | ${getTimestamp()}`);
  }