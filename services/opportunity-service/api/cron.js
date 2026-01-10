export default async function handler(req, res) {
  // Verify this is coming from Vercel Cron
  const authHeader = req.headers.authorization || '';
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Import dynamically to avoid issues
    const { importCompanies } = await import('../lib/import-with-descriptions.js');
    const result = await importCompanies();
    
    return res.status(200).json({ 
      success: true,
      imported: result.count,
      message: 'Companies imported successfully'
    });
  } catch (error) {
    console.error('Import failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
