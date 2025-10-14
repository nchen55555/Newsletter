import fs from 'fs';
import path from 'path';

export default async function PrivacyPage() {
  // Read the HTML file content at build time
  const htmlContent = fs.readFileSync(
    path.join(process.cwd(), 'app/privacy/page.html'), 
    'utf-8'
  );

  return (
    <div className="privacy-page">
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="max-w-4xl mx-auto p-6"
      />
    </div>
  );
}