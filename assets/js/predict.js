// 📌 Predict Button Click Event
document.getElementById("predictBtn").addEventListener("click", function () {
    const productName = cleanText(document.getElementById("productInput").value);
    const selectedDate = document.getElementById("dateInput").value;
    const fileInput = document.getElementById("csvFile");

    if (!productName || !selectedDate) {
        alert("Please enter a product name and select a date.");
        return;
    }

    if (!fileInput.files.length) {
        alert("Please upload a CSV file first.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        console.log("✅ CSV File Loaded!");
        const text = event.target.result;
        console.log("📌 Raw CSV Content:\n", text);

        const data = processCSV(text);
        console.log("✅ Processed Data:", data); // ✅ Log processed data

        updateGraph(data, productName);
        const prediction = predictDemand(data, productName, selectedDate);
        
        document.getElementById("predictionResult").innerText = prediction;
        console.log("📢 Prediction Output Updated:", prediction);
    };

    reader.readAsText(file);
});

// Function to Predict Demand
function predictDemand(data, productName, selectedDate) {
    console.log("🔍 User Entered:", productName);

    // Log all available products
    console.log("📌 Available Products:", data.map(entry => `"${entry.product}"`));

    // Case-insensitive match using cleanText()
    const matchedProducts = data.filter(entry => cleanText(entry.product) === productName);

    console.log("✅ Matched Products:", matchedProducts.map(p => `"${p.product}"`));

    if (matchedProducts.length === 0) {
        return `No data available for '${productName}'.`;
    }

    // Calculate predicted sales
    const totalSales = matchedProducts.reduce((sum, entry) => sum + entry.sales, 0);
    const avgSales = Math.round(totalSales / matchedProducts.length);

    return `Predicted sales for '${productName}' on ${selectedDate}: ${avgSales}`;
}

// Function to Update Graph (Separate from Prediction)
function updateGraph(data, productName) {
    console.log("📊 Updating Graph for:", productName);

    const productData = data.filter(entry => cleanText(entry.product) === productName);

    if (productData.length === 0) {
        console.log("⚠️ No data for graph.");
        document.getElementById("predictionResult").innerText = `No sales data available for '${productName}'.`;
        return;
    }

    // Generate Graph (Example using Chart.js)
    const labels = productData.map(entry => entry.date);
    const salesData = productData.map(entry => entry.sales);

    const ctx = document.getElementById("graphCanvas").getContext("2d");

    if (window.salesChartInstance) {
        window.salesChartInstance.destroy();
    }

    window.salesChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: `Sales Trend for '${productName}'`,
                data: salesData,
                borderColor: "blue",
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Function to clean and normalize text (case insensitive)
function cleanText(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase();
}
