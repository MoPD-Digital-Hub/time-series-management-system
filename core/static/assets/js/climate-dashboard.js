/**
 * Climate Dashboard - Analytics Page Script
 */

document.addEventListener('DOMContentLoaded', function () {
    // Category Filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const categoryId = this.dataset.categoryId;

            // Update active button
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter table rows
            const rows = document.querySelectorAll('#analytics-tab .data-table tbody tr');
            rows.forEach(row => {
                const categoryIds = row.dataset.categoryIds || '';
                if (!categoryId || categoryIds.includes(categoryId + ',')) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });

            // Reload chart
            loadIndicatorsChart(categoryId);
        });
    });

    // Chart
    let indicatorsChart = null;

    function loadIndicatorsChart(categoryId = '') {
        // Ensure CLIMATE_TOPIC_ID is defined
        if (typeof CLIMATE_TOPIC_ID === 'undefined') {
            console.error('CLIMATE_TOPIC_ID is not defined');
            return;
        }

        const url = `/api/climate/indicators/analytics/?topic_id=${CLIMATE_TOPIC_ID}${categoryId ? '&category_id=' + categoryId : ''}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Chart data received:', data);
                if (data.result === 'SUCCESS' && data.data && data.data.length > 0) {
                    renderIndicatorsChart(data.data);
                } else {
                    console.warn('No data or empty response:', data);
                    const ctx = document.getElementById('indicators-chart');
                    if (ctx) {
                        const ctx2d = ctx.getContext('2d');
                        ctx2d.clearRect(0, 0, ctx.width, ctx.height);
                        ctx2d.fillStyle = '#94a3b8';
                        ctx2d.font = '14px Arial';
                        ctx2d.textAlign = 'center';
                        ctx2d.fillText('No data available', ctx.width / 2, ctx.height / 2);
                    }
                    if (indicatorsChart) {
                        indicatorsChart.destroy();
                        indicatorsChart = null;
                    }
                }
            })
            .catch(error => {
                console.error('Error loading chart:', error);
                const ctx = document.getElementById('indicators-chart');
                if (ctx) {
                    const ctx2d = ctx.getContext('2d');
                    ctx2d.clearRect(0, 0, ctx.width, ctx.height);
                    ctx2d.fillStyle = '#ef4444';
                    ctx2d.font = '14px Arial';
                    ctx2d.textAlign = 'center';
                    ctx2d.fillText('Error loading chart', ctx.width / 2, ctx.height / 2);
                }
            });
    }

    function renderIndicatorsChart(indicatorsData) {
        const ctx = document.getElementById('indicators-chart');
        if (!ctx) {
            console.error('Chart canvas not found');
            return;
        }

        if (!indicatorsData || indicatorsData.length === 0) {
            console.warn('No indicator data to render');
            // Show message on canvas
            const ctx2d = ctx.getContext('2d');
            ctx2d.clearRect(0, 0, ctx.width, ctx.height);
            ctx2d.fillStyle = '#94a3b8';
            ctx2d.font = '14px Arial';
            ctx2d.textAlign = 'center';
            ctx2d.fillText('No data available', ctx.width / 2, ctx.height / 2);
            return;
        }

        console.log('Rendering chart with data:', indicatorsData);

        const datasets = [];
        const allYears = new Set();

        // Collect all years first
        indicatorsData.slice(0, 5).forEach((ind) => {
            const annualData = ind.annual_data || [];
            annualData.forEach(point => {
                if (point.year_gc) {
                    allYears.add(point.year_gc);
                } else if (point.year_ec) {
                    allYears.add(point.year_ec.toString());
                }
            });
        });

        const sortedYears = Array.from(allYears).sort();

        if (sortedYears.length === 0) {
            console.warn('No years found in data');
            const ctx2d = ctx.getContext('2d');
            ctx2d.clearRect(0, 0, ctx.width, ctx.height);
            ctx2d.fillStyle = '#94a3b8';
            ctx2d.font = '14px Arial';
            ctx2d.textAlign = 'center';
            ctx2d.fillText('No data available', ctx.width / 2, ctx.height / 2);
            return;
        }

        // Build datasets
        indicatorsData.slice(0, 5).forEach((ind, index) => {
            const annualData = ind.annual_data || [];
            const data = [];

            // Map data to sorted years
            sortedYears.forEach(year => {
                const point = annualData.find(p => p.year_gc === year || p.year_ec === parseInt(year));
                if (point && point.performance !== null && point.performance !== undefined) {
                    data.push(parseFloat(point.performance));
                } else {
                    data.push(null);
                }
            });

            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

            datasets.push({
                label: ind.indicator ? ind.indicator.title_ENG : `Indicator ${index + 1}`,
                data: data,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                tension: 0.4,
                fill: false,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: colors[index % colors.length],
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            });
        });

        if (indicatorsChart) {
            indicatorsChart.destroy();
            indicatorsChart = null;
        }

        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available');
            return;
        }

        console.log('Creating chart with:', { labels: sortedYears, datasets: datasets.length });

        indicatorsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedYears,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            callback: function (value) {
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Initialize Chart
    if (typeof Chart !== 'undefined') {
        loadIndicatorsChart();
    } else {
        console.error('Chart.js not loaded');
        // Retry after a short delay
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                loadIndicatorsChart();
            } else {
                const ctx = document.getElementById('indicators-chart');
                if (ctx) {
                    const ctx2d = ctx.getContext('2d');
                    ctx2d.fillStyle = '#ef4444';
                    ctx2d.font = '14px Arial';
                    ctx2d.textAlign = 'center';
                    ctx2d.fillText('Chart.js failed to load', ctx.width / 2, ctx.height / 2);
                }
            }
        }, 500);
    }
});
