document.getElementById("generateGraph").addEventListener("click", function () {
    const fileInput = document.getElementById("csvFile");
    if (!fileInput.files.length) {
        alert("Please upload a CSV file first.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const text = event.target.result;
        window.salesData = processCSV(text); // Store data globally
        plotGraph(window.salesData);
    };

    reader.readAsText(file);
});

document.querySelector(".sales-month-button").addEventListener("click", function () {
    if (!window.salesData || window.salesData.length === 0) {
        alert("Please upload and generate the graph first.");
        return;
    }
    plotSalesPerMonth(window.salesData);
});

document.querySelector(".top-product-button").addEventListener("click", function () {
    if (!window.salesData || window.salesData.length === 0) {
        alert("Please upload and generate the graph first.");
        return;
    }
    displayTopSellingProduct(window.salesData);
});

document.querySelector(".stock-product-button").addEventListener("click", function () {
    if (!window.salesData || window.salesData.length === 0) {
        alert("Please upload and generate the graph first.");
        return;
    }
    displayCurrentStock(window.salesData);
});

function processCSV(csvText) {
    const rows = csvText.split("\n").map(row => row.split(",").map(cell => cell.trim()));

    if (rows.length < 2) {
        alert("Invalid CSV format!");
        return [];
    }

    return rows.slice(1).map(row => ({
        date: row[0] || "Unknown Date",
        product: (row[1] || "").toLowerCase(),
        sales: parseInt(row[2], 10) || 0
    }));
}

function plotGraph(data) {
    if (!data.length) {
        alert("No valid data found in CSV.");
        return;
    }

    const ctx = document.getElementById("graphCanvas").getContext("2d");
    const groupedData = {};

    data.forEach(entry => {
        if (!groupedData[entry.date]) {
            groupedData[entry.date] = 0;
        }
        groupedData[entry.date] += entry.sales;
    });

    const labels = Object.keys(groupedData);
    const values = Object.values(groupedData);

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Total Sales",
                data: values,
                borderColor: "blue",
                fill: false
            }]
        }
    });
}

// ✅ Sales Per Month (Now in Bar Graph)
function plotSalesPerMonth(data) {
    const monthlySales = {};

    data.forEach(entry => {
        const date = new Date(entry.date);
        if (isNaN(date)) return;

        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
        if (!monthlySales[monthYear]) {
            monthlySales[monthYear] = 0;
        }
        monthlySales[monthYear] += entry.sales;
    });

    const labels = Object.keys(monthlySales);
    const values = Object.values(monthlySales);

    const ctx = document.getElementById("salesMonthCanvas").getContext("2d");
    
    // Clear previous chart instance if it exists
    if (window.salesMonthChart) {
        window.salesMonthChart.destroy();
    }

    window.salesMonthChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Sales Per Month",
                data: values,
                backgroundColor: "green"
            }]
        }
    });
}

// ✅ Top-Selling Product
function displayTopSellingProduct(data) {
    const productSales = {};

    data.forEach(entry => {
        if (!productSales[entry.product]) {
            productSales[entry.product] = 0;
        }
        productSales[entry.product] += entry.sales;
    });

    let topProduct = Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b);

    document.getElementById("topProductResult").innerHTML = `
        <h3>Top-Selling Product</h3>
        <p>${topProduct}: ${productSales[topProduct]} sales</p>
    `;
}

// ✅ Current Stock Per Product
function displayCurrentStock(data) {
    const productStock = {};

    data.forEach(entry => {
        if (!productStock[entry.product]) {
            productStock[entry.product] = 0;
        }
        productStock[entry.product] += entry.sales;
    });

    document.getElementById("currentStockResult").innerHTML = `
        <h3>Current Stock Per Product</h3>
        <ul>${Object.entries(productStock).map(([product, stock]) => `<li>${product}: ${stock} units</li>`).join("")}</ul>
    `;
}
