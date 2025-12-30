
        (function () {
            var selections = { indicators: [] };
            var currentMode = 'annual'; 

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
                $('#category-list .cat-checkbox').prop('checked', this.checked).trigger('change');
            });
            $('#ind-select-all').on('change', function () {
                $('#ind-list .ind-checkbox').prop('checked', this.checked);
            });

            function collectSelection() {
                selections.indicators = [];
                $('#ind-list .ind-checkbox:checked').each(function () {
                    selections.indicators.push({
                        id: $(this).data('id'),
                        title: $(this).data('title')
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

                $.get('/api/indicators-bulk/', { ids: ids.join(','), mode: currentMode })
                    .done(function (resp) {
                        var results = resp.results || [];
                        var head = '<tr><th>Year (EC)</th><th>Year (GC)</th>';
                        if (currentMode === 'quarterly') head = '<tr><th>Year (EC)</th><th>Year (GC)</th><th>Quarter</th>';
                        if (currentMode === 'monthly') head = '<tr><th>Year (EC)</th><th>Year (GC)</th><th>Month</th>';
                        if (currentMode === 'weekly') head = '<tr><th>Year (EC)</th><th>Year (GC)</th><th>Week</th>';
                        if (currentMode === 'daily') head = '<tr><th>Year (EC)</th><th>Year (GC)</th><th>Gregorian Date</th><th>Ethiopian Date</th>';
                        selections.indicators.forEach(i => head += `<th>${i.title}</th>`);
                        head += '</tr>';

                        var rowsHtml = '';

                        if (currentMode === 'annual') {
                            var rowMap = {};
                            results.forEach(r => {
                                (r.all_annual || []).forEach(a => {
                                    var key = `${a.year_ec}|${a.year_gc}`;
                                    if (!rowMap[key]) rowMap[key] = { year_ec: a.year_ec, year_gc: a.year_gc, values: {} };
                                    rowMap[key].values[r.title] = a.value;
                                });
                            });
                            Object.values(rowMap).forEach(r => {
                                rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td>`;
                                selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                                rowsHtml += '</tr>';
                            });
                        }
                        else if (currentMode === 'quarterly') {
                            var rowMap = {};
                            results.forEach(r => {
                                (r.quarterly || []).forEach(q => {
                                    var key = `${q.year_ec}|${q.year_gc}|${q.quarter_number}`;
                                    if (!rowMap[key]) rowMap[key] = { year_ec: q.year_ec, year_gc: q.year_gc, quarter: q.quarter || 'Q' + q.quarter_number, values: {} };
                                    rowMap[key].values[r.title] = q.value;
                                });
                            });
                            Object.values(rowMap).forEach(r => {
                                rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.quarter)}</td>`;
                                selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                                rowsHtml += '</tr>';
                            });
                        }
                        else if (currentMode === 'monthly') {
                            var rowMap = {};
                            results.forEach(r => {
                                (r.monthly || []).forEach(m => {
                                    var key = `${m.year_ec}|${m.year_gc}|${m.month_number}`;
                                    if (!rowMap[key]) rowMap[key] = { year_ec: m.year_ec, year_gc: m.year_gc, month: m.month_amh + ' (' + m.month + ')', values: {} };
                                    rowMap[key].values[r.title] = m.value;
                                });
                            });
                            Object.values(rowMap).forEach(r => {
                                rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.month)}</td>`;
                                selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                                rowsHtml += '</tr>';
                            });
                        }
                        else if (currentMode === 'weekly') {
                            var rowMap = {};
                            results.forEach(r => {
                                (r.weekly || []).forEach(w => {
                                    var key = `${w.year_ec || ''}|${w.year_gc || ''}|${w.date}`;
                                    if (!rowMap[key]) rowMap[key] = { year_ec: w.year_ec, year_gc: w.year_gc, week: w.week_label || ('Week' + (w.week || '')), values: {} };
                                    rowMap[key].values[r.title] = w.value;
                                });
                            });
                            Object.values(rowMap).forEach(r => {
                                rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.week)}</td>`;
                                selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                                rowsHtml += '</tr>';
                            });
                        }
                        else if (currentMode === 'daily') {
                            var rowMap = {};
                            results.forEach(r => {
                                (r.daily || []).forEach(d => {
                                    var key = `${d.year_ec || ''}|${d.year_gc || ''}|${d.date}`;
                                    if (!rowMap[key]) rowMap[key] = { year_ec: d.year_ec, year_gc: d.year_gc, greg: d.greg_date_formatted || d.date, ethio: d.ethio_date || '', values: {} };
                                    rowMap[key].values[r.title] = d.value;
                                });
                            });
                            Object.values(rowMap).forEach(r => {
                                rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.greg)}</td><td>${fmt(r.ethio)}</td>`;
                                selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                                rowsHtml += '</tr>';
                            });
                        }

                        $('#explorer-head').html(head);
                        $('#explorer-body').html(rowsHtml || '<tr><td colspan="' + (2 + selections.indicators.length + (currentMode === "daily" ? 2 : currentMode === "weekly" ? 1 : currentMode === "monthly" ? 1 : currentMode === "quarterly" ? 1 : 0)) + '">No data available.</td></tr>');

                    })
                    .fail(function () {
                        $('#explorer-head').html('');
                        $('#explorer-body').html('<tr><td class="text-center py-3 text-danger">Failed to load data.</td></tr>');
                    });
            }

            renderTable();
        })();
 