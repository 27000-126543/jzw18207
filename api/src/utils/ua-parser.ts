export interface UAParsed {
  device_type: string;
  os: string;
  browser: string;
}

export function parseUserAgent(ua: string): UAParsed {
  const result: UAParsed = {
    device_type: 'Unknown',
    os: 'Unknown',
    browser: 'Unknown',
  };

  if (!ua) return result;

  const lower = ua.toLowerCase();

  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(lower)) {
    if (/ipad|tablet|playbook|silk/.test(lower) && !/mobile/.test(lower)) {
      result.device_type = 'Tablet';
    } else {
      result.device_type = 'Mobile';
    }
  } else {
    result.device_type = 'Desktop';
  }

  if (/windows/.test(lower)) result.os = 'Windows';
  else if (/mac os x|macintosh/.test(lower)) result.os = 'macOS';
  else if (/android/.test(lower)) result.os = 'Android';
  else if (/iphone|ipad|ipod|ios/.test(lower)) result.os = 'iOS';
  else if (/linux/.test(lower)) result.os = 'Linux';

  if (/micromessenger|wechat/.test(lower)) result.browser = 'WeChat';
  else if (/edg\//.test(lower)) result.browser = 'Edge';
  else if (/chrome|crios/.test(lower)) result.browser = 'Chrome';
  else if (/safari/.test(lower)) result.browser = 'Safari';
  else if (/firefox|fxios/.test(lower)) result.browser = 'Firefox';
  else if (/opera|opr/.test(lower)) result.browser = 'Opera';

  return result;
}

export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}
