document.getElementById("generateGraph").addEventListener("click", function () {
    const fileInput = document.getElementById("csvFile");
    
    // Check if window.salesData is available (processed by predict.js)
    if (window.salesData && window.salesData.length > 0) {
        console.log("Using pre-processed window.salesData for graphing.");
        plotGraphs(window.salesData);
        return;
    }

    // Fallback to processing the CSV if window.salesData is not available
    if (!fileInput.files.length) {
        alert("Please upload a CSV file first.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const text = event.target.result;
        const data = processCSV(text);
        plotGraphs(data);
    };

    reader.readAsText(file);
});

function processCSV(csvText) {
    const rows = csvText.split("\n").map(row => row.split(",").map(cell => cell.trim()));

    if (rows.length < 2) {
        alert("Invalid CSV format!");
        return [];
    }

    // Detect column positions dynamically (ignores order and case)
    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/^\uFEFF/, "").replace(/[^a-z0-9 ]/g, ""));
    console.log("🛠 CSV Headers Detected (Cleaned):", headers); // Debugging

    const dateIndex = headers.findIndex(h => h.includes("date"));
    const productIndex = headers.findIndex(h => h.includes("product"));
    const salesIndex = headers.findIndex(h => h.includes("sales") || h.includes("quantity"));
    const stockIndex = headers.findIndex(h => {
        const cleanedHeader = h.replace(/\s/g, ""); // Remove spaces for matching
        return cleanedHeader.includes("stock") || cleanedHeader.includes("inventory") || cleanedHeader.includes("availablestock") || cleanedHeader.includes("remaining") || cleanedHeader.includes("stocklevel");
    });

    console.log("✅ Detected Column Indexes:", { dateIndex, productIndex, salesIndex, stockIndex });

    // Debug if stock column is not found
    if (stockIndex === -1) {
        console.warn("⚠️ Stock column not found! Defaulting stock values to 0. Headers after cleaning:", headers);
    }

    // Require only Date, Product, and Sales columns; Stock is optional
    if (dateIndex === -1 || productIndex === -1 || salesIndex === -1) {
        alert("CSV format is incorrect. Ensure it includes Date, Product, and Sales columns.");
        console.error("⚠️ Missing required columns detected! Headers found:", headers);
        return [];
    }

    return rows.slice(1).map((row, index) => {
        console.log(`📌 Row ${index + 1}:`, row); // Debugging - check how data is split

        if (row.length < headers.length) {
            console.error(`⚠️ Skipping row ${index + 1}: Incomplete data`, row);
            return null;
        }

        let product = row[productIndex]?.trim().toLowerCase();
        let rawStock = stockIndex !== -1 ? row[stockIndex]?.trim() : "0"; // Default to "0" if stock column is missing
        // Clean the stock value by removing all non-numeric characters except the first number
        let cleanedStock = rawStock ? rawStock.replace(/[^0-9]/g, "") : "0";
        let parsedStock = parseInt(cleanedStock, 10);

        console.log(`✅ Processing stock for ${product}: Raw Value = '${rawStock}', Cleaned = '${cleanedStock}', Parsed = ${parsedStock}`);

        return {
            date: new Date(row[dateIndex] || ""), // Convert to Date object
            product: product || "unknown",
            sales: parseInt(row[salesIndex], 10) || 0,
            stock: isNaN(parsedStock) ? 0 : parsedStock // Treat invalid stock as 0
        };
    }).filter(entry => entry && !isNaN(entry.date.getTime())); // Remove invalid dates
}

function plotGraphs(data) {
    if (!data.length) {
        alert("No valid data found in CSV.");
        return;
    }

    const monthlySales = {};
    const totalSales = {};
    const currentStock = {};

    data.forEach(entry => {
        const monthYear = `${entry.date.getFullYear()}-${entry.date.getMonth() + 1}`;
        if (!monthlySales[monthYear]) {
            monthlySales[monthYear] = {};
        }
        if (!monthlySales[monthYear][entry.product]) {
            monthlySales[monthYear][entry.product] = 0;
        }
        monthlySales[monthYear][entry.product] += entry.sales;

        if (!totalSales[entry.product]) {
            totalSales[entry.product] = 0;
        }
        totalSales[entry.product] += entry.sales;

        // Store the latest stock value per product
        currentStock[entry.product] = entry.stock !== undefined ? entry.stock : 0; // Ensure stock is not undefined
    });

    plotMonthlySalesGraph(monthlySales);
    plotTopSellingProductsGraph(totalSales);
    plotCurrentStockList(currentStock);
}

function plotMonthlySalesGraph(monthlySales) {
    const ctx = document.getElementById("monthlySalesGraph").getContext("2d");
    const labels = Object.keys(monthlySales);
    const datasets = [];
    const productNames = new Set();

    Object.values(monthlySales).forEach(productSales => {
        Object.keys(productSales).forEach(product => productNames.add(product));
    });

    productNames.forEach(product => {
        const salesData = labels.map(label => monthlySales[label][product] || 0);
        datasets.push({
            label: product,
            data: salesData,
            borderWidth: 1
        });
    });

    new Chart(ctx, {
        type: "bar",
        data: { labels, datasets },
        options: { responsive: true }
    });
}

function plotTopSellingProductsGraph(totalSales) {
    const ctx = document.getElementById("topSellingGraph").getContext("2d");
    const labels = Object.keys(totalSales);
    const values = Object.values(totalSales);

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Total Sales",
                data: values,
                backgroundColor: "blue"
            }]
        },
        options: { responsive: true }
    });
}

function plotCurrentStockList(currentStock) {
    const stockContainer = document.getElementById("currentStockList");
    if (!stockContainer) {
        console.error("❌ Element #currentStockList not found in index.html!");
        return;
    }

    stockContainer.innerHTML = ""; // Clear previous content

    console.log("🔍 Extracted Stock Values:", currentStock); // Debugging log

    // Only include products that are in the currentStock object
    const sortedStock = Object.entries(currentStock)
        .filter(([product, stock]) => stock !== "No Data" && stock !== undefined) // Skip products with no data
        .sort((a, b) => b[1] - a[1]); // Sort by stock value (descending)

    if (sortedStock.length === 0) {
        const listItem = document.createElement("p");
        listItem.textContent = "No stock data available for any products.";
        stockContainer.appendChild(listItem);
    } else {
        sortedStock.forEach(([product, stock]) => {
            const listItem = document.createElement("p");
            listItem.textContent = `${product}: ${stock} units`;
            stockContainer.appendChild(listItem);
        });
    }

    console.log("✅ Current stock list updated successfully!");
}