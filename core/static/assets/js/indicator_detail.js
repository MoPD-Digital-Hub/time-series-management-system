$(function () {
    var indicatorId = $("#indicator-detail").data("indicator-id");
    if (!indicatorId) {
        console.error('No indicator ID found');
        showError('Unable to load indicator data: Missing indicator ID');
        return;
    }

    // Show loading state
    showLoading();

    $.get('/api/indicator-id/' + indicatorId + '/', function (data) {
        hideLoading();

        // Check if indicator is not verified
        if (data.error === 'Indicator not verified') {
            showError('⚠️ ' + data.message);
            // Still show empty states
            showNoDataMessage('chart-10years', 'Indicator not verified');
            showNoDataMessage('chart-month', 'Indicator not verified');
            showNoDataMessage('chart-10years-quarterly', 'Indicator not verified');
            $('#data-table-head').html('<tr><th>Status</th></tr>');
            $('#data-table-body').html('<tr><td class="text-center text-yellow-600 py-4">This indicator has not been verified yet</td></tr>');
            return;
        }

        // --- Last 10 Years Chart ---
        try {
            if (data.last_10 && data.last_10.length > 0) {
                var years = data.last_10.map(dp => dp.year_gc);
                var values = data.last_10.map(dp => dp.performance !== undefined && dp.performance !== null ? parseFloat(dp.performance) : null);

                new Chart(document.getElementById('chart-10years').getContext('2d'), {
                    type: 'line',
                    data: { labels: years, datasets: [{ label: 'Performance', data: values, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.3 }] },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Year (GC)' } }, y: { title: { display: true, text: 'Performance' } } } }
                });
            } else {
                showNoDataMessage('chart-10years', 'No annual data available for the last 10 years');
            }
        } catch (error) {
            console.error('Error rendering annual chart:', error);
            showNoDataMessage('chart-10years', 'Error loading annual chart');
        }

        // --- Monthly Chart ---
        try {
            if (data.monthly && data.monthly.length > 0) {
                var months = data.monthly.map(m => m.month);
                var mvalues = data.monthly.map(m => parseFloat(m.performance));

                new Chart(document.getElementById('chart-month').getContext('2d'), {
                    type: 'bar',
                    data: { labels: months, datasets: [{ label: 'Performance', data: mvalues, backgroundColor: '#22c55e' }] },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Month' } }, y: { title: { display: true, text: 'Performance' } } } }
                });
            } else {
                showNoDataMessage('chart-month', 'No monthly data available');
            }
        } catch (error) {
            console.error('Error rendering monthly chart:', error);
            showNoDataMessage('chart-month', 'Error loading monthly chart');
        }

        // --- Quarterly Chart ---
        try {
            if (data.quarterly && data.quarterly.length > 0) {
                var qYears = data.quarterly.map(q => q.year_gc + ' Q' + q.quarter_number);
                var qValues = data.quarterly.map(q => q.performance !== undefined && q.performance !== null ? parseFloat(q.performance) : null);

                new Chart(document.getElementById('chart-10years-quarterly').getContext('2d'), {
                    type: 'bar',
                    data: { labels: qYears, datasets: [{ label: 'Performance', data: qValues, borderColor: '#034d2dff', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.3 }] },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Quarter' } }, y: { title: { display: true, text: 'Performance' } } } }
                });
            } else {
                showNoDataMessage('chart-10years-quarterly', 'No quarterly data available');
            }
        } catch (error) {
            console.error('Error rendering quarterly chart:', error);
            showNoDataMessage('chart-10years-quarterly', 'Error loading quarterly chart');
        }

        // --- Latest Annual Card ---
        if (data.latest_annual) {
            $('#latest-annual-card').html(`
                <div class="p-4 rounded bg-blue-100 text-blue-800 font-bold text-lg flex flex-col items-center">
                    <span>Latest Annual Performance</span>
                    <span class="text-2xl">${data.latest_annual.performance}</span>
                    <span class="text-xs">Year (GC): ${data.latest_annual.year_gc}</span>
                </div>
            `);
        }

        // --- Table Rendering ---
        function renderTable(type) {
            let head = '', rows = '';
            const page = window.currentTablePage || 1;
            const rowsPerPage = 5;
            let pagedData = [];
            let sourceData = [];

            if (type === 'annual') {
                sourceData = data.all_annual || [];
                if (sourceData.length === 0) {
                    showNoTableData('No annual data available');
                    return;
                }
                head = `<tr><th>Name</th><th>ስም</th><th>Year (EC)</th><th>Year (GC)</th><th>Performance</th></tr>`;
                pagedData = sourceData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
                pagedData.forEach(dp => { rows += `<tr><td>${data.title_eng || 'N/A'}</td><td>${data.title_amh || 'N/A'}</td><td>${dp.year_ec}</td><td>${dp.year_gc}</td><td>${dp.performance}</td></tr>`; });
            } else if (type === 'quarterly') {
                sourceData = data.quarterly || [];
                if (sourceData.length === 0) {
                    showNoTableData('No quarterly data available');
                    return;
                }
                head = `<tr><th>Year (GC)</th><th>Year (EC)</th><th>Quarter</th><th>Indicator</th><th>Performance</th></tr>`;
                pagedData = sourceData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
                pagedData.forEach(q => { rows += `<tr><td>${q.year_gc}</td><td>${q.year_ec}</td><td>Q${q.quarter_number}</td><td>${data.title_eng || 'N/A'}</td><td>${q.performance}</td></tr>`; });
            } else if (type === 'monthly') {
                sourceData = data.monthly || [];
                if (sourceData.length === 0) {
                    showNoTableData('No monthly data available');
                    return;
                }
                head = `<tr><th>Year</th><th>Month (EN)</th><th>Month (AM)</th><th>Indicator</th><th>Performance</th></tr>`;
                pagedData = sourceData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
                pagedData.forEach(m => { rows += `<tr><td>${m.year_gc}</td><td>${m.month}</td><td>${m.month_amh}</td><td>${data.title_eng || 'N/A'}</td><td>${m.performance}</td></tr>`; });
            } else if (type === 'weekly') {
                sourceData = data.weekly || [];
                if (sourceData.length === 0) {
                    showNoTableData('No weekly data available');
                    return;
                }
                head = `<tr><th>Indicator</th><th>Ethiopian Date</th><th>Gregorian Date</th><th>Performance</th><th>Target</th></tr>`;
                pagedData = sourceData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
                pagedData.forEach(w => {
                    rows += `<tr><td>${data.title_eng || 'N/A'}</td><td>${w.ethio_date || 'N/A'}</td><td>${w.date}</td><td>${w.performance !== null ? w.performance : 'N/A'}</td><td>${w.target !== null ? w.target : 'N/A'}</td></tr>`;
                });
            } else if (type === 'daily') {
                sourceData = data.daily || [];
                if (sourceData.length === 0) {
                    showNoTableData('No daily data available');
                    return;
                }
                head = `<tr><th>Indicator</th><th>Ethiopian Date</th><th>Gregorian Date</th><th>Performance</th><th>Target</th></tr>`;
                pagedData = sourceData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
                pagedData.forEach(d => {
                    rows += `<tr><td>${data.title_eng || 'N/A'}</td><td>${d.ethio_date || 'N/A'}</td><td>${d.date}</td><td>${d.performance !== null ? d.performance : 'N/A'}</td><td>${d.target !== null ? d.target : 'N/A'}</td></tr>`;
                });
            }

            $('#data-table-head').html(head);
            $('#data-table-body').html(rows);
        }

        // Helper function to show no data message in table
        function showNoTableData(message) {
            $('#data-table-head').html('<tr><th>No Data</th></tr>');
            $('#data-table-body').html(`<tr><td colspan="5" class="text-center text-gray-500 py-4">${message}</td></tr>`);
        }

        // --- Table tab buttons ---
        window.currentTablePage = 1;
        renderTable('annual');

        $('.data-table-tab').click(function () {
            $('.data-table-tab').removeClass('active');
            $(this).addClass('active');
            window.currentTablePage = 1; // Reset to first page when switching tabs
            renderTable($(this).data('type'));
        });
    })
        .fail(function (xhr, status, error) {
            hideLoading();
            console.error('API Error:', error);
            console.error('Status:', xhr.status);
            console.error('Response:', xhr.responseText);

            let errorMessage = 'Failed to load indicator data. ';

            if (xhr.status === 404) {
                errorMessage += 'Indicator not found or not verified. The indicator may not be published yet.';
            } else if (xhr.status === 500) {
                errorMessage += 'Server error occurred. Please contact the administrator.';
            } else if (xhr.status === 0) {
                errorMessage += 'Network error. Please check your connection.';
            } else {
                errorMessage += 'Please try again later. (Error code: ' + xhr.status + ')';
            }

            showError(errorMessage);

            // Show empty states for all charts
            showNoDataMessage('chart-10years', 'Unable to load data');
            showNoDataMessage('chart-month', 'Unable to load data');
            showNoDataMessage('chart-10years-quarterly', 'Unable to load data');

            // Show empty table
            $('#data-table-head').html('<tr><th>Error</th></tr>');
            $('#data-table-body').html('<tr><td class="text-center text-red-500 py-4">Unable to load table data</td></tr>');
        });

    // Helper functions
    function showLoading() {
        $('.pc-content').prepend('<div id="loading-indicator" class="alert alert-info">Loading indicator data...</div>');
    }

    function hideLoading() {
        $('#loading-indicator').remove();
    }

    function showError(message) {
        $('.pc-content').prepend(`<div class="alert alert-danger">${message}</div>`);
    }

    function showNoDataMessage(canvasId, message) {
        var canvas = document.getElementById(canvasId);
        if (canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        }
    }
});
