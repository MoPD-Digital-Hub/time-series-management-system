(function () {
  // --- State
  let selections = { indicators: [] };
  let currentMode = "annual";
  let currentRequest = null;
  const EDIT_BUFFER = {}; // key -> payload
  const LAST_SAVED_VALUES = {};

  // Inject CSS for pending and unseen cells
  $('<style>')
    .prop('type', 'text/css')
    .html(`
      .pending-cell {
        background-color: #fff9db !important; /* Light yellow background */
        border: 2px solid #ffec99 !important;
        position: relative;
      }
      .unseen-cell::after {
        content: "";
        position: absolute;
        top: 4px;
        right: 4px;
        width: 8px;
        height: 8px;
        background-color: #228be6 !important; /* Brighter blue */
        border-radius: 50%;
        pointer-events: none;
        box-shadow: 0 0 2px rgba(0,0,0,0.2);
      }
      .editable-cell:focus {
        outline: none;
        background-color: #e7f5ff !important;
      }
    `)
    .appendTo('head');

  // Sidebar state
  let sidebarLoading = false;
  let sidebarSelectedItem = null;
  let sidebarFilter = null; // { mode, year_ec?, year_gc?, quarter_number?, month_number? }
  let sidebarPage = 1;
  let sidebarHasNext = false;
  let sidebarHasPrev = false;
  let currentSidebarResults = []; // Sync table rows with sidebar items

  // --- Helpers
  function getCookie(name) {
    const v = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return v ? v.pop() : "";
  }
  function fmt(v) {
    return v === null || v === undefined || v === "" ? "" : v;
  }
  function escapeHtml(s) {
    if (!s && s !== 0) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Insert large table HTML in chunks to avoid blocking the main thread
  function insertRowsChunked(containerSelector, htmlString, chunkSize = 200, cb) {
    if (!htmlString) {
      $(containerSelector).html('');
      if (typeof cb === 'function') cb();
      return;
    }
    // split by row ending; keep the closing tag
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
      if (i < parts.length) {
        // schedule next chunk to yield to the event loop
        setTimeout(appendChunk, 8);
      } else {
        if (typeof cb === 'function') cb();
      }
    }
    appendChunk();
  }

  function buildSavedKey(
    indicatorId,
    yearEc,
    yearGc,
    quarterNumber,
    monthNumber,
    mode,
    periodKey
  ) {
    const parts = [
      indicatorId !== undefined && indicatorId !== null
        ? String(indicatorId)
        : "",
      yearEc !== undefined && yearEc !== null ? String(yearEc) : "",
      yearGc !== undefined && yearGc !== null ? String(yearGc) : "",
      quarterNumber !== undefined && quarterNumber !== null
        ? `Q${quarterNumber}`
        : "",
      monthNumber !== undefined && monthNumber !== null
        ? `M${monthNumber}`
        : "",
      mode || "",
      periodKey || "",
    ];
    return parts.join("|");
  }

  function rememberSavedValues(updates) {
    updates.forEach((up) => {
      const key = buildSavedKey(
        up.indicator_id,
        up.year_ec,
        up.year_gc,
        up.quarter_number,
        up.month_number,
        currentMode,
        up.week || up.date || ""
      );
      LAST_SAVED_VALUES[key] =
        up.value === undefined || up.value === null ? "" : String(up.value);
    });
  }

  function getSavedValue(
    indicatorId,
    yearEc,
    yearGc,
    quarterNumber,
    monthNumber,
    mode,
    periodKey
  ) {
    const key = buildSavedKey(
      indicatorId,
      yearEc,
      yearGc,
      quarterNumber,
      monthNumber,
      mode,
      periodKey
    );
    return LAST_SAVED_VALUES[key];
  }

  // --- Dropdown toggle
  function toggleMenu(btnId, menuId) {
    $(btnId).on("click", function (e) {
      e.stopPropagation();
      var $menu = $(menuId);
      $(".absolute.z-10").not($menu).addClass("hidden");
      $menu.toggleClass("hidden");
    });
  }
  toggleMenu("#dd-category-btn", "#dd-category");
  toggleMenu("#dd-ind-btn", "#dd-ind");
  $(document).on("click", () => $(".absolute.z-10").addClass("hidden"));
  $("#dd-category, #dd-ind").on("click", function (e) {
    e.stopPropagation();
  });

  // --- Search filters
  $("#search-category").on("input", function () {
    const term = $(this).val().toLowerCase();
    $("#category-list label").each(function () {
      $(this).toggle($(this).text().toLowerCase().includes(term));
    });
  });
  $("#search-ind").on("input", function () {
    const term = $(this).val().toLowerCase();
    $("#ind-list label").each(function () {
      $(this).toggle($(this).text().toLowerCase().includes(term));
    });
  });

  // --- Select all checkboxes
  $("#category-select-all").on("change", function () {
    $("#category-list .cat-checkbox")
      .prop("checked", this.checked)
      .trigger("change");
  });


  $("#ind-select-all").on("change", function () {
    // Only check checkboxes whose parent label is visible
    $("#ind-list .ind-checkbox").filter(function () {
      return $(this).closest("label").is(":visible");
    }).prop("checked", this.checked);

    collectSelection();
  });






  // --- Hierarchy filter functions
  function updateIndicatorList() {
    const selectedCats = $("#category-list .cat-checkbox:checked")
      .map((_, el) => $(el).data("id"))
      .get();
    $("#ind-list label").each(function () {
      const catId = $(this).data("cat");
      const show = selectedCats.length === 0 || selectedCats.includes(catId);
      $(this).toggle(show);
    });
    collectSelection();
  }

  // --- Collect selected indicators
  function collectSelection() {
    selections.indicators = $("#ind-list .ind-checkbox:checked").filter(function () {
      // only include checkboxes whose parent label is visible
      return $(this).closest("label").is(":visible");
    }).map(function () {
      return { id: $(this).data("id"), title: $(this).data("title") };
    }).get();

    // whenever indicators change, reset sidebar
    resetSidebar();
  }


  // --- Trigger hierarchy updates on checkbox change
  $("#category-list .cat-checkbox").on("change", function () {
    updateIndicatorList();
  });
  $("#ind-list .ind-checkbox").on("change", collectSelection);

  // --- Mode switching
  $(".data-mode").on("click", function () {
    $(".data-mode").removeClass("btn-primary").addClass("btn-outline-primary");
    $(this).removeClass("btn-outline-primary").addClass("btn-primary");
    currentMode = $(this).data("mode");
    sidebarSelectedItem = null;
    resetSidebar();
    renderTable();
  });

  // --- Apply / clear
  // When user clicks Apply we should render using the current selections and preserve any
  // sidebarSelectedItem the user previously chose. collectSelection() resets the sidebar
  // so calling it here cleared the selected year/quarter/month and caused GC to appear wrong.
  $("#apply-selection").on("click", function () {
    renderTable();
  });
  $("#clear-all").on("click", function () {
    $("input[type=checkbox], input[type=radio]").prop("checked", false);
    selections.indicators = [];
    currentMode = "annual";
    updateIndicatorList();
    sidebarSelectedItem = null;
    resetSidebar();
    renderTable();
  });

  let currentPage = 1;
  const ROWS_PER_PAGE = 10;

  // --- Sidebar helpers -------------------------------------------------
  function resetSidebar() {
    sidebarPage = 1;
    sidebarSelectedItem = null;
    sidebarFilter = null;
    sidebarHasNext = false;
    sidebarHasPrev = false;

    if (!selections.indicators.length) {
      $("#sidebar-container").addClass("hidden");
      $("#sidebar-nav").addClass("hidden");
      $("#side-pagination").html("");
      $("#sidebar-loading").addClass("hidden");
      updateSidebarNav();
      return;
    }

    $("#sidebar-container").removeClass("hidden");
    $("#side-pagination").html(
      '<div class="text-center text-sm text-gray-500">Loading...</div>'
    );
    $("#sidebar-loading").removeClass("hidden");
    loadSidebarItems();
  }

  function loadSidebarItems() {
    if (sidebarLoading || !selections.indicators.length) return;
    sidebarLoading = true;

    let url = "";
    if (currentMode === "annual") {
      url = "/user-management/sidebar/annual/";
    } else if (currentMode === "quarterly") {
      url = "/user-management/sidebar/quarterly/";
    } else if (currentMode === "monthly") {
      url = "/user-management/sidebar/monthly/";
    } else if (currentMode === "weekly") {
      url = "/user-management/sidebar/weekly/";
    } else if (currentMode === "daily") {
      url = "/user-management/sidebar/daily/";
    }

    if (!url) {
      sidebarLoading = false;
      return;
    }

    console.log(`[Sidebar] Loading ${currentMode} page ${sidebarPage} from ${url}`);

    $("#side-pagination").html(
      '<div class="text-center text-sm text-gray-500">Loading...</div>'
    );
    $("#sidebar-loading").removeClass("hidden");

    $.get(url, { page: sidebarPage, ids: selections.indicators.map(i => i.id).join(",") })
      .done(function (resp) {
        console.log("[Sidebar] Received response:", resp);
        const respObj = (resp && resp.results) ? resp : (Array.isArray(resp) ? { results: resp } : (resp || {}));
        const items = respObj.results || [];
        currentSidebarResults = items;

        // Pagination state
        sidebarHasPrev = sidebarPage > 1;
        if (respObj.has_next !== undefined) {
          sidebarHasNext = !!respObj.has_next;
        } else if (respObj.next !== undefined) {
          sidebarHasNext = !!respObj.next;
        } else if (respObj.total_pages !== undefined) {
          sidebarHasNext = Number(sidebarPage) < Number(respObj.total_pages);
        } else {
          sidebarHasNext = items.length >= 10;
        }

        console.log(`[Sidebar] Items: ${items.length}, Prev: ${sidebarHasPrev}, Next: ${sidebarHasNext}`);

        if (!items.length) {
          if (sidebarPage > 1) {
            console.log("[Sidebar] No items on page, stepping back");
            sidebarPage--;
            sidebarLoading = false;
            loadSidebarItems();
            return;
          }
          $("#side-pagination").html('<div class="text-center text-sm text-gray-500">No items</div>');
          return;
        }

        // Helpers
        const readYearEC = (it) => it.year_ec || it.year_EC || it.year;
        const readYearGC = (it) => it.year_gc || it.year_GC || "";
        const readFieldAny = (it, ...names) => {
          for (let n of names) if (it[n] !== undefined) return it[n];
          return "";
        };

        let html = "";
        items.forEach((item) => {
          const yearEc = readYearEC(item);
          const yearGc = readYearGC(item);
          const itemId = item.id || `${yearEc}-${yearGc}-${currentMode}`;

          let primary = "";
          let secondary = "";
          let extraAttrs = `data-year-ec="${yearEc || ""}" data-year-gc="${escapeHtml(yearGc || "")}"`;

          if (currentMode === "annual") {
            primary = `${yearEc || "-"} EC`;
            secondary = `${yearGc || "-"} GC`;
          } else if (currentMode === "quarterly") {
            const eng = readFieldAny(item, "title_eng", "title_ENG", "title");
            const amh = readFieldAny(item, "title_amh", "title_AMH");
            primary = amh ? `${eng} / ${amh}` : eng || "Quarter";
            secondary = `Year (GC): ${yearGc || "-"}`;
            extraAttrs += ` data-quarter-number="${item.quarter_number || item.number || ""}"`;
          } else if (currentMode === "monthly") {
            const eng = readFieldAny(item, "month_eng", "month_ENG");
            const amh = readFieldAny(item, "month_amh", "month_AMH");
            primary = amh ? `${eng} / ${amh}` : eng || "Month";
            secondary = `Year (GC): ${yearGc || "-"}`;
            extraAttrs += ` data-month-number="${item.month_number || item.number || ""}"`;
          } else if (currentMode === "weekly") {
            primary = item.label || "Week";
            secondary = item.ethio_date || "";
            extraAttrs += ` data-date="${item.date || ""}" data-week="${item.week || ""}"`;
          } else if (currentMode === "daily") {
            primary = item.label || "Day";
            secondary = item.greg_date_formatted || "";
            extraAttrs += ` data-date="${item.date || ""}"`;
          }

          const activeClass = (sidebarSelectedItem && String(sidebarSelectedItem) === String(itemId)) ? "active" : "";
          html += `
            <button type="button" class="sidebar-item sidebar-button ${activeClass}" data-id="${itemId}" ${extraAttrs}>
              <span class="sidebar-label">${escapeHtml(primary)}</span>
              <span class="sidebar-sub">${escapeHtml(secondary)}</span>
            </button>`;
        });

        $("#side-pagination").html(html);
      })
      .fail(function (xhr) {
        console.error("[Sidebar] Request failed:", xhr.status, xhr.statusText);
        sidebarHasNext = false;
        sidebarHasPrev = sidebarPage > 1;
        $("#side-pagination").html('<div class="text-center text-sm text-danger">Failed to load items.</div>');
      })
      .always(function () {
        sidebarLoading = false;
        $("#sidebar-loading").addClass("hidden");
        updateSidebarNav();
        try { renderTable(); } catch (e) { }
      });
  }

  function updateSidebarNav() {
    if (!selections.indicators.length) {
      $("#sidebar-nav").addClass("hidden");
      return;
    }
    $("#sidebar-nav").removeClass("hidden");
    $("#sidebar-prev-btn").prop("disabled", !sidebarHasPrev || sidebarLoading);
    $("#sidebar-next-btn").prop("disabled", !sidebarHasNext || sidebarLoading);
  }

  // Sidebar pagination buttons (delegated for robustness)
  $(document).on("click", "#sidebar-prev-btn", function () {
    if (!sidebarHasPrev || sidebarLoading) return;
    sidebarPage = Math.max(1, sidebarPage - 1);
    sidebarFilter = null;
    sidebarSelectedItem = null;
    loadSidebarItems();
  });

  $(document).on("click", "#sidebar-next-btn", function () {
    if (!sidebarHasNext || sidebarLoading) return;
    sidebarPage += 1;
    sidebarFilter = null;
    sidebarSelectedItem = null;
    loadSidebarItems();
  });

  // Sidebar item click: select year / quarter / month and refresh table
  $(document).on("click", ".sidebar-item", function () {
    const $el = $(this);
    $(".sidebar-item").removeClass("active");
    $el.addClass("active");
    sidebarSelectedItem = String($el.attr("data-id"));

    // Read raw data attributes safely (attr returns string or undefined)
    const rawYearEc = $el.attr("data-year-ec");
    const rawYearGc = $el.attr("data-year-gc");
    const rawQuarter = $el.attr("data-quarter-number");
    const rawMonth = $el.attr("data-month-number");
    const rawDate = $el.attr("data-date");
    const rawWeek = $el.attr("data-week");

    const parsedYearEc =
      rawYearEc !== undefined && rawYearEc !== null && rawYearEc !== ""
        ? Number(rawYearEc)
        : null;
    const parsedYearGc =
      rawYearGc !== undefined && rawYearGc !== null && rawYearGc !== ""
        ? String(rawYearGc)
        : "";
    const parsedQuarter =
      rawQuarter !== undefined && rawQuarter !== null && rawQuarter !== ""
        ? Number(rawQuarter)
        : null;
    const parsedMonth =
      rawMonth !== undefined && rawMonth !== null && rawMonth !== ""
        ? Number(rawMonth)
        : null;

    // Build sidebarFilter based on current mode and parsed attributes
    if (currentMode === "annual") {
      sidebarFilter = {
        mode: "annual",
        year_ec: parsedYearEc,
        year_gc: parsedYearGc,
      };
    } else if (currentMode === "quarterly") {
      sidebarFilter = {
        mode: "quarterly",
        year_ec: parsedYearEc,
        year_gc: parsedYearGc,
      };
      if (parsedQuarter !== null) sidebarFilter.quarter_number = parsedQuarter;
    } else if (currentMode === "monthly") {
      sidebarFilter = {
        mode: "monthly",
        year_ec: parsedYearEc,
        year_gc: parsedYearGc,
      };
      if (parsedMonth !== null) sidebarFilter.month_number = parsedMonth;
    } else if (currentMode === "weekly") {
      sidebarFilter = {
        mode: "weekly",
        date: rawDate,
        week: rawWeek,
        year_ec: parsedYearEc,
        year_gc: parsedYearGc
      };
    } else if (currentMode === "daily") {
      sidebarFilter = {
        mode: "daily",
        date: rawDate
      };
    }

    currentPage = 1;
    renderTable();
  });

  // --- Table rendering -------------------------------------------------
  function renderTable() {
    if (!selections.indicators.length) {
      $("#explorer-head").html("<tr><th>-</th></tr>");
      $("#explorer-body").html('<tr><td class="text-center py-3">-</td></tr>');
      $("#pagination-container").html("");
      $("#sidebar-container").addClass("hidden");
      return;
    }

    const ids = selections.indicators.map((i) => i.id).join(",");

    // xpect a slightly different mode string
    let apiMode = currentMode;
    if (currentMode === "quarterly") apiMode = "quarterly";
    if (currentMode === "monthly") apiMode = "monthly";

    let params = { ids: ids, mode: apiMode };

    // Request indicators; also request month names from sidebar when in monthly mode
    const payload = {
      records: selections.indicators.map(i => i.id),
      record_type: apiMode,
      entry_filter: sidebarFilter

    };

    if (currentRequest && currentRequest.abort) currentRequest.abort();
    const applyBtn = $('#apply-selection');
    const indicatorsReq = $.ajax({
      url: "/api/indicators-bulk/",
      method: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      data: JSON.stringify({
        records: selections.indicators.map((i) => i.id),
        record_type: apiMode,
        entry_filter: sidebarFilter || null
      }),
      beforeSend: function () {
        // show simple loading state in table while request is pending
        $("#explorer-head").html("<tr><th>Loading...</th></tr>");
        $("#explorer-body").html(
          '<tr><td class="text-center py-3">Loading...</td></tr>'
        );
        try { applyBtn.prop('disabled', true); } catch (e) { }
      },
      complete: function () {
        // noop
      },
    });
    currentRequest = indicatorsReq;

    // request the monthly sidebar ONLY if we don't have it or need fresh labels
    // optimization: if loadSidebarItems just ran, it might have labels, but for now we keep it simple
    // but we MUST ensure it uses the correct page.
    const monthsReq =
      currentMode === "monthly"
        ? $.get("/user-management/sidebar/monthly/", { page: sidebarPage })
        : $.Deferred().resolve(null);

    $.when(indicatorsReq, monthsReq)
      .done(function (indResp, monthsResp) {
        // indResp may be [data, statusText, jqXHR] when using $.when
        const resp = Array.isArray(indResp) ? indResp[0] : indResp;
        const results = resp.results || [];

        // Helper functions (normalize API field name variations)
        function getYearEC(obj) {
          if (!obj) return undefined;
          if (obj.year_ec !== undefined) return obj.year_ec;
          if (obj.year_EC !== undefined) return obj.year_EC;
          if (obj.year !== undefined) return obj.year;
          return undefined;
        }
        function getYearGC(obj) {
          if (!obj) return undefined;
          if (obj.year_gc !== undefined) return obj.year_gc;
          if (obj.year_GC !== undefined) return obj.year_GC;
          if (obj.year !== undefined) return obj.year;
          return undefined;
        }
        function getIndTitle(ind) {
          if (!ind) return "";
          return (
            ind.title ||
            ind.title_ENG ||
            ind.title_eng ||
            ind.name ||
            ind.code ||
            ""
          );
        }

        const monthNamesFromSidebar = {};
        if (monthsResp) {
          const monthsBody = Array.isArray(monthsResp)
            ? monthsResp[0]
            : monthsResp;
          if (monthsBody && Array.isArray(monthsBody.results)) {
            monthsBody.results.forEach((m) => {
              const num = m.month_number || m.number || null;
              if (num)
                monthNamesFromSidebar[Number(num)] =
                  m.month_AMH || m.month_ENG || m.month_eng || "";
            });
          }
        }

        const monthLabels = [
          "Meskerem",
          "Tikimt",
          "Hidar",
          "Tahsas",
          "Tir",
          "Yekatit",
          "Megabit",
          "Miyazya",
          "Ginbot",
          "Sene",
          "Hamle",
          "Nehase",
        ];

        // --- Collect all historical years across all indicators and all modes
        let allYearsEC = new Set();
        let allYearsGC = {};
        results.forEach((ind) => {
          if (!ind) return;
          (ind.all_annual || []).forEach((a) => {
            const y = getYearEC(a);
            const g = getYearGC(a);
            if (y !== undefined && y !== null && y !== "") {
              const nY = Number(y);
              allYearsEC.add(nY);
              if (g !== undefined && g !== null && String(g).trim() !== "") {
                allYearsGC[nY] = String(g).trim();
              } else if (!allYearsGC[nY]) {
                allYearsGC[nY] = "";
              }
            }
          });
          (ind.quarterly || []).forEach((q) => {
            const y = getYearEC(q);
            const g = getYearGC(q);
            if (y !== undefined && y !== null && y !== "") {
              const nY = Number(y);
              allYearsEC.add(nY);
              if (g !== undefined && g !== null && String(g).trim() !== "") {
                allYearsGC[nY] = String(g).trim();
              } else if (!allYearsGC[nY]) {
                allYearsGC[nY] = "";
              }
            }
          });
          (ind.monthly || []).forEach((m) => {
            const y = getYearEC(m);
            const g = getYearGC(m);
            if (y !== undefined && y !== null && y !== "") {
              const nY = Number(y);
              allYearsEC.add(nY);
              if (g !== undefined && g !== null && String(g).trim() !== "") {
                allYearsGC[nY] = String(g).trim();
              } else if (!allYearsGC[nY]) {
                allYearsGC[nY] = "";
              }
            }
          });
          if (currentMode === "quarterly") console.log("[Debug] allYearsGC:", JSON.parse(JSON.stringify(allYearsGC)));
          (ind.weekly || []).forEach((w) => {
            if (w.year_ec) allYearsEC.add(Number(w.year_ec));
            if (w.year_ec && w.year_gc) allYearsGC[Number(w.year_ec)] = String(w.year_gc);
          });
          (ind.daily || []).forEach((d) => {
            if (d.year_ec) allYearsEC.add(Number(d.year_ec));
            if (d.year_ec && d.year_gc) allYearsGC[Number(d.year_ec)] = String(d.year_gc);
          });
        });

        const datapoints = resp.datapoints || [];
        datapoints.forEach(dp => {
          const y = Number(dp.year_ec);
          if (dp.year_gc && (!allYearsGC[y] || allYearsGC[y] === "")) {
            allYearsGC[y] = String(dp.year_gc);
          }
        });

        if (allYearsEC.size === 0) {
          // If indicators returned no historical years, prefer to use the server's
          const dps = resp.datapoints || resp.datapoints || [];
          if (Array.isArray(dps) && dps.length) {
            dps.forEach((dp) => {
              const y = dp && (dp.year_ec !== undefined ? Number(dp.year_ec) : null);
              if (y !== null && !isNaN(y)) {
                allYearsEC.add(y);
                allYearsGC[y] = dp.year_gc !== undefined && dp.year_gc !== null ? String(dp.year_gc) : "";
              }
            });
          } else {
            const currentYearEC = new Date().getFullYear() - 8;
            for (let i = 0; i < 10; i++) {
              const y = currentYearEC + i;
              allYearsEC.add(y);
              // Do not invent GC values; leave blank when DataPoint not present
              allYearsGC[y] = "";
            }
          }
        }

        const yearsArray = Array.from(allYearsEC);
        const minYear = Math.min(...yearsArray);
        const maxYear = Math.max(...yearsArray);

        // --- Build all rows (latest → oldest)
        const rowMap = {};
        for (let year = maxYear; year >= minYear; year--) {
          // Prefer backend-provided GC value exactly as returned by the model; compute fallback only when missing.
          const maybeGc = allYearsGC[year];
          const yearGC =
            maybeGc !== undefined && maybeGc !== null && String(maybeGc) !== ""
              ? String(maybeGc)
              : "";

          if (currentMode === "annual") {
            const key = `${year}|${yearGC}`;
            rowMap[key] = { year_ec: year, year_gc: yearGC, values: {} };
          }

          if (currentMode === "quarterly") {
            for (let q = 1; q <= 4; q++) {
              const key = `${year}|${yearGC}|Q${q}`;
              rowMap[key] = {
                year_ec: year,
                year_gc: yearGC,
                quarter: "Q" + q,
                quarter_number: q,
                values: {},
              };
            }
          }

          if (currentMode === "monthly") {
            for (let m = 1; m <= 12; m++) {
              const key = `${year}|${yearGC}|${m}`;
              // prefer names from sidebar for the selected year; fallback to default monthLabels
              const labelBase =
                monthNamesFromSidebar && monthNamesFromSidebar[m]
                  ? monthNamesFromSidebar[m]
                  : monthLabels[m - 1];
              rowMap[key] = {
                year_ec: year,
                year_gc: yearGC,
                month_number: m,
                month_label: `${labelBase} (${m})`,
                values: {},
              };
            }
          }
        }

        // --- Handle weekly/daily modes by collecting unique dates from results
        if (currentMode === "weekly" || currentMode === "daily") {
          results.forEach(ind => {
            const items = currentMode === "weekly" ? (ind.weekly || []) : (ind.daily || []);
            items.forEach(it => {
              if (!it.date) return;
              if (!rowMap[it.date]) {
                rowMap[it.date] = {
                  date: it.date,
                  label: it.week_label || it.day_label || it.date,
                  year_ec: it.year_ec,
                  year_gc: it.year_gc,
                  week: it.week,
                  values: {}
                };
              }
            });
          });
        }

        // --- Fill API data
        results.forEach((ind) => {
          if (!ind) return;
          const indTitle = getIndTitle(ind) || "";

          (ind.all_annual || []).forEach((a) => {
            const y = getYearEC(a);
            if (y === undefined || y === null || y === "") return;
            const nY = Number(y);
            const gKey = allYearsGC[nY] || "";
            const key = `${nY}|${gKey}`;
            if (rowMap[key]) rowMap[key].values[ind.id] = a;
          });

          if (currentMode === "quarterly") {
            console.log(`[Debug] ${indTitle} has ${(ind.quarterly || []).length} quarterly items`);
          }
          (ind.quarterly || []).forEach((q) => {
            const y = getYearEC(q);
            if (y === undefined || y === null || y === "") return;
            const nY = Number(y);
            const gKey = allYearsGC[nY] || "";
            const qnum =
              q.quarter_number !== undefined
                ? q.quarter_number
                : (q.number || q.quarter || null);
            if (qnum === null) return;
            // Coerce qnum to number if it's a string like "1"
            const nQ = isNaN(qnum) ? (String(qnum).match(/\d+/) ? Number(String(qnum).match(/\d+/)[0]) : null) : Number(qnum);
            if (nQ === null) return;
            const key = `${nY}|${gKey}|Q${nQ}`;
            if (currentMode === "quarterly") console.log(`[Debug] Filling ${indTitle} rowMap key: ${key}`, q);
            if (rowMap[key]) rowMap[key].values[ind.id] = q;
            else if (currentMode === "quarterly") console.warn(`[Debug] No rowMap entry for key: ${key}`);
          });

          (ind.monthly || []).forEach((m) => {
            const y = getYearEC(m);
            if (y === undefined || y === null || y === "") return;
            const nY = Number(y);
            const gKey = allYearsGC[nY] || "";
            const mnum =
              m.month_number !== undefined ? m.month_number : m.number || null;
            if (mnum === null) return;
            const key = `${nY}|${gKey}|${mnum}`;
            if (rowMap[key]) {
              // Resolve label: prefer sidebar month names for the selected year, then API month_AMH/ENG, then fallback
              const resolvedLabel =
                (monthNamesFromSidebar && monthNamesFromSidebar[mnum]) ||
                m.month_AMH ||
                m.month_amh ||
                m.month_ENG ||
                m.month_eng ||
                null;
              if (resolvedLabel)
                rowMap[key].month_label = `${resolvedLabel} (${mnum})`;
              rowMap[key].values[ind.id] = m;
            }
          });

          (ind.weekly || []).forEach(w => {
            if (w.date && rowMap[w.date]) rowMap[w.date].values[ind.id] = w;
          });
          (ind.daily || []).forEach(d => {
            if (d.date && rowMap[d.date]) rowMap[d.date].values[ind.id] = d;
          });
        });

        // --- Fill missing values with '-'
        Object.values(rowMap).forEach((r) => {
          selections.indicators.forEach((ind) => {
            const t = ind.title;
            if (r.values[t] === undefined) r.values[t] = "";
          });
        });

        // --- Build table header
        let head = "<tr><th>Year (EC)</th><th>Year (GC)</th>";
        if (currentMode === "quarterly") head += "<th>Quarter</th>";
        if (currentMode === "monthly") head += "<th>Month</th>";
        if (currentMode === "weekly") head += "<th>Week</th>";
        if (currentMode === "daily") head += "<th>Date</th>";
        // show titles exactly as provided by the selection (they were built from checkbox data-title)
        selections.indicators.forEach(
          (i) => (head += `<th>${escapeHtml(i.title)}</th>`)
        );
        head += "</tr>";
        $("#explorer-head").html(head);

        // if after filtering there are no rows, show a 'no data' row instead of hiding the table
        if (!Object.keys(rowMap).length) {
          $("#explorer-body").html(
            '<tr><td class="text-center py-3" colspan="' +
            (2 +
              (currentMode === "annual"
                ? 0
                : currentMode === "quarterly"
                  ? 1
                  : currentMode === "monthly"
                    ? 1
                    : currentMode === "weekly"
                      ? 1
                      : currentMode === "daily"
                        ? 1
                        : 1) +
              selections.indicators.length) +
            '">No data</td></tr>'
          );
          attachEditHandlers();
          return;
        }

        // --- Apply sidebar filter (year/quarter/month) before pagination
        let allRows = Object.values(rowMap);

        if (sidebarFilter && sidebarFilter.mode === currentMode) {
          allRows = allRows.filter((r) => {
            if (currentMode === "annual") {
              return Number(r.year_ec) === Number(sidebarFilter.year_ec);
            }
            if (currentMode === "quarterly") {
              // if a specific quarter_number provided, filter by both year and quarter
              if (
                sidebarFilter.quarter_number !== undefined &&
                sidebarFilter.quarter_number !== null
              ) {
                return (
                  Number(r.year_ec) === Number(sidebarFilter.year_ec) &&
                  Number(r.quarter_number) ===
                  Number(sidebarFilter.quarter_number)
                );
              }
              // otherwise show all quarters for the selected year
              return Number(r.year_ec) === Number(sidebarFilter.year_ec);
            }
            if (currentMode === "monthly") {
              // if a specific month_number provided, filter by both year and month
              if (
                sidebarFilter.month_number !== undefined &&
                sidebarFilter.month_number !== null
              ) {
                return (
                  Number(r.year_ec) === Number(sidebarFilter.year_ec) &&
                  Number(r.month_number) === Number(sidebarFilter.month_number)
                );
              }
              // otherwise show all months for the selected year
              return Number(r.year_ec) === Number(sidebarFilter.year_ec);
            }
            return true;
          });
        } else {
          // No sidebar filter selected -> use current sidebar items as the rows
          let syncedRows = [];
          if (currentSidebarResults && currentSidebarResults.length > 0) {
            currentSidebarResults.forEach(item => {
              const y = Number(item.year_ec || item.year_EC || item.year || 0);
              const g = allYearsGC[y] || "";
              let key = "";
              if (currentMode === "annual") key = `${y}|${g}`;
              else if (currentMode === "quarterly") key = `${y}|${g}|Q${item.quarter_number || item.number || ""}`;
              else if (currentMode === "monthly") key = `${y}|${g}|${item.month_number || item.number || ""}`;
              else if (currentMode === "weekly" || currentMode === "daily") key = item.date;

              if (rowMap[key]) {
                syncedRows.push(rowMap[key]);
              } else {
                // Create skeleton if not in map
                const skeleton = { year_ec: y, year_gc: g, values: {} };
                if (currentMode === "quarterly") {
                  skeleton.quarter_number = item.quarter_number || item.number;
                  skeleton.quarter = "Q" + skeleton.quarter_number;
                }
                if (currentMode === "monthly") {
                  skeleton.month_number = item.month_number || item.number;
                  const lbl = (monthNamesFromSidebar && monthNamesFromSidebar[skeleton.month_number]) || monthLabels[(skeleton.month_number || 1) - 1] || "";
                  skeleton.month_label = `${lbl} (${skeleton.month_number})`;
                }
                if (currentMode === "weekly" || currentMode === "daily") {
                  skeleton.date = item.date;
                  skeleton.label = item.label || item.date;
                }
                syncedRows.push(skeleton);
              }
            });
            allRows = syncedRows;
          } else {
            // Fallback if sidebar items not yet available: take latest 10 years
            allRows.sort((a, b) => Number(b.year_ec) - Number(a.year_ec));
            allRows = allRows.slice(0, 10);
          }
        }

        // Special handling for weekly/daily filtering by date
        if (sidebarFilter && (currentMode === "weekly" || currentMode === "daily")) {
          if (sidebarFilter.date) {
            allRows = allRows.filter(r => r.date === sidebarFilter.date);
          }
        }

        // --- Build table body (no internal pagination; sidebar controls time slices)
        const rowsPage = allRows;

        // If the filtered page has no rows, create editable empty rows so users can add data.
        if (!rowsPage || rowsPage.length === 0) {
          const generated = [];

          // Helper to read GC string when present; do NOT compute arithmetic fallback
          function computeGc(y) {
            return allYearsGC && allYearsGC[y] ? String(allYearsGC[y]) : "";
          }

          if (sidebarFilter && sidebarFilter.mode === currentMode) {
            const yec = Number(sidebarFilter.year_ec) || null;
            const ygc = sidebarFilter.year_gc || (yec ? computeGc(yec) : "");

            if (currentMode === "annual") {
              generated.push({ year_ec: yec, year_gc: ygc, values: {} });
            } else if (currentMode === "quarterly") {
              if (
                sidebarFilter.quarter_number !== undefined &&
                sidebarFilter.quarter_number !== null
              ) {
                const qn = Number(sidebarFilter.quarter_number);
                generated.push({
                  year_ec: yec,
                  year_gc: ygc,
                  quarter: "Q" + qn,
                  quarter_number: qn,
                  values: {},
                });
              } else {
                for (let q = 1; q <= 4; q++) {
                  generated.push({
                    year_ec: yec,
                    year_gc: ygc,
                    quarter: "Q" + q,
                    quarter_number: q,
                    values: {},
                  });
                }
              }
            } else if (currentMode === "monthly") {
              if (
                sidebarFilter.month_number !== undefined &&
                sidebarFilter.month_number !== null
              ) {
                const mn = Number(sidebarFilter.month_number);
                const lbl =
                  (monthNamesFromSidebar && monthNamesFromSidebar[mn]) ||
                  monthLabels[mn - 1] ||
                  "";
                generated.push({
                  year_ec: yec,
                  year_gc: ygc,
                  month_number: mn,
                  month_label: `${lbl} (${mn})`,
                  values: {},
                });
              } else {
                for (let m = 1; m <= 12; m++) {
                  const lbl =
                    (monthNamesFromSidebar && monthNamesFromSidebar[m]) ||
                    monthLabels[m - 1] ||
                    "";
                  generated.push({
                    year_ec: yec,
                    year_gc: ygc,
                    month_number: m,
                    month_label: `${lbl} (${m})`,
                    values: {},
                  });
                }
              }
            } else if (currentMode === "weekly" || currentMode === "daily") {
              if (sidebarFilter.date) {
                generated.push({
                  date: sidebarFilter.date,
                  label: sidebarFilter.label || sidebarFilter.date,
                  year_ec: sidebarFilter.year_ec,
                  year_gc: sidebarFilter.year_gc,
                  week: sidebarFilter.week,
                  values: {}
                });
              }
            }
          } else {
            // No sidebar filter: use sensible defaults (latest years/months/quarters)
            const latestYear = yearsArray && yearsArray.length ? Math.max(...yearsArray) : new Date().getFullYear() - 8;
            if (currentMode === "annual") {
              for (let y = latestYear; y > latestYear - 10; y--) {
                generated.push({ year_ec: y, year_gc: computeGc(y), values: {} });
              }
            } else if (currentMode === "quarterly") {
              for (let q = 1; q <= 4; q++) {
                generated.push({
                  year_ec: latestYear,
                  year_gc: computeGc(latestYear),
                  quarter: "Q" + q,
                  quarter_number: q,
                  values: {},
                });
              }
            } else if (currentMode === "monthly") {
              for (let m = 1; m <= 12; m++) {
                const lbl = (monthNamesFromSidebar && monthNamesFromSidebar[m]) || monthLabels[m - 1] || "";
                generated.push({
                  year_ec: latestYear,
                  year_gc: computeGc(latestYear),
                  month_number: m,
                  month_label: `${lbl} (${m})`,
                  values: {},
                });
              }
            }
          }

          // Build editable rows from generated skeletons
          let rowsHtml = "";
          generated.forEach((r) => {
            if (currentMode === "annual")
              rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td>`;
            if (currentMode === "quarterly")
              rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.quarter)}</td>`;
            if (currentMode === "monthly")
              rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.month_label)}</td>`;
            if (currentMode === "weekly")
              rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.label)}</td>`;
            if (currentMode === "daily")
              rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.label)}</td>`;

            selections.indicators.forEach((ind) => {
              const dataAttrs = `data-ind="${ind.id}" data-title="${escapeHtml(ind.title)}" data-year-ec="${r.year_ec}" data-year-gc="${r.year_gc}" data-mode="${currentMode}"` +
                (currentMode === "quarterly"
                  ? ` data-quarter="${r.quarter || ""}" data-quarter-number="${r.quarter_number || ""}"`
                  : "") +
                (currentMode === "monthly"
                  ? ` data-month-number="${r.month_number || ""}" data-month-label="${escapeHtml(r.month_label || "")}"`
                  : "") +
                (currentMode === "weekly" || currentMode === "daily"
                  ? ` data-date="${r.date || ""}"`
                  : "");

              rowsHtml += `<td contenteditable="true" class="editable-cell" ${dataAttrs}>${fmt("")}</td>`;
            });

            rowsHtml += `</tr>`;
          });

          insertRowsChunked('#explorer-body', rowsHtml, 200, function () {
            try { attachEditHandlers(); } catch (e) { }
            renderPagination(generated.length);
          });
          return;
        }

        let rowsHtml = "";
        rowsPage.forEach((r) => {
          if (currentMode === "annual")
            rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
              r.year_gc
            )}</td>`;
          if (currentMode === "quarterly")
            rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
              r.year_gc
            )}</td><td>${fmt(r.quarter)}</td>`;
          if (currentMode === "monthly")
            rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
              r.year_gc
            )}</td><td>${fmt(r.month_label)}</td>`;
          if (currentMode === "weekly")
            rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
              r.year_gc
            )}</td><td>${fmt(r.label)}</td>`;
          if (currentMode === "daily")
            rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
              r.year_gc
            )}</td><td>${fmt(r.label)}</td>`;
          selections.indicators.forEach((ind) => {
            const dataObj = r.values[ind.id];
            if (currentMode === "quarterly") console.log(`[Debug Table] Rendering cell for ind ${ind.id} title "${ind.title}":`, dataObj);
            const value = dataObj && typeof dataObj === 'object' ? dataObj.value : dataObj;
            let extraClasses = "";
            let dataRecordId = "";
            let cellTitle = "";

            if (dataObj && typeof dataObj === 'object') {
              // Explicit Boolean check to handle potential stringified values or integer 0/1
              if (Boolean(dataObj.is_verified) === false) {
                extraClasses += " pending-cell";
                cellTitle = "Pending Approval";
              }
              if (Boolean(dataObj.is_seen) === false) {
                extraClasses += " unseen-cell";
                cellTitle += (cellTitle ? " & " : "") + "Unseen Change";
              }
              if (dataObj.id) dataRecordId = `data-record-id="${dataObj.id}"`;
            }

            let dataAttrs = `data-ind="${ind.id}" data-title="${escapeHtml(
              ind.title
            )}" data-year-ec="${r.year_ec}" data-year-gc="${r.year_gc
              }" data-mode="${currentMode}" ${dataRecordId}`;
            if (currentMode === "quarterly")
              dataAttrs += ` data-quarter="${r.quarter || ""
                }" data-quarter-number="${r.quarter_number || ""}"`;
            if (currentMode === "monthly")
              dataAttrs += ` data-month-number="${r.month_number || ""
                }" data-month-label="${escapeHtml(r.month_label || "")}"`;
            if (currentMode === "weekly" || currentMode === "daily")
              dataAttrs += ` data-date="${r.date || ""}"`;
            rowsHtml += `<td contenteditable="true" class="editable-cell ${extraClasses}" title="${cellTitle}" ${dataAttrs}>${fmt(
              value
            )}</td>`;
          });
          rowsHtml += "</tr>";
        });
        insertRowsChunked('#explorer-body', rowsHtml, 200, function () {
          try { attachEditHandlers(); } catch (e) { }
          renderPagination(allRows.length);
        });
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        // ignore aborts triggered when a previous request is intentionally cancelled
        if (textStatus === 'abort') return;
        console.warn(
          "indicators/months fetch failed:",
          textStatus,
          errorThrown
        );
        // retry once after a short delay to avoid transient failures immediately after save
        setTimeout(function () {
          const retryIndicatorsReq = $.ajax({
            url: "/api/indicators-bulk/",
            method: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            headers: { "X-CSRFToken": getCookie("csrftoken") },
            data: JSON.stringify({
              records: selections.indicators.map((i) => i.id),
              record_type: apiMode,
              entry_filter: sidebarFilter || null,
            }),
          });
          const retryMonthsReq =
            currentMode === "monthly"
              ? $.get("/user-management/sidebar/monthly/", {
                page: sidebarPage,
              })
              : $.Deferred().resolve(null);
          $.when(retryIndicatorsReq, retryMonthsReq)
            .done(function () {
              // successful retry — re-render table
              renderTable();
            })
            .fail(function () {
              $("#explorer-head").html("");
              $("#explorer-body").html(
                '<tr><td class="text-center py-3 text-danger">Failed to load data.</td></tr>'
              );
              $("#pagination-container").html("");
            });
        }, 600);
      }).always(function () {
        try { applyBtn.prop('disabled', false); } catch (e) { }
        currentRequest = null;
      });
  }

  function attachEditHandlers() {
    $(".editable-cell")
      .off("input")
      .on("input", function () {
        const $td = $(this);
        const ind_id = Number($td.data("ind"));
        const title = $td.data("title");
        const year_ec = Number($td.data("year-ec"));
        const year_gc =
          $td.data("year-gc") !== undefined && $td.data("year-gc") !== null
            ? String($td.data("year-gc"))
            : "";
        const mode = $td.data("mode");
        const rawVal = $td.text().trim();

        let key = `${ind_id}|${year_ec}|${year_gc}`;
        const payload = {
          indicator_id: ind_id,
          value: (rawVal === "-" || rawVal === "") ? null : rawVal,
          year_ec,
          year_gc,
        };

        if (mode === "quarterly") {
          payload.quarter_number = Number($td.data("quarter-number")) || null;
          payload.quarter = $td.data("quarter") || null;
          key += `|Q${payload.quarter_number || ""}`;
        }

        if (mode === "monthly") {
          payload.month_number = Number($td.data("month-number")) || null;
          payload.month_label = $td.data("month-label") || null;
          key += `|M${payload.month_number || ""}`;
        }

        if (mode === "weekly" || mode === "daily") {
          payload.date = $td.data("date") || null;
          key += `|D${payload.date || ""}`;
        }

        payload._title = title;
        EDIT_BUFFER[key] = payload;

        $td.addClass("edited-cell");
        $("#save-edits-btn").prop("disabled", false);
      });
  }

  function ensureSaveButton() {
    if ($("#save-edits-btn").length) return;
    const $btn = $(
      '<button id="save-edits-btn" class="btn btn-success btn-sm ml-2">Save Changes</button>'
    );
    $btn.insertAfter("#apply-selection");
    $btn.on("click", saveEdits);
  }
  ensureSaveButton();

  function renderPagination(totalRows) {
    const $container = $("#pagination-container");
    if (!selections.indicators.length || (!sidebarHasNext && !sidebarHasPrev)) {
      $container.html("");
      return;
    }

    let html = `
      <div class="d-flex align-items-center justify-content-between w-100 mt-3 p-2 bg-light border rounded">
        <div class="text-muted small">Showing results for Page ${sidebarPage}</div>
        <div class="btn-group">
          <button class="btn btn-outline-primary btn-sm" id="table-prev-btn" ${!sidebarHasPrev ? 'disabled' : ''}>
            <i class="fas fa-chevron-left mr-1"></i> Previous
          </button>
          <button class="btn btn-outline-primary btn-sm" id="table-next-btn" ${!sidebarHasNext ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right ml-1"></i>
          </button>
        </div>
      </div>
    `;
    $container.html(html);

    $("#table-prev-btn").on("click", function () {
      $("#sidebar-prev-btn").trigger("click");
    });
    $("#table-next-btn").on("click", function () {
      $("#sidebar-next-btn").trigger("click");
    });
  }

  function saveEdits() {
    const updates = Object.values(EDIT_BUFFER);
    if (!updates.length) {
      alert("No changes to save.");
      return;
    }

    $.ajax({
      url: "/api/indicators-bulk/",
      type: "PATCH",
      contentType: "application/json",
      data: JSON.stringify({ mode: currentMode, updates }),
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      success: function (resp) {
        const saved = resp.saved || 0;
        const errors = resp.errors || [];

        if (errors.length) {
          console.error("Some updates failed:", errors);
          alert(
            `Saved ${saved} updates, but some failed:\n` +
            errors.map((e) => JSON.stringify(e)).join("\n")
          );
        } else {
          console.log(`Saved ${saved} updates successfully.`);
          alert(`Saved ${saved} updates successfully.`);
        }

        // Clear buffer and reset cells
        $(".editable-cell.edited-cell").removeClass("edited-cell");
        for (const k in EDIT_BUFFER) delete EDIT_BUFFER[k];

        // Refresh table to show saved data. 
        // IMPORTANT: Call loadSidebarItems() to re-fetch data from server, ensuring status marks update.
        setTimeout(function () {
          loadSidebarItems();
        }, 400);
      },
      error: function (xhr) {
        const txt = xhr.responseJSON
          ? JSON.stringify(xhr.responseJSON)
          : xhr.statusText;
        alert("Save failed: " + txt);
      },
    });
  }

  // Mark as seen on focus/click
  $(document).on("focus click", ".editable-cell.unseen-cell", function () {
    const $td = $(this);
    const recordId = $td.attr("data-record-id");
    if (!recordId) return;

    const mode = $td.data("mode") || currentMode;
    const payload = {};
    if (mode === "annual") payload.annual_ids = [recordId];
    else if (mode === "monthly") payload.month_ids = [recordId];
    else if (mode === "quarterly") payload.quarter_ids = [recordId];
    else if (mode === "weekly" || mode === "daily") payload.kpi_ids = [recordId];

    $.ajax({
      url: "/api/acknowledge-seen/",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload),
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      success: function () {
        $td.removeClass("unseen-cell");
        // Update title: remove " & Unseen Change" or "Unseen Change"
        let currentTitle = $td.attr("title") || "";
        currentTitle = currentTitle.replace(" & Unseen Change", "").replace("Unseen Change", "");
        $td.attr("title", currentTitle.trim());
      },
    });
  });

  // --- Initial render
  updateCategoryList();
  updateIndicatorList();
  renderTable();

  // expose saveEdits
  window.__saveDataExplorerEdits = saveEdits;
})();
