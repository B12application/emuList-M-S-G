import fs from 'fs';
import path from 'path';

interface UsageData {
  [date: string]: number;
}

const USAGE_FILE = path.join(process.cwd(), 'usage.json');

export class UsageService {
  private static getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private static readData(): UsageData {
    if (!fs.existsSync(USAGE_FILE)) {
      return {};
    }
    try {
      const content = fs.readFileSync(USAGE_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading usage file:', error);
      return {};
    }
  }

  private static writeData(data: UsageData): void {
    try {
      fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing usage file:', error);
    }
  }

  static getUsage(): { count: number; limit: number } {
    const data = this.readData();
    const today = this.getToday();
    return {
      count: data[today] || 0,
      limit: 20
    };
  }

  static incrementUsage(): number {
    const data = this.readData();
    const today = this.getToday();
    data[today] = (data[today] || 0) + 1;
    this.writeData(data);
    return data[today];
  }

  static isLimitReached(): boolean {
    const { count, limit } = this.getUsage();
    return count >= limit;
  }
}
