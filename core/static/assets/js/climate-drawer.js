/**
 * Climate Dashboard - Drawer Functionality
 * Handles the slide-out drawer for indicator details
 */

document.addEventListener('DOMContentLoaded', function() {
    const drawer = document.getElementById('indicator-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerContent = document.getElementById('drawer-content');
    const drawerTitle = document.getElementById('drawer-indicator-title');

    // Drawer Controls
    function openDrawer() {
        if (!drawer || !drawerOverlay) return;
        drawer.classList.add('open');
        drawerOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (!drawer || !drawerOverlay) return;
        drawer.classList.remove('open');
        drawerOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
            closeDrawer();
        }
    });

    // Event Delegation for Button Clicks
    // We use delegation because there might be many buttons or dynamically added ones
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('.view-indicator-btn');
        if (btn) {
            e.stopPropagation();
            const indicatorId = btn.dataset.indicatorId;
            loadIndicatorDetails(indicatorId);
        }
    });

    // Event Delegation for Row Clicks
    document.body.addEventListener('click', function(e) {
        const row = e.target.closest('.indicator-row');
        if (row && !e.target.closest('.view-indicator-btn')) {
            const indicatorId = row.dataset.indicatorId;
            loadIndicatorDetails(indicatorId);
        }
    });
    
    // Core Logic
    window.loadIndicatorDetails = function(indicatorId) {
        openDrawer();
        
        // Show loading state
        drawerContent.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #94a3b8;">
                <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                <p>Loading indicator details...</p>
            </div>
        `;

        // Fetch indicator metadata and data in parallel
        Promise.all([
            fetch(`/api/indicator-id/${indicatorId}/`).then(r => r.json()),
            fetch(`/api/climate/indicators/analytics/?indicator_id=${indicatorId}`).then(r => r.json())
        ])
            .then(([data, analyticsData]) => {
                if (data.error) {
                    drawerContent.innerHTML = `
                        <div style="text-align: center; padding: 3rem; color: #ef4444;">
                            <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                            <p>${data.message || 'Error loading indicator data'}</p>
                        </div>
                    `;
                    return;
                }

                // Get indicator metadata from analytics data
                const analyticsIndicator = analyticsData.data && analyticsData.data[0] ? analyticsData.data[0] : null;
                const indicator = analyticsIndicator ? analyticsIndicator.indicator : {};
                
                // Use annual_data from analytics API which has both performance and target
                const annualData = analyticsIndicator && analyticsIndicator.annual_data ? analyticsIndicator.annual_data : [];
                
                // Fallback to indicator-id API data if analytics doesn't have it
                const fallbackData = data.all_annual || [];
                const finalAnnualData = annualData.length > 0 ? annualData : fallbackData.map(item => ({
                    year_ec: item.year_ec,
                    year_gc: item.year_gc,
                    performance: item.performance,
                    target: null
                }));

                // Update title
                if (drawerTitle) {
                    drawerTitle.textContent = data.title_eng || indicator.title_ENG || 'Indicator Details';
                }

                // Build metadata HTML
                const metadataHTML = `
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <div class="metadata-label">Code</div>
                            <div class="metadata-value">${indicator.code || '-'}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Frequency</div>
                            <div class="metadata-value">${indicator.frequency || 'Annual'}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Measurement Units</div>
                            <div class="metadata-value">${indicator.measurement_units || '-'}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">KPI Characteristics</div>
                            <div class="metadata-value">${getKPILabel(indicator.kpi_characteristics) || '-'}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Status</div>
                            <div class="metadata-value">${indicator.status || 'Active'}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Latest Performance</div>
                            <div class="metadata-value">${analyticsIndicator && analyticsIndicator.latest_performance !== null ? analyticsIndicator.latest_performance : (data.latest_annual && data.latest_annual.performance !== null ? data.latest_annual.performance : '-')}</div>
                        </div>
                    </div>
                    ${indicator.description ? `
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 2rem;">
                            <div class="metadata-label">Description</div>
                            <div class="metadata-value" style="margin-top: 0.5rem;">${indicator.description}</div>
                        </div>
                    ` : ''}
                `;

                // Build chart HTML
                const chartHTML = `
                    <div class="drawer-chart-container">
                        <canvas id="drawer-indicator-chart"></canvas>
                    </div>
                `;

                // Build table HTML
                const tableData = finalAnnualData;

                const tableHTML = `
                    <div class="drawer-table-container">
                        <div style="padding: 1rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                            <h4 style="margin: 0; font-weight: 600; color: #1e293b;">Annual Data</h4>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Year (EC)</th>
                                        <th>Year (GC)</th>
                                        <th>Performance</th>
                                        <th>Target</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableData.length > 0 ? tableData.map(item => {
                                        const perf = item.performance !== null && item.performance !== undefined ? parseFloat(item.performance).toFixed(2) : '-';
                                        const targ = item.target !== null && item.target !== undefined ? parseFloat(item.target).toFixed(2) : '-';
                                        return `
                                        <tr>
                                            <td>${item.year_ec || '-'}</td>
                                            <td>${item.year_gc || '-'}</td>
                                            <td><strong>${perf}</strong></td>
                                            <td>${targ}</td>
                                        </tr>
                                    `;
                                    }).join('') : `
                                        <tr>
                                            <td colspan="4" style="text-align: center; padding: 2rem; color: #94a3b8;">
                                                No annual data available
                                            </td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;

                // Combine all HTML
                drawerContent.innerHTML = metadataHTML + chartHTML + tableHTML;

                // Render chart after a small delay to ensure canvas is in DOM
                setTimeout(() => {
                    if (finalAnnualData.length > 0) {
                        try {
                            renderDrawerChart(finalAnnualData, { title_eng: data.title_eng || indicator.title_ENG });
                        } catch (e) {
                            console.error("Error rendering chart", e);
                        }
                    } else {
                        const chartCtx = document.getElementById('drawer-indicator-chart');
                        if (chartCtx) {
                            const ctx2d = chartCtx.getContext('2d');
                            ctx2d.fillStyle = '#94a3b8';
                            ctx2d.font = '14px Arial';
                            ctx2d.textAlign = 'center';
                            ctx2d.fillText('No data available for chart', chartCtx.width / 2, chartCtx.height / 2);
                        }
                    }
                }, 100);
            })
            .catch(error => {
                console.error('Error loading indicator:', error);
                drawerContent.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #ef4444;">
                        <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                        <p>Error loading indicator data. Please try again.</p>
                        <p style="font-size: 0.875rem; margin-top: 1rem;">${error.message}</p>
                    </div>
                `;
            });
    }

    function getKPILabel(value) {
        const labels = {
            'inc': 'Increasing',
            'dec': 'Decreasing',
            'const': 'Constant',
            'volatile': 'Volatile'
        };
        return labels[value] || value;
    }

    let drawerChart = null;
    function renderDrawerChart(data, indicator) {
        const ctx = document.getElementById('drawer-indicator-chart');
        if (!ctx) {
            console.error('Drawer chart canvas not found');
            return;
        }

        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available');
            return;
        }

        if (!data || data.length === 0) {
            console.warn('No data for drawer chart');
            const ctx2d = ctx.getContext('2d');
            ctx2d.fillStyle = '#94a3b8';
            ctx2d.font = '14px Arial';
            ctx2d.textAlign = 'center';
            ctx2d.fillText('No data available', ctx.width / 2, ctx.height / 2);
            return;
        }

        // Destroy existing chart if it exists
        if (drawerChart) {
            drawerChart.destroy();
            drawerChart = null;
        }

        // Sort data by year (ascending)
        const sortedData = [...data].sort((a, b) => {
            const yearA = parseInt(a.year_ec || (a.year_gc ? a.year_gc.split('/')[0] : 0) || 0);
            const yearB = parseInt(b.year_ec || (b.year_gc ? b.year_gc.split('/')[0] : 0) || 0);
            return yearA - yearB;
        });

        const labels = sortedData.map(item => item.year_gc || item.year_ec || '');
        const performanceData = sortedData.map(item => {
            const perf = item.performance;
            return perf !== null && perf !== undefined ? parseFloat(perf) : null;
        });

        console.log('Rendering drawer chart with data:', { labels, performanceData });

        drawerChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Performance',
                        data: performanceData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: indicator.title_eng || 'Indicator Trend',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y;
                                } else {
                                    label += 'No data';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
});
