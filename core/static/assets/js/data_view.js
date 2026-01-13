
document.addEventListener('DOMContentLoaded', function () {
    // --- State ---
    let currentMode = "annual";
    let selectedIndicators = [];
    let allYearsGC = {}; // ec -> gc mapping

    // --- Dropdowns ---
    function setupDropdown(buttonId, panelId) {
        const btn = document.getElementById(buttonId);
        const panel = document.getElementById(panelId);
        if (!btn || !panel) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            panel.classList.toggle('hidden');
        });
        document.addEventListener('click', function (e) {
            if (!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.add('hidden');
        });
    }
    setupDropdown('dd-freq-btn', 'dd-freq');
    setupDropdown('dd-ind-btn', 'dd-ind');

    const freqRadios = document.querySelectorAll('input[name="frequency"]');
    const indList = document.getElementById('ind-list');
    const selectAll = document.getElementById('select-all-ind');
    const applyBtn = document.getElementById('apply-selection');
    const clearBtn = document.getElementById('clear-all');
    const tableHead = document.getElementById('data-table-head');
    const tableBody = document.getElementById('data-table-body');

    // --- Filter indicators by frequency ---
    function filterIndicatorsByFrequency() {
        const selectedFreq = document.querySelector('input[name="frequency"]:checked')?.value;
        if (!selectedFreq) return;

        const labels = indList.querySelectorAll('label');
        labels.forEach(label => {
            const cb = label.querySelector('input.ind-checkbox');
            const hasData = (
                (selectedFreq === 'annual' && cb.dataset.hasAnnual === 'true') ||
                (selectedFreq === 'quarter' && cb.dataset.hasQuarterly === 'true') ||
                (selectedFreq === 'month' && cb.dataset.hasMonthly === 'true')
            );

            if (hasData) {
                label.style.display = '';
            } else {
                label.style.display = 'none';
                cb.checked = false;
            }
        });
        selectAll.checked = false;
        currentMode = selectedFreq === 'quarter' ? 'quarterly' : (selectedFreq === 'month' ? 'monthly' : 'annual');
    }
    freqRadios.forEach(radio => radio.addEventListener('change', filterIndicatorsByFrequency));

    // --- Select All ---
    selectAll?.addEventListener('change', function () {
        const visibleCbs = indList.querySelectorAll('input.ind-checkbox');
        visibleCbs.forEach(cb => {
            if (cb.parentElement.style.display !== 'none') {
                cb.checked = selectAll.checked;
            }
        });
    });

    // --- Fetch and Render ---
    async function fetchData() {
        const selectedCbs = Array.from(indList.querySelectorAll('input.ind-checkbox:checked'));
        const ids = selectedCbs.map(cb => cb.dataset.id);

        if (ids.length === 0) {
            alert("Please select at least one indicator.");
            return;
        }

        tableBody.innerHTML = '<tr><td colspan="20" class="text-center py-4">Loading data...</td></tr>';

        try {
            const response = await fetch('/api/indicators-bulk/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    ids: ids,
                    mode: currentMode,
                    is_public: true
                })
            });

            const data = await response.json();
            renderTable(data);
        } catch (error) {
            console.error("Error fetching data:", error);
            tableBody.innerHTML = '<tr><td colspan="20" class="text-center py-4 text-danger">Failed to load data.</td></tr>';
        }
    }

    function renderTable(resp) {
        const results = resp.results || [];
        const datapoints = resp.datapoints || [];

        // Update Year Mapping
        datapoints.forEach(dp => {
            if (dp.year_gc) allYearsGC[dp.year_ec] = dp.year_gc;
        });

        // 1. Build Periods (Cols)
        let periods = [];
        if (currentMode === 'annual') {
            periods = datapoints.map(dp => ({
                key: `${dp.year_ec}|${dp.year_gc}`,
                label: `${dp.year_ec} EC`,
                sub: `${dp.year_gc} GC`
            }));
        } else if (currentMode === 'quarterly') {
            datapoints.forEach(dp => {
                [1, 2, 3, 4].forEach(q => {
                    periods.push({
                        key: `${dp.year_ec}|${dp.year_gc}|Q${q}`,
                        label: `${dp.year_ec} Q${q}`,
                        sub: dp.year_gc
                    });
                });
            });
        } else if (currentMode === 'monthly') {
            const amharicMonths = [
                "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሳስ", "ጥር", "የካቲት",
                "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ"
            ];
            datapoints.forEach(dp => {
                for (let m = 1; m <= 12; m++) {
                    periods.push({
                        key: `${dp.year_ec}|${dp.year_gc}|${m}`,
                        label: `${dp.year_ec} ${amharicMonths[m - 1]}`,
                        sub: dp.year_gc
                    });
                }
            });
        }

        // 2. Render Header
        let headHtml = `<tr><th scope="col" class="sticky-col">Indicator / Period</th>`;
        periods.forEach(p => {
            headHtml += `<th class="value-head"><div>${p.label}</div><div class="text-[10px] opacity-60">${p.sub}</div></th>`;
        });
        headHtml += `<th scope="col">Unit</th><th scope="col">Freq</th></tr>`;
        tableHead.innerHTML = headHtml;

        // 3. Map Data
        let rowsHtml = "";
        results.forEach(ind => {
            let rowMap = {};
            const annual = ind.all_annual || ind.annual || [];
            const quarterly = ind.quarterly || [];
            const monthly = ind.monthly || [];

            if (currentMode === 'annual') {
                annual.forEach(a => rowMap[`${a.year_ec}|${a.year_gc}`] = a.value);
            } else if (currentMode === 'quarterly') {
                quarterly.forEach(q => {
                    const qnum = q.quarter_number || q.number;
                    rowMap[`${q.year_ec}|${q.year_gc}|Q${qnum}`] = q.value;
                });
            } else if (currentMode === 'monthly') {
                monthly.forEach(m => {
                    const mnum = m.month_number || m.number;
                    rowMap[`${m.year_ec}|${m.year_gc}|${mnum}`] = m.value;
                });
            }

            rowsHtml += `<tr>
                <td class="sticky-col font-bold">
                    <div class="text-xs text-indigo-600">${ind.code}</div>
                    <div class="truncate max-w-[200px]" title="${ind.title_ENG}">${ind.title_ENG}</div>
                </td>`;

            periods.forEach(p => {
                const val = rowMap[p.key];
                rowsHtml += `<td class="value-cell text-center">${val !== undefined && val !== null ? val : "-"}</td>`;
            });

            const unit = currentMode === 'quarterly' ? ind.measurement_units_quarter :
                (currentMode === 'monthly' ? ind.measurement_units_month : ind.measurement_units);

            rowsHtml += `<td>${unit || '-'}</td><td>${currentMode}</td></tr>`;
        });

        tableBody.innerHTML = rowsHtml || '<tr><td colspan="20" class="text-center py-4">No data found.</td></tr>';
    }

    // --- Helpers ---
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    applyBtn.addEventListener('click', fetchData);

    clearBtn.addEventListener('click', function () {
        location.reload(); // Simplest way to clear complex state
    });

    // Initial Filter
    filterIndicatorsByFrequency();
});
