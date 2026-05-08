const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function testRead() {
  const dir = path.join(__dirname, 'ekstreler');
  
  // Full vadesiz text 
  const vadesizFile = 'vadesiz2yıl.pdf';
  const buf = fs.readFileSync(path.join(dir, vadesizFile));
  const data = await pdfParse(buf);
  // Write full text to a file for analysis
  fs.writeFileSync(path.join(__dirname, 'vadesiz_full_text.txt'), data.text);
  console.log('Vadesiz total chars:', data.text.length);
  console.log('Written to vadesiz_full_text.txt');
  
  // Also try a few more credit card ones
  const ccFile = '15.10.2025 tarihli Enpara.com kredi kartı ekstreniz.pdf';
  const ccBuf = fs.readFileSync(path.join(dir, ccFile));
  const ccData = await pdfParse(ccBuf);
  fs.writeFileSync(path.join(__dirname, 'cc_oct2025_full_text.txt'), ccData.text);
  console.log('CC Oct 2025 total chars:', ccData.text.length);
  
  // Another CC 
  const ccFile2 = '03.04.2026 tarihli Enpara.com kredi kartı ekstreniz.pdf';
  const ccBuf2 = fs.readFileSync(path.join(dir, ccFile2));
  const ccData2 = await pdfParse(ccBuf2);
  fs.writeFileSync(path.join(__dirname, 'cc_apr2026_full_text.txt'), ccData2.text);
  console.log('CC Apr 2026 total chars:', ccData2.text.length);
}

testRead().catch(console.error);
