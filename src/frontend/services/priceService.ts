// src/frontend/services/priceService.ts

export interface GoldPrice {
  buy: number;
  sell: number;
  change: string;
  updateDate: string;
}

export const fetchGoldPrice = async (): Promise<GoldPrice | null> => {
  try {
    const response = await fetch('https://finans.truncgil.com/today.json');
    if (!response.ok) throw new Error('Price fetch failed');
    
    const data = await response.json();
    const goldData = data['gram-altin'];
    
    if (!goldData) return null;

    // Prices come in format "6.633,97" - need to convert to number
    const parsePrice = (priceStr: string) => {
      return parseFloat(priceStr.replace('.', '').replace(',', '.'));
    };

    return {
      buy: parsePrice(goldData['Alış']),
      sell: parsePrice(goldData['Satış']),
      change: goldData['Değişim'],
      updateDate: data['Update_Date']
    };
  } catch (error) {
    console.error('Error fetching gold price:', error);
    return null;
  }
};
