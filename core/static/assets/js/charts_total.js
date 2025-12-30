let barChart = null;
let allCategories = []; // All categories with indicators

$(function () {
    // Fetch all categories with their indicators
    $.get('/api/indicators-per-category/', function (data) {
        allCategories = data;
        drawBarChart(data);
    });

    // Filter chart by search input
    $('#indicatorSearch').on('input', function () {
        const term = $(this).val().toLowerCase();
        const filtered = allCategories.filter(cat => cat.name_ENG.toLowerCase().includes(term));
        drawBarChart(filtered);
    });
});

function drawBarChart(data) {
    const canvas = document.getElementById('totalIndicatorsGraph');
    const ctx = canvas.getContext('2d');

    const barWidth = 60;
    canvas.width = Math.max(data.length * barWidth, canvas.parentElement.offsetWidth);

    if (barChart) barChart.destroy();

    const labels = data.map(d => d.name_ENG);
    const values = data.map(d => d.indicator_count); // <-- keep original count
    const colorList = data.map((_, i) => ['#2563eb', '#22c55e', '#f59e42', '#ef4444'][i % 4]);

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Indicators',
                data: values,
                backgroundColor: colorList,
                borderColor: colorList,
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            onClick: function (evt, elements) {
                if (!elements.length) return;
                const idx = elements[0].index;
                openCategoryModal(data[idx]);
            },
            scales: {
                x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 30 } },
                y: { beginAtZero: true }
            }
        }
    });
}

function openCategoryModal(category) {
    $('#modalTitle').text(category.name_ENG);

    const indicators = category.indicators || [];
    const verifiedIndicators = indicators.filter(i => i.is_verified === true || i.is_verified === 'True' || i.is_verified === 'true');

    const container = $('#indicatorList');
    container.empty();

    if (verifiedIndicators.length === 0) {
        container.html(`
            <div class="text-center text-gray-500 py-5">
                <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                <div>No Indicators in this category</div>
            </div>
        `);
    } else {
        const listHtml = verifiedIndicators.map(i => `<li class="border-b px-3 py-1">${i.title_ENG}</li>`).join('');
        container.html(`<ul class="border rounded">${listHtml}</ul>`);
    }

    $('#indicatorModal').removeClass('hidden');
}

// Close modal on background click
$('#indicatorModal').on('click', function (e) {
    if (e.target.id === 'indicatorModal') $(this).addClass('hidden');
});
