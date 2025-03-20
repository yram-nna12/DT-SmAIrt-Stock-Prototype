// Function to clean text input
function cleanText(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase();
}

// Updated processCSV function to auto-detect column names
function processCSV(text) {
    const rows = text.split("\n").map(row => row.trim()).filter(row => row);
    const headers = rows[0].split(",").map(h => h.trim().toLowerCase());

    // Detecting column indexes dynamically
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

// Function to predict future sales using a simple AI approach (Moving Average)
function predictSales(productName, data, targetDate) {
    const enteredProduct = cleanText(productName);
    const matchingData = data.filter(entry => entry.product === enteredProduct);
    
    if (matchingData.length === 0) {
        displayMessage(`No historical data available for '${productName}'.`);
        return;
    }

    // Convert date strings to Date objects
    matchingData.forEach(entry => entry.date = new Date(entry.date));
    matchingData.sort((a, b) => a.date - b.date);
    
    // Moving Average Calculation (Simple AI Approach)
    const recentSales = matchingData.slice(-5); // Consider last 5 records
    const predictedSales = recentSales.reduce((sum, entry) => sum + entry.sales, 0) / recentSales.length;
    
    displayMessage(`Predicted needed stock for '${productName}' on ${targetDate}: ${Math.round(predictedSales)}`);
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
        
        predictSales(productName, window.salesData, dateInput);
    });
});
