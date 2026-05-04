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
      // Using the working GenelPara URL as fallback
      const directResponse = await fetch('https://api.genelpara.com/json/?list=altin');
      if (!directResponse.ok) throw new Error('Both proxy and direct fetch failed');
      return parseGoldData(await directResponse.json());
    }
    
    const data = await response.json();
    return parseGoldData(data);
  } catch (error) {
    console.error('Error fetching gold price:', error);
    return null;
  }
};

const parseGoldData = (data: any): GoldPrice | null => {
  try {
    // Handle different possible keys from different providers
    const goldData = data['gram-altin'] || data['gram_altin'] || data['GA'];
    
    if (!goldData) return null;

    const parsePrice = (priceStr: string | number) => {
      if (typeof priceStr === 'number') return priceStr;
      if (!priceStr) return 0;
      // Handle formats like "2.850,50" or "2850.50"
      return parseFloat(priceStr.toString().replace(/\./g, '').replace(',', '.'));
    };

    return {
      buy: parsePrice(goldData['Alış'] || goldData['Buying'] || goldData['Al'] || goldData['alis']),
      sell: parsePrice(goldData['Satış'] || goldData['Selling'] || goldData['Sat'] || goldData['satis']),
      change: goldData['Değişim'] || goldData['Change'] || goldData['degisim'] || '0%',
      updateDate: goldData['d'] || data['Update_Date'] || new Date().toLocaleString()
    };
  } catch (e) {
    console.error('Error parsing gold data:', e);
    return null;
  }
};
