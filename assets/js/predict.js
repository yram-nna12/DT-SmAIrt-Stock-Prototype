// Function to clean text input
function cleanText(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase();
}

// Process CSV function to auto-detect column names, including stock
function processCSV(text) {
    const rows = text.split("\n").map(row => row.trim()).filter(row => row);
    const headers = rows[0].split(",").map(h => h.trim().toLowerCase());

    // Detecting column indexes dynamically
    const productIndex = headers.findIndex(h => h.includes("product"));
    const salesIndex = headers.findIndex(h => h.includes("sales") || h.includes("quantity"));
    const dateIndex = headers.findIndex(h => h.includes("date"));
    const stockIndex = headers.findIndex(h => {
        const cleanedHeader = h.replace(/\s/g, ""); // Remove spaces for matching
        return cleanedHeader.includes("stock") || cleanedHeader.includes("inventory") || cleanedHeader.includes("availablestock") || cleanedHeader.includes("remaining") || cleanedHeader.includes("stocklevel");
    });

    if (productIndex === -1 || salesIndex === -1 || dateIndex === -1) {
        alert("CSV format is incorrect. Ensure it includes 'Product', 'Sales', and 'Date' columns.");
        return [];
    }

    if (stockIndex === -1) {
        console.warn("⚠️ Stock column not found in CSV. Defaulting stock values to 0.");
    }

    return rows.slice(1).map(row => {
        const columns = row.split(",");
        let rawStock = stockIndex !== -1 ? columns[stockIndex]?.trim() : "0";
        let cleanedStock = rawStock ? rawStock.replace(/[^0-9]/g, "") : "0";
        let parsedStock = parseInt(cleanedStock, 10);

        return {
            product: cleanText(columns[productIndex]),
            sales: parseInt(columns[salesIndex]) || 0,
            date: new Date(columns[dateIndex].trim()),
            stock: isNaN(parsedStock) ? 0 : parsedStock // Default to 0 if stock is invalid
        };
    }).filter(entry => !isNaN(entry.date.getTime())); // Remove invalid dates
}

// Function to predict future stock using a simple AI approach (Linear Regression)
function predictStock(productName, data, targetDate) {
    const enteredProduct = cleanText(productName);
    const matchingData = data.filter(entry => entry.product === enteredProduct);

    if (matchingData.length === 0) {
        displayMessage(`No historical data available for '${productName}'.`);
        return;
    }

    // Convert and sort dates
    matchingData.forEach(entry => entry.date = new Date(entry.date));
    matchingData.sort((a, b) => a.date - b.date);

    // Extract stock and dates
    const stockValues = matchingData.map(entry => entry.stock);
    const timestamps = matchingData.map(entry => entry.date.getTime());

    if (stockValues.length === 0 || stockValues.every(stock => stock === 0)) {
        displayMessage(`No stock data available for '${productName}'.`);
        return;
    }

    if (stockValues.length === 1) {
        // If only one data point, return the same stock value
        displayMessage(`Predicted needed stock for '${productName}' on ${targetDate}: ${stockValues[0]}`);
        return;
    }

    // Apply Linear Regression (Trend Prediction)
    let n = stockValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += timestamps[i];
        sumY += stockValues[i];
        sumXY += timestamps[i] * stockValues[i];
        sumX2 += timestamps[i] * timestamps[i];
    }

    let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    let intercept = (sumY - slope * sumX) / n;

    let futureTimestamp = new Date(targetDate).getTime();
    let predictedStock = Math.round(slope * futureTimestamp + intercept);

    if (predictedStock < 0) predictedStock = 0; // Avoid negative predictions

    displayMessage(`Predicted needed stock for '${productName}' on ${targetDate}: ${predictedStock}`);
}

// Function to display messages to the user
function displayMessage(message) {
    document.getElementById("predictionResult").innerText = message;
}

// Ensure all elements exist before running scripts
document.addEventListener("DOMContentLoaded", function() {
    let fileInput = document.getElementById("csvFile");
    let predictButton = document.getElementById("predictButton");

    if (!fileInput || !predictButton) {
        console.error("❌ Required elements not found in the DOM.");
        return;
    }

    console.log("✅ All required elements found!");

    // File Upload Event
    fileInput.addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                window.salesData = processCSV(e.target.result);
                console.log("📊 CSV Data Processed:", window.salesData);
            };
            reader.readAsText(file);
        }
    });

    // Predict Button Event
    predictButton.addEventListener("click", function() {
        const productName = document.getElementById("productInput").value;
        const dateInput = document.getElementById("dateInput").value;
        
        if (!window.salesData || window.salesData.length === 0) {
            displayMessage("No sales data loaded. Please upload a CSV file.");
            return;
        }
        
        predictStock(productName, window.salesData, dateInput); // Updated to call predictStock
    });
});