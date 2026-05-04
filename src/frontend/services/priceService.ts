// src/frontend/services/priceService.ts

export interface GoldPrice {
  buy: number;
  sell: number;
  change: string;
  updateDate: string;
}

export const fetchGoldPrice = async (): Promise<GoldPrice | null> => {
  try {
    // In production, we use our Netlify function proxy to avoid CORS and 404 issues
    // In development, this will also work if netlify-cli is used, or it will fallback to direct fetch
    const response = await fetch('/api/gold-price');
    
    if (!response.ok) {
      console.warn('Proxy fetch failed, falling back to direct fetch');
      const directResponse = await fetch('https://finans.truncgil.com/today.json');
      if (!directResponse.ok) throw new Error('Both proxy and direct fetch failed');
      return parseTruncgilData(await directResponse.json());
    }
    
    const data = await response.json();
    return parseTruncgilData(data);
  } catch (error) {
    console.error('Error fetching gold price:', error);
    return null;
  }
};

const parseTruncgilData = (data: any): GoldPrice | null => {
  try {
    // Handle different possible keys from Truncgil (they change frequently)
    const goldData = data['gram-altin'] || data['gram_altin'] || data['GA'];
    
    if (!goldData) return null;

    const parsePrice = (priceStr: string | number) => {
      if (typeof priceStr === 'number') return priceStr;
      return parseFloat(priceStr.replace('.', '').replace(',', '.'));
    };

    return {
      buy: parsePrice(goldData['Alış'] || goldData['Buying'] || goldData['Al']),
      sell: parsePrice(goldData['Satış'] || goldData['Selling'] || goldData['Sat']),
      change: goldData['Değişim'] || goldData['Change'] || goldData['Deiim'] || '0%',
      updateDate: data['Update_Date'] || new Date().toLocaleString()
    };
  } catch (e) {
    console.error('Error parsing Truncgil data:', e);
    return null;
  }
};
