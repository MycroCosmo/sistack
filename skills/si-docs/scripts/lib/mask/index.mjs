const REDACTED = '[REDACTED]';
export const isIdentifier = value => /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test(value);

/** 텍스트 로그용 보수적 마스킹. 반환값만 산출물에 저장한다. */
export function mask(input) {
  if (typeof input !== 'string') throw new TypeError('mask에는 문자열만 전달합니다');
  const text = input
    .replace(/(?:[a-z]:[\\/]+Users[\\/]+|\/(?:home|Users)\/)[^\\/\r\n]+[\\/]+/gi, '~/')
    .replace(/(\b(?:jsessionid|session[_-]?id)\b["']?\s*[:=]\s*)(\[REDACTED\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;&}\]]+)/gi, `$1${REDACTED}`)
    .replace(/(jdbc:oracle:thin:)[^\s/@]+\/[^\s@]+@/gi, `$1${REDACTED}@`)
    .replace(/(\/\/)[^\s/@:]+:[^\s/@]+@/g, `$1${REDACTED}@`)
    .replace(/(["']?(?:[\w.-]*(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key)[\w.-]*)["']?\s*[:=]\s*)(\[REDACTED\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;&}\]]+)/gi, `$1${REDACTED}`)
    .replace(/(\bAuthorization\s*:\s*(?:Bearer|Basic)\s+)\S+/gi, `$1${REDACTED}`)
    .replace(/-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z]+ )*PRIVATE KEY-----/g, REDACTED)
    .replace(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/gi, REDACTED)
    .replace(/((?:계좌(?:번호)?|카드(?:번호)?|account(?:[_ -]?number)?|card(?:[_ -]?number)?)\s*[:=]?\s*)\d(?:[\d -]{5,}\d)/gi, `$1${REDACTED}`);
  const numbers = part => part
    .replace(/(?<!\d)\d{6}[- ]?[1-8]\d{6}(?!\d)/g, REDACTED)
    .replace(/(?<!\d)(?:(?:\+82[- .]?(?:0)?|0)(?:1[016789]|2|[3-6][1-5]|70)[- .]?\d{3,4}[- .]?\d{4})(?!\d)/g, REDACTED)
    .replace(/((?:계좌(?:번호)?|카드(?:번호)?|account(?:[_ -]?number)?|card(?:[_ -]?number)?)\s*[:=]?\s*)\d(?:[\d -]{5,}\d)/gi, `$1${REDACTED}`)
    .replace(/(?<![\d-])(?:\d{2,6}-){2,4}\d{2,6}(?![\d-])/g, (value) => value.replace(/-/g, '').length >= 10 ? REDACTED : value)
    .replace(/(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g, REDACTED)
    .replace(/(?<!\d)\d{10,12}(?!\d)/g, REDACTED);
  // 비밀값 라벨은 먼저 가리고 진단 식별자·WAS 스레드 밖의 숫자만 개인정보 패턴과 비교한다.
  const identifiers = /(?<![\w-])(?:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}|[a-f0-9]{64}|[a-f0-9]{40}|[a-f0-9]{32})(?![\w-])/gi;
  const threads = /(?<![\w-])(?:qtp\d+-\d+|http-(?:nio2?|bio|apr)-\d+-exec-\d+|ajp-[\w.-]+|http\d+-w\d+(?:\s+\[[\w.-]+-\d+\])?|[\w.-]+-wq-\d+|jeus-[\w.-]+|ExecuteThread:\s*['"]?\d+['"]?)(?![\w-])/gi;
  const preserved = new RegExp(`${threads.source}|${identifiers.source}`, 'gi');
  let result = '', end = 0;
  for (const match of text.matchAll(preserved)) { result += numbers(text.slice(end, match.index)) + match[0]; end = match.index + match[0].length; }
  return result + numbers(text.slice(end));
}
