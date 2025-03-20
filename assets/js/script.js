// Function to clean and normalize text (case insensitive)
function cleanText(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase();
}

// Process CSV File
// Updated processCSV function to auto-detect column names
function processCSV(text) {
    const rows = text.split("\n").map(row => row.trim()).filter(row => row);
    const headers = rows[0].split(",").map(h => h.trim().toLowerCase());

    // Try detecting column names dynamically
    const productIndex = headers.findIndex(h => h.includes("product"));
    const salesIndex = headers.findIndex(h => h.includes("sales") || h.includes("quantity"));
    const dateIndex = headers.findIndex(h => h.includes("date"));

    if (productIndex === -1 || salesIndex === -1 || dateIndex === -1) {
        alert("CSV format is incorrect. Ensure it includes Product, Sales, and Date columns.");
        return [];
    }

    return rows.slice(1).map(row => {
        const columns = row.split(",");
        return {
            product: cleanText(columns[productIndex]),
            sales: parseInt(columns[salesIndex]) || 0,
            date: columns[dateIndex].trim()
        };
    });
}
