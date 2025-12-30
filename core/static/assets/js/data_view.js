  
        document.addEventListener('DOMContentLoaded', function () {
            // --- Dropdowns ---
            function setupDropdown(buttonId, panelId) {
                const btn = document.getElementById(buttonId);
                const panel = document.getElementById(panelId);
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
            const rows = document.querySelectorAll('#data-table tbody tr');

            // --- Filter indicators by frequency ---
            function filterIndicatorsByFrequency() {
                const selectedFreq = document.querySelector('input[name="frequency"]:checked')?.value || null;
                const labels = indList.querySelectorAll('label');
                labels.forEach(label => {
                    const cb = label.querySelector('input.ind-checkbox');
                    const freq = (cb.dataset.frequency || '').toLowerCase();
                    if (!selectedFreq || freq === selectedFreq) {
                        label.style.display = '';
                    } else {
                        label.style.display = 'none';
                        cb.checked = false;
                    }
                });
                selectAll.checked = false;
            }
            freqRadios.forEach(radio => radio.addEventListener('change', filterIndicatorsByFrequency));
            filterIndicatorsByFrequency();

            // --- Select All ---
            selectAll.addEventListener('change', function () {
                const visibleCbs = indList.querySelectorAll('input.ind-checkbox');
                visibleCbs.forEach(cb => {
                    if (cb.parentElement.style.display !== 'none') {
                        cb.checked = selectAll.checked;
                    }
                });
            });

            // --- Apply Selection ---
            applyBtn.addEventListener('click', function () {
                const selectedFreq = document.querySelector('input[name="frequency"]:checked')?.value || null;
                const selectedInds = Array.from(indList.querySelectorAll('input.ind-checkbox:checked')).map(cb => cb.value);
                let anyShown = false;

                rows.forEach(row => {
                    const rowFreq = (row.dataset.frequency || '').toLowerCase();
                    const rowCode = row.dataset.code;
                    let show = true;

                    if (selectedFreq && rowFreq !== selectedFreq) show = false;
                    if (selectedInds.length && !selectedInds.includes(rowCode)) show = false;

                    row.style.display = show ? '' : 'none';
                    if (show) anyShown = true;
                    const perfCells = row.querySelectorAll('td.value-cell');
                    perfCells.forEach(cell => {
                        if (!selectedFreq) {
                            cell.textContent = cell.dataset.annualPerf || '-';
                        } else if (selectedFreq === 'month') {
                            cell.textContent = cell.dataset.monthPerf || '-';
                        } else if (selectedFreq === 'quarter') {
                            cell.textContent = cell.dataset.quarterPerf || '-';
                        } else {
                            cell.textContent = cell.dataset.annualPerf || '-';
                        }
                    });
                });

                // --- Handle no results---
                let noRow = document.querySelector('#data-table tbody .no-result');
                if (!anyShown) {
                    if (!noRow) {
                        noRow = document.createElement('tr');
                        noRow.classList.add('no-result');
                        noRow.innerHTML = `<td colspan="{{ indicators|length|add:'6' }}" class="text-center py-4 text-gray-500">No indicators match your selection.</td>`;
                        document.querySelector('#data-table tbody').appendChild(noRow);
                    }
                } else if (noRow) {
                    noRow.remove();
                }
            });

            // --- Clear ---
            clearBtn.addEventListener('click', function () {
                freqRadios.forEach(radio => radio.checked = false);
                filterIndicatorsByFrequency();

                const allCbs = indList.querySelectorAll('input.ind-checkbox');
                allCbs.forEach(cb => cb.checked = false);
                selectAll.checked = false;

                rows.forEach(row => {
                    row.style.display = '';
                    const perfCells = row.querySelectorAll('td.value-cell');
                    perfCells.forEach(cell => {
                        cell.textContent = cell.dataset.annualPerf || '-';
                    });
                });

                const noRow = document.querySelector('#data-table tbody .no-result');
                if (noRow) noRow.remove();
            });
        });
  