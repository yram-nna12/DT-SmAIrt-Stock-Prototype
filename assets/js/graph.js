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
        const data = processCSV(text);
        plotGraph(data);
    };

    reader.readAsText(file);
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
