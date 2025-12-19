// src/frontend/utils/pdfExport.ts
import { jsPDF } from 'jspdf';
import type { MediaItem } from '../../backend/types/media';

// Türkçe karakter dönüşümü (jsPDF font sınırlaması için)
function turkishToAscii(text: string): string {
    const map: { [key: string]: string } = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    };
    return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, char => map[char] || char);
}

// Medya tipini Türkçe'ye çevir
function getTypeName(type: string): string {
    const types: { [key: string]: string } = {
        'movie': 'Film',
        'series': 'Dizi',
        'game': 'Oyun',
        'book': 'Kitap'
    };
    return types[type] || type;
}

// Medya listesini PDF olarak export et
export function exportToPDF(items: MediaItem[], title: string = 'Medya Listem') {
    const doc = new jsPDF();

    // Başlık
    doc.setFontSize(22);
    doc.setTextColor(220, 38, 38); // Kırmızı
    doc.text(turkishToAscii(title), 20, 25);

    // Tarih
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    const date = new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    doc.text(turkishToAscii(`Olusturulma: ${date}`), 20, 33);

    // Özet istatistikler
    const watchedCount = items.filter(i => i.watched).length;
    const totalCount = items.length;
    doc.setFontSize(11);
    doc.setTextColor(64, 64, 64);
    doc.text(turkishToAscii(`Toplam: ${totalCount} | Izlenen: ${watchedCount} | Izlenecek: ${totalCount - watchedCount}`), 20, 42);

    // Çizgi
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 47, 190, 47);

    // Liste
    let yPosition = 57;
    const lineHeight = 8;
    const pageHeight = 280;

    // Türe göre grupla
    const groupedByType = items.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
    }, {} as { [key: string]: MediaItem[] });

    // Her tür için liste oluştur
    Object.entries(groupedByType).forEach(([type, typeItems]) => {
        // Sayfa kontrolü
        if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 25;
        }

        // Tür başlığı
        doc.setFontSize(14);
        doc.setTextColor(59, 130, 246); // Mavi
        doc.text(turkishToAscii(`${getTypeName(type)} (${typeItems.length})`), 20, yPosition);
        yPosition += lineHeight + 2;

        // İçerikler
        doc.setFontSize(10);
        typeItems.forEach((item, index) => {
            // Sayfa kontrolü
            if (yPosition > pageHeight) {
                doc.addPage();
                yPosition = 25;
            }

            // Sıra numarası ve başlık
            const status = item.watched ? '[X]' : '[ ]';
            const rating = `(${item.rating}/10)`;
            const line = `${status} ${index + 1}. ${item.title} ${rating}`;

            doc.setTextColor(item.watched ? 34 : 128, item.watched ? 197 : 128, item.watched ? 94 : 128);
            doc.text(turkishToAscii(line.substring(0, 80)), 25, yPosition);

            yPosition += lineHeight;
        });

        yPosition += 5; // Gruplar arası boşluk
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`emuList - Sayfa ${i}/${pageCount}`, 105, 290, { align: 'center' });
    }

    // İndir
    doc.save(`${turkishToAscii(title.replace(/\s+/g, '-'))}.pdf`);
}
