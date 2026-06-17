export interface IPLocation {
  province: string;
  city: string;
}

const cityData = [
  { province: '北京', city: '北京', weight: 15 },
  { province: '上海', city: '上海', weight: 14 },
  { province: '广东', city: '广州', weight: 12 },
  { province: '广东', city: '深圳', weight: 12 },
  { province: '浙江', city: '杭州', weight: 10 },
  { province: '四川', city: '成都', weight: 9 },
  { province: '湖北', city: '武汉', weight: 8 },
  { province: '陕西', city: '西安', weight: 7 },
  { province: '江苏', city: '南京', weight: 6 },
  { province: '重庆', city: '重庆', weight: 7 },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function parseIPLocation(ip: string): IPLocation {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return { province: '本地', city: '本地' };
  }
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) {
    return { province: '内网', city: '内网' };
  }
  
  const parts = ip.split('.');
  const prefix = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : ip;
  const h = hash(prefix);
  const totalWeight = cityData.reduce((s, c) => s + c.weight, 0);
  let idx = h % totalWeight;
  for (const city of cityData) {
    idx -= city.weight;
    if (idx < 0) {
      return { province: city.province, city: city.city };
    }
  }
  return { province: '未知', city: '未知' };
}
