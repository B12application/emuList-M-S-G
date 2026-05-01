// Fix TR translations
const fs = require('fs');

let content = fs.readFileSync('src/frontend/translations/tr.ts', 'utf8');

// 1. Add missing common keys
content = content.replace(
  "        back: 'Geri',\r\n    },\r\n\r\n    // Search",
  "        back: 'Geri',\r\n        save: 'Kaydet',\r\n        edit: 'Düzenle',\r\n        delete: 'Sil',\r\n        cancel: 'İptal',\r\n    },\r\n\r\n    // Search"
);

// 2. Replace the expenses block with expanded version
const oldExpenses = `    // Expenses
    expenses: {
        title: 'Harcamalar',
        addExpense: 'Harcama Ekle',
        editExpense: 'Harcamayı Düzenle',
        addCategory: 'Kategori Oluştur',
        createCategory: 'Kategoriyi Kaydet',
        category: 'Kategori',
        amount: 'Tutar',
        date: 'Tarih',
        description: 'Açıklama',
        expenseTitle: 'Harcama Başlığı',
        save: 'Kaydet',
        cancel: 'İptal',
        confirmDelete: 'Bu harcamayı silmek istediğinize emin misiniz?',
        confirmDeleteCategory: 'Bu kategoriyi tamamen silmek istiyor musunuz? Bu kategorideki TÜM harcamalar silinecektir.',
        noExpenses: 'Harcama bulunamadı.',
        monthlyChartTitle: 'Aylık Harcama Analizi',
        totalLabel: 'Toplam',
        currency: '₺',
        allCategories: 'Tümü',
        selectCategory: 'Kategori Seçin',
        categoryName: 'Kategori Adı',
        newCategory: 'Yeni Kategori',
        newCategoryPlaceholder: 'Örn: Tatil, Market, Araba',
        addSuccess: 'Harcama eklendi',
        updateSuccess: 'Harcama güncellendi',
        deleteSuccess: 'Harcama silindi',
        categoryAddSuccess: 'Kategori oluşturuldu',
        deleteCategorySuccess: 'Kategori ve harcamalar silindi',
    },
};`;

const newExpenses = `    // Expenses
    expenses: {
        title: 'Harcamalar',
        addExpense: 'Harcama Ekle',
        editExpense: 'Harcamayı Düzenle',
        addCategory: 'Kategori Oluştur',
        createCategory: 'Kategoriyi Kaydet',
        category: 'Kategori',
        amount: 'Tutar',
        date: 'Tarih',
        description: 'Açıklama',
        expenseTitle: 'Harcama Başlığı',
        save: 'Kaydet',
        cancel: 'İptal',
        confirmDelete: 'Bu harcamayı silmek istediğinize emin misiniz?',
        confirmDeleteCategory: 'Bu kategoriyi tamamen silmek istiyor musunuz? Bu kategorideki TÜM harcamalar silinecektir.',
        confirmDeleteCategoryTitle: 'Kategoriyi Sil',
        noExpenses: 'Harcama bulunamadı.',
        monthlyChartTitle: 'Aylık Harcama Analizi',
        totalLabel: 'Toplam',
        currency: '₺',
        allCategories: 'Tümü',
        selectCategory: 'Kategori Seçin',
        categoryName: 'Kategori Adı',
        newCategory: 'Yeni Kategori',
        newCategoryPlaceholder: 'Örn: Tatil, Market, Araba',
        addSuccess: 'Harcama eklendi',
        updateSuccess: 'Harcama güncellendi',
        deleteSuccess: 'Harcama silindi',
        categoryAddSuccess: 'Kategori oluşturuldu',
        deleteCategorySuccess: 'Kategori ve harcamalar silindi',
        // Installments
        installments: 'Taksit',
        installmentCount: 'Taksit Sayısı',
        installmentNote: 'Taksit ({current}/{total})',
        singlePayment: 'Tek Ödeme',
        // Tabs
        expensesTab: 'Harcamalar',
        reportsTab: 'Raporlar',
        // Monthly Summary
        monthlySummary: 'Aylık Özet',
        monthColumn: 'Ay',
        countColumn: 'Adet',
        // Import
        importStatement: 'Hesap Özeti Yükle',
        pasteStatement: 'Hesap özeti metnini buraya yapıştırın...',
        parseAndImport: 'Ayrıştır ve Ekle',
        previewImport: 'İçe Aktarma Önizleme',
        importSuccess: 'Harcamalar başarıyla eklendi',
        noDataParsed: 'Metinden harcama verisi ayrıştırılamadı.',
        parsedExpenses: '{count} harcama ayrıştırıldı',
        confirmImport: 'İçe Aktarmayı Onayla',
    },
};`;

// Try both CRLF and LF variants
let replaced = false;
if (content.includes(oldExpenses.replace(/\n/g, '\r\n'))) {
  content = content.replace(oldExpenses.replace(/\n/g, '\r\n'), newExpenses.replace(/\n/g, '\r\n'));
  replaced = true;
} else if (content.includes(oldExpenses)) {
  content = content.replace(oldExpenses, newExpenses);
  replaced = true;
}

if (!replaced) {
  console.log('WARNING: Could not find expenses block to replace. Trying flexible match...');
  // Use a more flexible approach
  const expensesStart = content.indexOf("    // Expenses");
  if (expensesStart >= 0) {
    const beforeExpenses = content.substring(0, expensesStart);
    content = beforeExpenses + newExpenses.replace(/\n/g, '\r\n') + '\r\n';
    replaced = true;
  }
}

fs.writeFileSync('src/frontend/translations/tr.ts', content);
console.log('TR translations updated. Replaced expenses:', replaced);
