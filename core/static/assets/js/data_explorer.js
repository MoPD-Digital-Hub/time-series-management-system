
(function () {
    var selections = { indicators: [] };
    var currentMode = 'annual';
    var currentRequest = null;

    // Helper to get cookie value
    function getCookie(name) {
        const v = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
        return v ? v.pop() : "";
    }

    // Chunked insertion helper to avoid blocking when appending many rows
    function insertRowsChunked(containerSelector, htmlString, chunkSize = 200, cb) {
        if (!htmlString) {
            $(containerSelector).html('');
            if (typeof cb === 'function') cb();
            return;
        }
        const parts = htmlString.split('</tr>').map(p => p.trim()).filter(Boolean).map(p => p + '</tr>');
        const $container = $(containerSelector);
        $container.html('');
        let i = 0;
        function appendChunk() {
            const end = Math.min(i + chunkSize, parts.length);
            if (i >= end) {
                if (typeof cb === 'function') cb();
                return;
            }
            const chunk = parts.slice(i, end).join('');
            $container.append(chunk);
            i = end;
            if (i < parts.length) setTimeout(appendChunk, 8);
            else if (typeof cb === 'function') cb();
        }
        appendChunk();
    }

    function exportTableToCSV(tableId, filename) {
        const rows = document.querySelectorAll(`#${tableId} tr`);
        let csv = [];

        rows.forEach(row => {
            let cols = row.querySelectorAll('th, td');
            let rowData = [];
            cols.forEach(col => rowData.push(`"${col.innerText.trim()}"`));
            csv.push(rowData.join(','));
        });

        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    $('#export-table').on('click', () => {
        exportTableToCSV(
            'explorer-table',
            'data_explorer_' + (window.currentMode || 'data') + '.csv'
        );
    });




    // Dropdown toggle
    function toggleMenu(btnId, menuId) {
        $(btnId).on('click', function (e) {
            e.stopPropagation();
            var $menu = $(menuId);
            $('.absolute.z-10').not($menu).addClass('hidden');
            $menu.toggleClass('hidden');
        });
    }

    toggleMenu('#dd-topic-btn', '#dd-topic');
    toggleMenu('#dd-category-btn', '#dd-category');
    toggleMenu('#dd-ind-btn', '#dd-ind');

    $(document).on('click', function () { $('.absolute.z-10').addClass('hidden'); });
    $('#dd-topic, #dd-category, #dd-ind').on('click', function (e) { e.stopPropagation(); });

    // Select All logic
    $('#topic-select-all').on('change', function () {
        $('#topic-list .topic-checkbox').prop('checked', this.checked).trigger('change');
    });
    $('#category-select-all').on('change', function () {
        $('#category-list label:visible .cat-checkbox').prop('checked', this.checked).trigger('change');
    });

    $('#ind-select-all').on('change', function () {
        $('#ind-list .ind-checkbox:visible').prop('checked', this.checked);
    });



    // Cascading Filter Logic
    function updateFilters() {
        var selectedTopics = $('#topic-list .topic-checkbox:checked').map(function () { return $(this).data('id'); }).get();

        var topicSearch = $('#search-topic').val().toLowerCase();
        var catSearch = $('#search-category').val().toLowerCase();
        var indSearch = $('#search-ind').val().toLowerCase();

        // Topic Search
        $('#topic-list label').each(function () {
            var text = $(this).text().toLowerCase();
            if (text.includes(topicSearch)) $(this).show();
            else $(this).hide();
        });

        // Filter Categories based on Topics and Search
        $('#category-list label').each(function () {
            var topicId = $(this).data('topic');
            var text = $(this).text().toLowerCase();

            var topicMatch = selectedTopics.length === 0 || selectedTopics.includes(topicId);
            var searchMatch = text.includes(catSearch);

            if (topicMatch && searchMatch) {
                $(this).show();
            } else {
                $(this).hide();
                if (!topicMatch) $(this).find('.cat-checkbox').prop('checked', false);
            }
        });

        // Filter Indicators based on Topics, Categories and Search
        var actualSelectedCats = $('#category-list .cat-checkbox:checked').map(function () { return $(this).data('id'); }).get();

        $('#ind-list label').each(function () {
            var topicId = $(this).data('topic');
            var catId = $(this).data('cat');
            var text = $(this).text().toLowerCase();

            var topicMatch = selectedTopics.length === 0 || selectedTopics.includes(topicId);
            var catMatch = actualSelectedCats.length === 0 || actualSelectedCats.includes(catId);
            var searchMatch = text.includes(indSearch);

            if (topicMatch && catMatch && searchMatch) {
                $(this).show();
            } else {
                $(this).hide();
                if (!topicMatch || !catMatch) $(this).find('.ind-checkbox').prop('checked', false);
            }
        });
    }

    $('.topic-checkbox, .cat-checkbox').on('change', updateFilters);
    $('#search-topic, #search-category, #search-ind').on('input', updateFilters);

    function collectSelection() {
        selections.indicators = [];
        $('#ind-list .ind-checkbox:checked').each(function () {
            selections.indicators.push({
                id: $(this).data('id'),
                title: $(this).data('title'),
                code: $(this).data('code') || '',
                topic: $(this).data('topic-name') || '-',
                category: $(this).data('cat-name') || '-',
                unit: $(this).data('unit') || '-',
                freq: $(this).data('freq') || '-',
                desc: $(this).data('desc') || '-'
            });
        });
    }

    // Frequency change 
    $('.data-mode').on('click', function () {
        $('.data-mode').removeClass('btn-primary').addClass('btn-outline-primary');
        $(this).removeClass('btn-outline-primary').addClass('btn-primary');
        currentMode = $(this).data('mode');
        renderTable();
    });

    $('#apply-selection').on('click', function () {
        collectSelection();
        renderTable();
    });

    $('#clear-all').on('click', function () {
        $('input[type=checkbox], input[type=radio]').prop('checked', false);
        selections.indicators = [];
        currentMode = 'annual';
        renderTable();
    });

    function fmt(v) {
        return (v === null || v === undefined || v === '') ? '-' : v;
    }

    function renderTable() {
        if (!selections.indicators.length) {
            $('#explorer-head').html('<tr><th>-</th></tr>');
            $('#explorer-body').html('<tr><td class="text-center py-3">No indicators selected.</td></tr>');
            return;
        }

        var ids = selections.indicators.map(i => i.id);


        if (currentRequest && currentRequest.abort) currentRequest.abort();
        const applyBtn = $('#apply-selection');
        const indicatorsReq = $.ajax({
            url: '/api/indicators-bulk/',
            method: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: JSON.stringify({ records: ids, record_type: currentMode }),
            beforeSend: function () {
                $('#explorer-head').html('<tr><th>Loading...</th></tr>');
                $('#explorer-body').html('<tr><td class="text-center py-3">Loading...</td></tr>');
                try { applyBtn.prop('disabled', true); } catch (e) { }
            }
        })
            .done(function (resp) {
                var results = resp.results || [];
                var head = '';
                var rowsHtml = '';
                var sortedYears = [];
                var timePeriods = [];

                if (currentMode === 'annual') {
                    // Collect all unique years for annual mode
                    var allYears = new Set();
                    var yearDataMap = {};
                    var indicatorInfo = {};
                    
                    // Create a map of indicator titles to their metadata from selections
                    var selectionMap = {};
                    selections.indicators.forEach(function(ind) {
                        selectionMap[ind.title] = ind;
                    });
                    
                    results.forEach(function(r) {
                        var sel = selectionMap[r.title] || {};
                        indicatorInfo[r.title] = {
                            id: r.id,
                            code: r.code || sel.code || '',
                            title: r.title || r.title_ENG || sel.title,
                            topic: r.topic || sel.topic || '-',
                            category: r.category || sel.category || '-',
                            unit: r.measurement_units || sel.unit || '-',
                            freq: r.frequency || sel.freq || '-',
                            desc: r.description || sel.desc || '-'
                        };
                        
                        if (r.all_annual) {
                            r.all_annual.forEach(function(a) {
                                var yearKey = a.year_ec;
                                allYears.add(yearKey);
                                if (!yearDataMap[yearKey]) yearDataMap[yearKey] = {};
                                yearDataMap[yearKey][r.title] = a.value;
                            });
                        }
                    });
                    
                    // Build header with vertical text like data_view.html
                    head = '<tr>';
                    head += '<th scope="col" class="sticky-col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; min-width: 150px; max-width: 150px; width: 150px;">Code</th>';
                    head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">View</th>';
                    
                    // Add year columns (sorted descending)
                    sortedYears = Array.from(allYears).sort(function(a, b) { return b - a; });
                    sortedYears.forEach(function(year) {
                        head += '<th class="value-cell" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; white-space: nowrap;">' + year + ' EC</th>';
                    });
                    
                    head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Topic</th>';
                    head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Category</th>';
                    head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Unit</th>';
                    head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Freq</th>';
                    head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Desc</th>';
                    head += '</tr>';

                    // Build rows - one row per indicator
                    selections.indicators.forEach(function(ind) {
                        var info = indicatorInfo[ind.title] || {};
                        rowsHtml += '<tr data-id="' + (ind.id || '') + '" data-code="' + (ind.code || '') + '">';
                        rowsHtml += '<td class="sticky-col" style="min-width: 150px; max-width: 150px; width: 150px;"><div class="font-bold text-sm">' + (ind.code || '-') + '</div><div class="text-xs text-gray-600 truncate" style="max-width: 140px;">' + (ind.title || '-') + '</div></td>';
                        rowsHtml += '<td class="text-center"><a href="/data-management/indicators/' + (ind.id || '') + '/" class="inline-flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition" title="View Indicator Details"><i class="fas fa-eye"></i></a></td>';

                        // Add year values
                        sortedYears.forEach(function(year) {
                            var value = yearDataMap[year] && yearDataMap[year][ind.title] !== undefined ? yearDataMap[year][ind.title] : null;
                            rowsHtml += '<td class="value-cell">' + fmt(value) + '</td>';
                        });
                        
                        rowsHtml += '<td class="text-xs">' + (ind.topic || '-') + '</td>';
                        rowsHtml += '<td class="text-xs">' + (ind.category || '-') + '</td>';
                        rowsHtml += '<td class="text-xs">' + (ind.unit || '-') + '</td>';
                        rowsHtml += '<td class="text-xs">' + (ind.freq || '-') + '</td>';
                        rowsHtml += '<td class="text-xs">' + (ind.desc || '-') + '</td>';
                        rowsHtml += '</tr>';
                    });
                } else {
                    // For non-annual modes, restructure to match annual mode format
                    var selectionMap = {};
                    selections.indicators.forEach(function(ind) {
                        selectionMap[ind.title] = ind;
                    });
                    
                    var indicatorInfo = {};
                    results.forEach(function(r) {
                        var sel = selectionMap[r.title] || {};
                        indicatorInfo[r.title] = {
                            id: r.id,
                            code: r.code || sel.code || '',
                            title: r.title || r.title_ENG || sel.title,
                            topic: r.topic || sel.topic || '-',
                            category: r.category || sel.category || '-',
                            unit: r.measurement_units || sel.unit || '-',
                            freq: r.frequency || sel.freq || '-',
                            desc: r.description || sel.desc || '-'
                        };
                    });
                    
                    timePeriods = [];
                    var timeDataMap = {};
                    
                    if (currentMode === 'quarterly') {
                        results.forEach(function(r) {
                            (r.quarterly || []).forEach(function(q) {
                                var periodKey = q.year_ec + '|' + q.year_gc + '|' + (q.quarter || 'Q' + q.quarter_number);
                                if (timePeriods.indexOf(periodKey) === -1) {
                                    timePeriods.push(periodKey);
                                }
                                if (!timeDataMap[periodKey]) timeDataMap[periodKey] = {};
                                timeDataMap[periodKey][r.title] = q.value;
                            });
                        });
                        // Sort by year descending, then quarter
                        timePeriods.sort(function(a, b) {
                            var aParts = a.split('|');
                            var bParts = b.split('|');
                            if (aParts[0] !== bParts[0]) return bParts[0] - aParts[0];
                            return aParts[2].localeCompare(bParts[2]);
                        });
                        
                        head = '<tr>';
                        head += '<th scope="col" class="sticky-col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; min-width: 150px; max-width: 150px; width: 150px;">Code</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">View</th>';
                        timePeriods.forEach(function(period) {
                            var parts = period.split('|');
                            head += '<th class="value-cell" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; white-space: nowrap;">' + parts[0] + ' EC ' + parts[2] + '</th>';
                        });
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Topic</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Category</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Unit</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Freq</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Desc</th>';
                        head += '</tr>';
                        
                        selections.indicators.forEach(function(ind) {
                            rowsHtml += '<tr data-id="' + (ind.id || '') + '" data-code="' + (ind.code || '') + '">';
                            rowsHtml += '<td class="sticky-col" style="min-width: 150px; max-width: 150px; width: 150px;"><div class="font-bold text-sm">' + (ind.code || '-') + '</div><div class="text-xs text-gray-600 truncate" style="max-width: 140px;">' + (ind.title || '-') + '</div></td>';
                            rowsHtml += '<td class="text-center"><a href="/indicator/' + (ind.id || '') + '/" class="inline-flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition" title="View Indicator Details"><i class="fas fa-eye"></i></a></td>';
                            timePeriods.forEach(function(period) {
                                var value = timeDataMap[period] && timeDataMap[period][ind.title] !== undefined ? timeDataMap[period][ind.title] : null;
                                rowsHtml += '<td class="value-cell">' + fmt(value) + '</td>';
                            });
                            rowsHtml += '<td class="text-xs">' + (ind.topic || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.category || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.unit || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.freq || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.desc || '-') + '</td>';
                            rowsHtml += '</tr>';
                        });
                    } else if (currentMode === 'monthly') {
                        results.forEach(function(r) {
                            (r.monthly || []).forEach(function(m) {
                                var periodKey = m.year_ec + '|' + m.year_gc + '|' + m.month_number;
                                if (timePeriods.indexOf(periodKey) === -1) {
                                    timePeriods.push(periodKey);
                                }
                                if (!timeDataMap[periodKey]) timeDataMap[periodKey] = {};
                                timeDataMap[periodKey][r.title] = m.value;
                            });
                        });
                        // Sort by year descending, then month
                        timePeriods.sort(function(a, b) {
                            var aParts = a.split('|');
                            var bParts = b.split('|');
                            if (aParts[0] !== bParts[0]) return bParts[0] - aParts[0];
                            return bParts[2] - aParts[2];
                        });
                        
                        head = '<tr>';
                        head += '<th scope="col" class="sticky-col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; min-width: 150px; max-width: 150px; width: 150px;">Code</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">View</th>';
                        timePeriods.forEach(function(period) {
                            var parts = period.split('|');
                            var monthNum = parts[2];
                            var monthName = '';
                            results.forEach(function(r) {
                                (r.monthly || []).forEach(function(m) {
                                    if (m.year_ec == parts[0] && m.month_number == monthNum) {
                                        monthName = m.month_amh || m.month || 'M' + monthNum;
                                    }
                                });
                            });
                            head += '<th class="value-cell" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; white-space: nowrap;">' + parts[0] + ' EC ' + monthName + '</th>';
                        });
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Topic</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Category</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Unit</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Freq</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Desc</th>';
                        head += '</tr>';
                        
                        selections.indicators.forEach(function(ind) {
                            rowsHtml += '<tr data-id="' + (ind.id || '') + '" data-code="' + (ind.code || '') + '">';
                            rowsHtml += '<td class="sticky-col" style="min-width: 150px; max-width: 150px; width: 150px;"><div class="font-bold text-sm">' + (ind.code || '-') + '</div><div class="text-xs text-gray-600 truncate" style="max-width: 140px;">' + (ind.title || '-') + '</div></td>';
                            rowsHtml += '<td class="text-center"><a href="/indicator/' + (ind.id || '') + '/" class="inline-flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition" title="View Indicator Details"><i class="fas fa-eye"></i></a></td>';
                            timePeriods.forEach(function(period) {
                                var value = timeDataMap[period] && timeDataMap[period][ind.title] !== undefined ? timeDataMap[period][ind.title] : null;
                                rowsHtml += '<td class="value-cell">' + fmt(value) + '</td>';
                            });
                            rowsHtml += '<td class="text-xs">' + (ind.topic || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.category || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.unit || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.freq || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.desc || '-') + '</td>';
                            rowsHtml += '</tr>';
                        });
                    } else if (currentMode === 'weekly') {
                        results.forEach(function(r) {
                            (r.weekly || []).forEach(function(w) {
                                var periodKey = (w.year_ec || '') + '|' + (w.year_gc || '') + '|' + w.date;
                                if (timePeriods.indexOf(periodKey) === -1) {
                                    timePeriods.push(periodKey);
                                }
                                if (!timeDataMap[periodKey]) timeDataMap[periodKey] = {};
                                timeDataMap[periodKey][r.title] = w.value;
                            });
                        });
                        // Sort by date descending
                        timePeriods.sort(function(a, b) {
                            return b.localeCompare(a);
                        });
                        
                        head = '<tr>';
                        head += '<th scope="col" class="sticky-col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; min-width: 150px; max-width: 150px; width: 150px;">Code</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">View</th>';
                        timePeriods.forEach(function(period) {
                            var parts = period.split('|');
                            var weekLabel = parts[2];
                            results.forEach(function(r) {
                                (r.weekly || []).forEach(function(w) {
                                    if (w.date === parts[2]) {
                                        weekLabel = w.week_label || 'Week ' + (w.week || '');
                                    }
                                });
                            });
                            head += '<th class="value-cell" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; white-space: nowrap;">' + weekLabel + '</th>';
                        });
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Topic</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Category</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Unit</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Freq</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Desc</th>';
                        head += '</tr>';
                        
                        selections.indicators.forEach(function(ind) {
                            rowsHtml += '<tr data-id="' + (ind.id || '') + '" data-code="' + (ind.code || '') + '">';
                            rowsHtml += '<td class="sticky-col" style="min-width: 150px; max-width: 150px; width: 150px;"><div class="font-bold text-sm">' + (ind.code || '-') + '</div><div class="text-xs text-gray-600 truncate" style="max-width: 140px;">' + (ind.title || '-') + '</div></td>';
                            rowsHtml += '<td class="text-center"><a href="/indicator/' + (ind.id || '') + '/" class="inline-flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition" title="View Indicator Details"><i class="fas fa-eye"></i></a></td>';
                            timePeriods.forEach(function(period) {
                                var value = timeDataMap[period] && timeDataMap[period][ind.title] !== undefined ? timeDataMap[period][ind.title] : null;
                                rowsHtml += '<td class="value-cell">' + fmt(value) + '</td>';
                            });
                            rowsHtml += '<td class="text-xs">' + (ind.topic || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.category || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.unit || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.freq || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.desc || '-') + '</td>';
                            rowsHtml += '</tr>';
                        });
                    } else if (currentMode === 'daily') {
                        results.forEach(function(r) {
                            (r.daily || []).forEach(function(d) {
                                var periodKey = (d.year_ec || '') + '|' + (d.year_gc || '') + '|' + d.date;
                                if (timePeriods.indexOf(periodKey) === -1) {
                                    timePeriods.push(periodKey);
                                }
                                if (!timeDataMap[periodKey]) timeDataMap[periodKey] = {};
                                timeDataMap[periodKey][r.title] = d.value;
                            });
                        });
                        // Sort by date descending
                        timePeriods.sort(function(a, b) {
                            return b.localeCompare(a);
                        });
                        
                        head = '<tr>';
                        head += '<th scope="col" class="sticky-col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; min-width: 150px; max-width: 150px; width: 150px;">Code</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">View</th>';
                        timePeriods.forEach(function(period) {
                            var parts = period.split('|');
                            var dateLabel = parts[2];
                            results.forEach(function(r) {
                                (r.daily || []).forEach(function(d) {
                                    if (d.date === parts[2]) {
                                        dateLabel = d.greg_date_formatted || d.date;
                                    }
                                });
                            });
                            head += '<th class="value-cell" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; white-space: nowrap;">' + dateLabel + '</th>';
                        });
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Topic</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Category</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Unit</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Freq</th>';
                        head += '<th scope="col" style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom;">Desc</th>';
                        head += '</tr>';
                        
                        selections.indicators.forEach(function(ind) {
                            rowsHtml += '<tr data-id="' + (ind.id || '') + '" data-code="' + (ind.code || '') + '">';
                            rowsHtml += '<td class="sticky-col" style="min-width: 150px; max-width: 150px; width: 150px;"><div class="font-bold text-sm">' + (ind.code || '-') + '</div><div class="text-xs text-gray-600 truncate" style="max-width: 140px;">' + (ind.title || '-') + '</div></td>';
                            rowsHtml += '<td class="text-center"><a href="/indicator/' + (ind.id || '') + '/" class="inline-flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition" title="View Indicator Details"><i class="fas fa-eye"></i></a></td>';
                            timePeriods.forEach(function(period) {
                                var value = timeDataMap[period] && timeDataMap[period][ind.title] !== undefined ? timeDataMap[period][ind.title] : null;
                                rowsHtml += '<td class="value-cell">' + fmt(value) + '</td>';
                            });
                            rowsHtml += '<td class="text-xs">' + (ind.topic || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.category || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.unit || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.freq || '-') + '</td>';
                            rowsHtml += '<td class="text-xs">' + (ind.desc || '-') + '</td>';
                            rowsHtml += '</tr>';
                        });
                    }
                }

                $('#explorer-head').html(head);
                var colCount = 2 + (currentMode === 'annual' ? sortedYears.length : timePeriods.length) + 5; // Code + View + time periods + Topic + Category + Unit + Freq + Desc
                insertRowsChunked('#explorer-body', rowsHtml || '<tr><td colspan="' + colCount + '">No data available.</td></tr>');
            })
            .fail(function () {
                $('#explorer-head').html('');
                $('#explorer-body').html('<tr><td class="text-center py-3 text-danger">Failed to load data.</td></tr>');
            })
            .always(function () {
                try { applyBtn.prop('disabled', false); } catch (e) { }
                currentRequest = null;
            });
        currentRequest = indicatorsReq;
    }

    renderTable();
})();
