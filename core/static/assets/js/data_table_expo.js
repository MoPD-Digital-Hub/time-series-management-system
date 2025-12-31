(function () {
  // --- State
  let selections = { indicators: [] };
  let currentMode = "annual";
  let currentRequest = null;
  const EDIT_BUFFER = {};
  const LAST_SAVED_VALUES = {};

  // Sidebar state
  let sidebarLoading = false;
  let sidebarSelectedItem = null;
  let sidebarFilter = null;
  let sidebarPage = 1;
  let sidebarHasNext = false;
  let sidebarHasPrev = false;
  let sidebarItemsCurrent = [];

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
  toggleMenu("#dd-topic-btn", "#dd-topic");
  toggleMenu("#dd-category-btn", "#dd-category");
  toggleMenu("#dd-ind-btn", "#dd-ind");
  $(document).on("click", () => $(".absolute.z-10").addClass("hidden"));
  $("#dd-topic, #dd-category, #dd-ind").on("click", function (e) {
    e.stopPropagation();
  });

  // --- Search filters
  $("#search-topic").on("input", function () {
    const term = $(this).val().toLowerCase();
    $("#topic-list label").each(function () {
      $(this).toggle($(this).text().toLowerCase().includes(term));
    });
  });
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
  $("#topic-select-all").on("change", function () {
    $("#topic-list .topic-checkbox")
      .prop("checked", this.checked)
      .trigger("change");
  });
  $("#category-select-all").on("change", function () {
    $("#category-list .cat-checkbox")
      .prop("checked", this.checked)
      .trigger("change");
  });
  $("#ind-select-all").on("change", function () {
    $("#ind-list .ind-checkbox").prop("checked", this.checked);
    collectSelection();
  });

  // --- Hierarchy filter functions
  function updateCategoryList() {
    const selectedTopics = $("#topic-list .topic-checkbox:checked")
      .map((_, el) => $(el).data("id"))
      .get();
    $("#category-list label").each(function () {
      const topicId = $(this).data("topic");
      $(this).toggle(selectedTopics.includes(topicId));
    });
  }

  function updateIndicatorList() {
    const selectedTopics = $("#topic-list .topic-checkbox:checked")
      .map((_, el) => $(el).data("id"))
      .get();
    const selectedCats = $("#category-list .cat-checkbox:checked")
      .map((_, el) => $(el).data("id"))
      .get();
    $("#ind-list label").each(function () {
      const topicId = $(this).data("topic");
      const catId = $(this).data("cat");
      const show =
        (selectedTopics.includes(topicId) && selectedCats.includes(catId)) ||
        (selectedTopics.length === 0 && selectedCats.length === 0); // show all if nothing selected
      $(this).toggle(show);
    });
    collectSelection();
  }

  // --- Collect selected indicators
  function collectSelection() {
    selections.indicators = $("#ind-list .ind-checkbox:checked")
      .map(function () {
        return { id: $(this).data("id"), title: $(this).data("title") };
      })
      .get();
    // whenever indicators change, reset sidebar
    resetSidebar();
  }

  // --- Trigger hierarchy updates on checkbox change
  $("#topic-list .topic-checkbox").on("change", function () {
    updateCategoryList();
    updateIndicatorList();
  });
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
    updateCategoryList();
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
    sidebarItemsCurrent = [];

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

    $("#side-pagination").html(
      '<div class="text-center text-sm text-gray-500">Loading...</div>'
    );
    $("#sidebar-loading").removeClass("hidden");

    $.get(url, { page: sidebarPage })
      .done(function (resp) {
        const respObj = Array.isArray(resp) ? { results: resp } : resp || {};
        const items = respObj.results || [];
        sidebarItemsCurrent = items;

        sidebarHasPrev =
          respObj.has_prev !== undefined
            ? !!respObj.has_prev
            : respObj.previous !== undefined
              ? !!respObj.previous
              : respObj.page > 1;

        if (respObj.has_next !== undefined) {
          sidebarHasNext = !!respObj.has_next;
        } else if (respObj.next !== undefined) {
          sidebarHasNext = !!respObj.next;
        } else if (
          respObj.page !== undefined &&
          respObj.total_pages !== undefined
        ) {
          sidebarHasNext = Number(respObj.page) < Number(respObj.total_pages);
        } else {
          // Unknown pagination format: assume page size 10 heuristic (if server returns full pages, next exists)
          const HEURISTIC_PAGE_SIZE = 10;
          sidebarHasNext = items.length >= HEURISTIC_PAGE_SIZE;
        }

        if (!items.length) {
          // If we requested a page > 1 and got no items, try stepping back one page and reload
          if (sidebarPage > 1) {
            sidebarPage = Math.max(1, sidebarPage - 1);
            loadSidebarItems();
            return;
          }
          $("#side-pagination").html(
            '<div class="text-center text-sm text-gray-500">No items</div>'
          );
          updateSidebarNav();
          return;
        }

        // helpers to read different possible API field names
        function readYearEC(it) {
          return it.year_ec !== undefined
            ? it.year_ec
            : it.year_EC !== undefined
              ? it.year_EC
              : it.year || undefined;
        }
        function readYearGC(it) {
          return it.year_gc !== undefined
            ? it.year_gc
            : it.year_GC !== undefined
              ? it.year_GC
              : it.year_gc || undefined;
        }
        function readQuarterNumber(it) {
          return it.quarter_number !== undefined
            ? it.quarter_number
            : it.number !== undefined
              ? it.number
              : it.quarter || undefined;
        }
        function readMonthNumber(it) {
          return it.month_number !== undefined
            ? it.month_number
            : it.number !== undefined
              ? it.number
              : undefined;
        }
        function readFieldAny(it, ...names) {
          for (let n of names)
            if (it[n] !== undefined && it[n] !== null) return it[n];
          return undefined;
        }

        let html = "";
        items.forEach((item, index) => {
          // Normalize year values and compute a consistent year_GC fallback when missing.
          const yecRaw = readYearEC(item);
          const ygcRaw = readYearGC(item);
          const yearEc =
            yecRaw !== undefined && yecRaw !== null && String(yecRaw) !== ""
              ? Number(yecRaw)
              : null;
          let yearGc =
            ygcRaw !== undefined && ygcRaw !== null && String(ygcRaw) !== ""
              ? String(ygcRaw)
              : null;
          if (!yearGc && yearEc !== null) {
            // Do NOT compute GC from EC; show blank when backend didn't provide one
            yearGc = "";
          }
          const fallbackId = `${yearEc !== null ? yearEc : ""}-${yearGc !== null ? yearGc : ""
            }-${currentMode}`;
          const itemId =
            item.id !== undefined && item.id !== null
              ? String(item.id)
              : fallbackId;
          let primary = "";
          let secondary = "";
          let extraAttrs = "";
          if (currentMode === "weekly") {
            const yearEcVal = readYearEC(item);
            const yearGcVal = readYearGC(item);
            const weekNum = item.week || item.week_number || 1;
            primary = item.label || `Week ${weekNum}`;
            extraAttrs = `data-week="${weekNum}" data-month-number="${item.month_number || ""
              }" data-year-ec="${yearEcVal !== undefined ? yearEcVal : ""}" data-year-gc="${yearGcVal !== undefined && yearGcVal !== null ? escapeHtml(yearGcVal) : ""
              }" data-date="${item.date || ""}"`;
          } else if (currentMode === "daily") {
            primary = item.date;
            const yearEcVal = readYearEC(item);
            const yearGcVal = readYearGC(item);
            extraAttrs = `data-day="${item.date}" data-year-ec="${yearEcVal !== undefined ? yearEcVal : ""
              }" data-year-gc="${yearGcVal !== undefined && yearGcVal !== null ? escapeHtml(yearGcVal) : ""
              }" data-date="${item.date || ""}"`;
          }

          if (currentMode === "annual") {
            const yearEcLabel = yearEc !== null ? yearEc : "-";
            const yearGcLabel = yearGc !== null ? yearGc : "-";
            primary = `${yearEcLabel} EC`;
            secondary = `${yearGcLabel} GC`;
            extraAttrs = `data-year-ec="${yearEc !== null ? yearEc : ""
              }" data-year-gc="${yearGc !== null ? escapeHtml(yearGc) : ""}"`;
          } else if (currentMode === "quarterly") {
            const eng =
              readFieldAny(item, "title_eng", "title_ENG", "title") || "";
            const amh = readFieldAny(item, "title_amh", "title_AMH") || "";
            const joinedTitle = (amh ? `${eng} / ${amh}` : eng) || "Quarter";
            primary = joinedTitle.trim();
            const yearGcLabel = yearGc !== null ? yearGc : "-";
            secondary = `Year (GC): ${yearGcLabel}`;
            const qnum = readQuarterNumber(item);
            extraAttrs = `data-year-ec="${yearEc !== null ? yearEc : ""
              }" data-year-gc="${yearGc !== null ? escapeHtml(yearGc) : ""
              }" data-quarter-number="${qnum !== undefined ? qnum : ""}"`;
          } else if (currentMode === "monthly") {
            const eng = readFieldAny(item, "month_eng", "month_ENG") || "";
            const amh = readFieldAny(item, "month_amh", "month_AMH") || "";
            const joinedTitle = (amh ? `${eng} / ${amh}` : eng) || "Month";
            primary = joinedTitle.trim();
            const yearGcLabel = yearGc !== null ? yearGc : "-";
            secondary = `Year (GC): ${yearGcLabel}`;
            const mnum = readMonthNumber(item);
            extraAttrs = `data-year-ec="${yearEc !== null ? yearEc : ""
              }" data-year-gc="${yearGc !== null ? escapeHtml(yearGc) : ""
              }" data-month-number="${mnum !== undefined ? mnum : ""}"`;
          }

          if (!primary) primary = "-";
          if (!secondary) secondary = "";

          const activeClass =
            sidebarSelectedItem && String(sidebarSelectedItem) === itemId
              ? "active"
              : "";
          html += `
                                 <button type="button"
                                         class="sidebar-item sidebar-button ${activeClass}"
                                         data-id="${itemId}" ${extraAttrs}>
                                     <span class="sidebar-label">${escapeHtml(
            primary
          )}</span>
                                     <span class="sidebar-sub">${escapeHtml(
            secondary
          )}</span>
                                 </button>`;
        });

        $("#side-pagination").html(html);

        const $buttons = $("#side-pagination .sidebar-item");
        if ($buttons.length) {
          if (sidebarSelectedItem) {
            const $target = $buttons
              .filter(`[data-id="${sidebarSelectedItem}"]`)
              .first();
            if ($target && $target.length) {
              selectSidebarItem($target, false);
            } else {
              $(".sidebar-item").removeClass("active");
              sidebarSelectedItem = null;
            }
          } else {
            $(".sidebar-item").removeClass("active");
          }
        } else {
          sidebarSelectedItem = null;
        }

        updateSidebarNav();
        renderTable();
      })
      .fail(function () {
        sidebarHasNext = false;
        sidebarHasPrev = sidebarPage > 1;
        $("#side-pagination").html(
          '<div class="text-center text-sm text-danger">Failed to load items.</div>'
        );
        updateSidebarNav();
        renderTable();
      })
      .always(function () {
        sidebarLoading = false;
        $("#sidebar-loading").addClass("hidden");
      });
  }

  function updateSidebarNav() {
    if (!selections.indicators.length) {
      $("#sidebar-nav").addClass("hidden");
      return;
    }
    $("#sidebar-nav").removeClass("hidden");
    $("#sidebar-prev-btn").prop("disabled", !sidebarHasPrev);
    $("#sidebar-next-btn").prop("disabled", !sidebarHasNext);

    if (sidebarHasPrev || sidebarHasNext) {
      $("#sidebar-nav").removeClass("hidden");
    } else {
      $("#sidebar-nav").addClass("hidden");
    }
  }

  $(document).ready(function () {
    $("#sidebar-next-btn").on("click", function () {
      if (!sidebarHasNext) return;
      sidebarPage += 1;
      sidebarSelectedItem = null;
      sidebarFilter = null;
      loadSidebarItems();
    });

    $("#sidebar-prev-btn").on("click", function () {
      if (!sidebarHasPrev) return;
      sidebarPage = Math.max(1, sidebarPage - 1);
      sidebarSelectedItem = null;
      sidebarFilter = null;
      loadSidebarItems();
    });
  });

  // Sidebar item click: select year / quarter / month and refresh table
  // Sidebar item click: select year / quarter / month / week / day and refresh table
  function selectSidebarItem($el, fireRender = true) {
    if (!$el || !$el.length) return;

    // --- Highlight selected item
    $(".sidebar-item").removeClass("active");
    $el.addClass("active");
    sidebarSelectedItem = String($el.attr("data-id") || "");

    // --- Parse common attributes
    const rawYearEc = $el.attr("data-year-ec");
    const rawYearGc = $el.attr("data-year-gc");
    const rawQuarter = $el.attr("data-quarter-number");
    const rawMonth = $el.attr("data-month-number");
    const rawWeek = $el.attr("data-week");
    const rawDay = $el.attr("data-day");
    const rawDate = $el.attr("data-date");

    const parsedYearEc = rawYearEc ? Number(rawYearEc) : null;
    const parsedYearGc = rawYearGc ? String(rawYearGc) : "";
    const parsedQuarter = rawQuarter ? Number(rawQuarter) : null;
    const parsedMonth = rawMonth ? Number(rawMonth) : null;
    const parsedWeek = rawWeek ? Number(rawWeek) : null;
    const parsedDay = rawDay ? rawDay : null; // keep as string "YYYY-MM-DD"
    const parsedDate = rawDate ? rawDate : parsedDay;

    // --- Build sidebarFilter based on currentMode
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
        year_ec: parsedYearEc,
        month: parsedMonth,
        week: parsedWeek,
        date: parsedDate,
      };
    } else if (currentMode === "daily") {
      sidebarFilter = {
        mode: "daily",
        year_ec: parsedYearEc,
        month: parsedMonth,
        day: parsedDay,
        date: parsedDate,
      };
    }

    // --- Reset pagination for new selection
    currentPage = 1;

    // --- Render table
    if (fireRender) renderTable();
  }

  $(document).on("click", ".sidebar-item", function () {
    selectSidebarItem($(this), true);
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
    if (currentMode === "quarterly") apiMode = "quarter";
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
        try { applyBtn.prop('disabled', true); } catch(e){}
      },
      success: function (resp) {
        // success 
      },
      complete: function () {
        // noop
      },
    });
    currentRequest = indicatorsReq;

    // request the monthly sidebar for the current sidebar page (so month names match the selected year)
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
              // Prefer backend-provided GC value exactly as returned by the model.
              // Only compute a fallback when backend didn't provide any GC.
              if (g !== undefined && g !== null && String(g) !== "") {
                allYearsGC[nY] = String(g);
              } else {
                // Do not compute GC from EC; leave blank when not provided
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
              if (g !== undefined && g !== null && String(g) !== "") {
                allYearsGC[nY] = String(g);
              } else {
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
              if (g !== undefined && g !== null && String(g) !== "") {
                allYearsGC[nY] = String(g);
              } else {
                allYearsGC[nY] = "";
              }
            }
          });
          (ind.weekly || []).forEach((w) => {
            const y = w.year_ec || (w.date ? new Date(w.date).getFullYear() - 8 : null);
            if (y !== undefined && y !== null && y !== "") {
              const nY = Number(y);
              allYearsEC.add(nY);
              allYearsGC[nY] = allYearsGC[nY] || "";
            }
          });
          (ind.daily || []).forEach((d) => {
            const y = d.year_ec || (d.date ? new Date(d.date).getFullYear() - 8 : null);
            if (y !== undefined && y !== null && y !== "") {
              const nY = Number(y);
              allYearsEC.add(nY);
              allYearsGC[nY] = allYearsGC[nY] || "";
            }
          });
        });

        if (allYearsEC.size === 0) {
          // If indicators returned no historical years, prefer to use the server's
          const dps = resp.datapoints || resp.datapoints || [];
          if (Array.isArray(dps) && dps.length) {
            dps.forEach((dp) => {
              const y =
                dp && (dp.year_ec !== undefined ? Number(dp.year_ec) : null);
              if (y !== null && !isNaN(y)) {
                allYearsEC.add(y);
                allYearsGC[y] =
                  dp.year_gc !== undefined && dp.year_gc !== null
                    ? String(dp.year_gc)
                    : "";
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

        // --- Fill API data
        results.forEach((ind) => {
          if (!ind) return;
          const indTitle = getIndTitle(ind) || "";

          (ind.all_annual || []).forEach((a) => {
            const y = getYearEC(a);
            if (y === undefined || y === null) return;
            // Prefer backend-provided GC as-is when present; fallback compute only when missing
            const rawG = getYearGC(a);
            const gKey =
              rawG !== undefined && rawG !== null && String(rawG) !== ""
                ? String(rawG)
                : "";
            const key = `${Number(y)}|${gKey}`;
            if (rowMap[key]) rowMap[key].values[indTitle] = a.value;
          });

          (ind.quarterly || []).forEach((q) => {
            const y = getYearEC(q);
            const rawG = getYearGC(q);
            const gKey =
              rawG !== undefined && rawG !== null && String(rawG) !== ""
                ? String(rawG)
                : "";
            const qnum =
              q.quarter_number !== undefined
                ? q.quarter_number
                : q.number || q.quarter || null;
            if (y === undefined || y === null || qnum === null) return;
            const key = `${Number(y)}|${gKey}|Q${qnum}`;
            if (rowMap[key]) rowMap[key].values[indTitle] = q.value;
          });

          (ind.monthly || []).forEach((m) => {
            const y = getYearEC(m);
            const rawG = getYearGC(m);
            const gKey =
              rawG !== undefined && rawG !== null && String(rawG) !== ""
                ? String(rawG)
                : "";
            const mnum =
              m.month_number !== undefined ? m.month_number : m.number || null;
            if (y === undefined || y === null || mnum === null) return;
            const key = `${Number(y)}|${gKey}|${mnum}`;
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
              rowMap[key].values[indTitle] = m.value;
            }
          });

          // --- Fill Weekly data from KPIRecord ---
          // Sort weekly data ascending by date (oldest first) before processing
          const weeklySorted = (ind.weekly || []).sort((a, b) => {
            const dA = a.date ? new Date(a.date) : new Date(0);
            const dB = b.date ? new Date(b.date) : new Date(0);
            return dA - dB;
          });

          weeklySorted.forEach((w) => {
            const weekNum = w.week || w.week_number || 1;

            // Derive month name if not present
            let monthName = w.month_name;
            if (!monthName && w.date) {
              const d = new Date(w.date);
              const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              monthName = mNames[d.getMonth()];
            }
            // Derive Year GC
            const yearVal = w.year_gc || (w.date ? new Date(w.date).getFullYear() : w.year_ec);

            const labelSuffix = monthName ? ` (${monthName})` : "";
            const yearSuffix = yearVal ? ` - ${yearVal}` : "";

            const weekLabelBase =
              w.week_label ||
              (weekNum ? `Week ${weekNum}${labelSuffix}${yearSuffix}` : "");

            // Parse Year EC from ethio_date if available (format: YYYY-MM-W)
            let yearEC = w.year_ec;
            let monthEC = w.month_number;
            if (!yearEC && w.ethio_date) {
              const parts = w.ethio_date.split('-');
              if (parts.length >= 1) yearEC = parts[0];
              if (parts.length >= 2) monthEC = parts[1];
            }

            // Fallback for key: if no year or month, use date, but ideally year-month-week
            const key = (yearEC && monthEC) ? `${yearEC}-${monthEC}-W${weekNum}` : (w.date || `W${weekNum}`);

            if (!key) return;
            if (!rowMap[key]) {
              rowMap[key] = {
                year_ec: yearEC,
                year_gc: w.year_gc || yearVal,
                week: weekNum,
                week_label: weekLabelBase,
                date: w.date, // Store one representative date
                month_name: monthName,
                month_number: monthEC,
                values: {},
              };
            }
            // If the row already exists (from another indicator), ensure we don't overwrite the label if it's already set
            if (!rowMap[key].week_label) rowMap[key].week_label = weekLabelBase;

            rowMap[key].values[indTitle] =
              w.value === undefined || w.value === null ? "" : w.value;
          });

          // --- Fill Daily data from KPIRecord ---
          (ind.daily || []).forEach((d) => {
            const key = d.date;
            if (!key) return;
            const gregDate = d.greg_date_formatted || d.day_label || d.date || "";
            const ethioDate = d.ethio_date || "";
            if (!rowMap[key]) {
              rowMap[key] = {
                year_ec: d.year_ec,
                year_gc: d.year_gc || "",
                greg_date_formatted: gregDate,
                ethio_date: ethioDate,
                date: d.date,
                values: {},
              };
            }
            rowMap[key].values[indTitle] =
              d.value === undefined || d.value === null ? "" : d.value;
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
        if (currentMode === "daily") head += "<th>Gregorian Date</th><th>Ethiopian Date</th>";
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
            if (currentMode === "weekly") {
              const matchYear =
                sidebarFilter.year_ec === null ||
                sidebarFilter.year_ec === undefined ||
                Number(r.year_ec) === Number(sidebarFilter.year_ec);
              const matchWeek =
                sidebarFilter.week === null ||
                sidebarFilter.week === undefined ||
                Number(r.week) === Number(sidebarFilter.week);
              return matchYear && matchWeek;
            }
            if (currentMode === "daily") {
              const matchYear =
                sidebarFilter.year_ec === null ||
                sidebarFilter.year_ec === undefined ||
                Number(r.year_ec) === Number(sidebarFilter.year_ec);
              const matchDay =
                !sidebarFilter.day ||
                (r.date && String(r.date) === String(sidebarFilter.day));
              const matchDate =
                !sidebarFilter.date ||
                (r.date && String(r.date) === String(sidebarFilter.date));
              return matchYear && matchDay && matchDate;
            }
            return true;
          });
        } else if (sidebarItemsCurrent && sidebarItemsCurrent.length) {
          if (currentMode === "annual") {
            const allowedYears = new Set(
              sidebarItemsCurrent
                .map((it) => {
                  const val =
                    it.year_ec !== undefined
                      ? it.year_ec
                      : it.year_EC !== undefined
                        ? it.year_EC
                        : it.year || null;
                  return val !== null && val !== undefined && val !== ""
                    ? Number(val)
                    : null;
                })
                .filter((v) => v !== null && !Number.isNaN(v))
            );
            allRows = allRows.filter((r) =>
              allowedYears.has(Number(r.year_ec))
            );
          } else if (currentMode === "quarterly") {
            const allowedCombos = new Set();
            sidebarItemsCurrent.forEach((it) => {
              const yval =
                it.year_ec !== undefined
                  ? it.year_ec
                  : it.year_EC !== undefined
                    ? it.year_EC
                    : it.year || null;
              const qval =
                it.quarter_number !== undefined
                  ? it.quarter_number
                  : it.number || it.quarter || null;
              if (
                yval !== null &&
                yval !== undefined &&
                qval !== null &&
                qval !== undefined
              ) {
                allowedCombos.add(`${Number(yval)}|${Number(qval)}`);
              }
            });
            if (allowedCombos.size) {
              allRows = allRows.filter((r) =>
                allowedCombos.has(
                  `${Number(r.year_ec)}|${Number(r.quarter_number)}`
                )
              );
            }
          } else if (currentMode === "monthly") {
            const allowedCombos = new Set();
            sidebarItemsCurrent.forEach((it) => {
              const yval =
                it.year_ec !== undefined
                  ? it.year_ec
                  : it.year_EC !== undefined
                    ? it.year_EC
                    : it.year || null;
              const mval =
                it.month_number !== undefined
                  ? it.month_number
                  : it.number || null;
              if (
                yval !== null &&
                yval !== undefined &&
                mval !== null &&
                mval !== undefined
              ) {
                allowedCombos.add(`${Number(yval)}|${Number(mval)}`);
              }
            });
            if (allowedCombos.size) {
              allRows = allRows.filter((r) =>
                allowedCombos.has(
                  `${Number(r.year_ec)}|${Number(r.month_number)}`
                )
              );
            }
          } else if (currentMode === "weekly") {
            const allowedDates = new Set(
              sidebarItemsCurrent
                .map((it) => it.date || it.day)
                .filter((d) => !!d)
            );
            if (allowedDates.size) {
              allRows = allRows.filter((r) => allowedDates.has(r.date));
            }
          } else if (currentMode === "daily") {
            const allowedDates = new Set(
              sidebarItemsCurrent
                .map((it) => it.date || it.day)
                .filter((d) => !!d)
            );
            if (allowedDates.size) {
              allRows = allRows.filter((r) => allowedDates.has(r.date));
            }
          }
        } else {
          if (currentMode === "annual") {
            allRows.sort((a, b) => Number(b.year_ec) - Number(a.year_ec));
            allRows = allRows.slice(0, 10);
          } else if (currentMode === "quarterly") {
            const latestYear = Math.max(...yearsArray);
            allRows = allRows.filter(
              (r) => Number(r.year_ec) === Number(latestYear)
            );
            allRows.sort(
              (a, b) =>
                (Number(a.quarter_number) || 0) -
                (Number(b.quarter_number) || 0)
            );
          } else if (currentMode === "monthly") {
            const latestYear = Math.max(...yearsArray);
            allRows = allRows.filter(
              (r) => Number(r.year_ec) === Number(latestYear)
            );
            allRows.sort(
              (a, b) =>
                (Number(a.month_number) || 0) - (Number(b.month_number) || 0)
            );
          } else if (currentMode === "weekly") {
            allRows.sort(
              (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );
            allRows = allRows.slice(0, 5);
          } else if (currentMode === "daily") {
            allRows.sort(
              (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );
            allRows = allRows.slice(0, 10);
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
            }
          } else {
            // No sidebar filter: use sensible defaults (latest years/months/quarters)
            const latestYear =
              yearsArray && yearsArray.length
                ? Math.max(...yearsArray)
                : new Date().getFullYear() - 8;
            if (currentMode === "annual") {
              for (let y = latestYear; y > latestYear - 10; y--) {
                generated.push({
                  year_ec: y,
                  year_gc: computeGc(y),
                  values: {},
                });
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
                const lbl =
                  (monthNamesFromSidebar && monthNamesFromSidebar[m]) ||
                  monthLabels[m - 1] ||
                  "";
                generated.push({
                  year_ec: latestYear,
                  year_gc: computeGc(latestYear),
                  month_number: m,
                  month_label: `${lbl} (${m})`,
                  values: {},
                });
              }
            } else if (currentMode === "weekly") {
              const source =
                sidebarItemsCurrent && sidebarItemsCurrent.length
                  ? sidebarItemsCurrent
                  : Array.from({ length: 4 }, (_, idx) => ({
                    week: idx + 1,
                    date: null,
                    label: `Week ${idx + 1}`,
                  }));
              source.forEach((it) => {
                generated.push({
                  year_ec: it.year_ec || "",
                  year_gc: it.year_gc || "",
                  week: it.week || "",
                  week_label: it.label || `Week${it.week || ""}`,
                  date: it.date || "",
                  values: {},
                });
              });
            } else if (currentMode === "daily") {
              const source =
                sidebarItemsCurrent && sidebarItemsCurrent.length
                  ? sidebarItemsCurrent
                  : Array.from({ length: 10 }, () => ({}));
              source.forEach((it) => {
                generated.push({
                  year_ec: it.year_ec || "",
                  year_gc: it.year_gc || "",
                  greg_date_formatted: it.greg_date_formatted || "",
                  ethio_date: it.ethio_date || "",
                  date: it.date || "",
                  values: {},
                });
              });
            }
          }

          // Build editable rows from generated skeletons
          let rowsHtml = "";
          generated.forEach((r) => {
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

            if (currentMode === "weekly") {
              const weekLabel =
                r.week_label || (r.week ? `Week ${r.week}` : "Week");
              rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
                r.year_gc
              )}</td><td>${fmt(weekLabel)}</td>`;
            }

            if (currentMode === "daily") {
              // Display Gregorian and Ethiopian dates in separate columns
              const gregDate = r.greg_date_formatted || r.day_label || r.date || '';
              const ethioDate = r.ethio_date || '';
              rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
                r.year_gc
              )}</td><td>${fmt(gregDate)}</td><td>${fmt(ethioDate)}</td>`;
            }

            selections.indicators.forEach((ind) => {
              const dataAttrs =
                `data-ind="${ind.id}" data-title="${escapeHtml(
                  ind.title
                )}" data-year-ec="${r.year_ec}" data-year-gc="${r.year_gc
                }" data-mode="${currentMode}"` +
                (currentMode === "quarterly"
                  ? ` data-quarter="${r.quarter || ""}" data-quarter-number="${r.quarter_number || ""
                  }"`
                  : "") +
                (currentMode === "monthly"
                  ? ` data-month-number="${r.month_number || ""
                  }" data-month-label="${escapeHtml(r.month_label || "")}"`
                  : "") +
                (currentMode === "weekly"
                  ? ` data-week="${r.week || ""}" data-date="${r.date || ""}" data-month-number="${r.month_number || ""}"`
                  : "") +
                (currentMode === "daily"
                  ? ` data-date="${r.date || ""}"`
                  : "");

              const savedVal =
                getSavedValue(
                  ind.id,
                  r.year_ec,
                  r.year_gc,
                  r.quarter_number,
                  r.month_number,
                  currentMode,
                  r.week || r.date
                ) || "";

              rowsHtml += `<td contenteditable="true" class="editable-cell" ${dataAttrs}>${fmt(
                savedVal
              )}</td>`;
            });

            rowsHtml += `</tr>`;
          });

          insertRowsChunked('#explorer-body', rowsHtml, 200, function(){
            try { attachEditHandlers(); } catch(e){}
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
          if (currentMode === "weekly") {
            rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
              r.year_gc
            )}</td><td>${fmt(
              r.week_label || (r.week ? `Week ${r.week}` : "")
            )}</td>`;
          }
          if (currentMode === "daily") {
            rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(
              r.year_gc
            )}</td><td>${fmt(
              r.greg_date_formatted || r.date || ""
            )}</td><td>${fmt(r.ethio_date || "")}</td>`;
          }

          selections.indicators.forEach((ind) => {
            let value = r.values[ind.title];
            if (value === undefined || value === null || value === "") {
              const cached = getSavedValue(
                ind.id,
                r.year_ec,
                r.year_gc,
                r.quarter_number,
                r.month_number,
                currentMode,
                r.week || r.date
              );
              if (cached !== undefined) value = cached;
            }
            let dataAttrs = `data-ind="${ind.id}" data-title="${escapeHtml(
              ind.title
            )}" data-year-ec="${r.year_ec}" data-year-gc="${r.year_gc
              }" data-mode="${currentMode}"`;
            if (currentMode === "quarterly")
              dataAttrs += ` data-quarter="${r.quarter || ""
                }" data-quarter-number="${r.quarter_number || ""}"`;
            if (currentMode === "monthly")
              dataAttrs += ` data-month-number="${r.month_number || ""
                }" data-month-label="${escapeHtml(r.month_label || "")}"`;
            if (currentMode === "weekly")
              dataAttrs += ` data-week="${r.week || ""}" data-date="${r.date || ""}"`;
            if (currentMode === "daily")
              dataAttrs += ` data-date="${r.date || ""}"`;
            rowsHtml += `<td contenteditable="true" class="editable-cell" ${dataAttrs}>${fmt(
              value
            )}</td>`;
          });
          rowsHtml += "</tr>";
        });
        insertRowsChunked('#explorer-body', rowsHtml, 200, function(){
          try { attachEditHandlers(); } catch(e){}
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
          const retryIndicatorsReq = $.get("/api/indicators-bulk/");
          const retryMonthsReq =
            currentMode === "monthly"
              ? $.get("/user-management/sidebar/monthly/", {
                page: sidebarPage,
              })
              : $.Deferred().resolve(null);
          $.when(retryIndicatorsReq, retryMonthsReq)
            .done(function () {
              // successful retry — re-render table (will perform fresh fetches)
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
              try { applyBtn.prop('disabled', false); } catch(e) {}
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
        // year_gc is stored in DataPoint as a string like '2013/2014' — do not coerce to Number
        const year_gc =
          $td.data("year-gc") !== undefined && $td.data("year-gc") !== null
            ? String($td.data("year-gc"))
            : "";
        const mode = $td.data("mode");
        const rawVal = $td.text().trim();

        let key = `${ind_id}|${year_ec}|${year_gc}`;
        const payload = {
          indicator_id: ind_id,
          value: rawVal === "-" ? null : rawVal,
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

        if (mode === "weekly") {
          payload.week = Number($td.data("week")) || null;
          payload.date = $td.data("date") || null;
          key += `|${payload.date || ""}`;
        }

        if (mode === "daily") {
          payload.date = $td.data("date") || null;
          key += `|${payload.date || ""}`;
        }

        payload._title = title;
        EDIT_BUFFER[key] = payload;

        // Mark cell as edited
        $td.addClass("edited-cell");

        // Enable save button if disabled
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

  function saveEdits() {
    const updates = Object.values(EDIT_BUFFER);
    if (!updates.length) {
      alert("No changes to save.");
      return;
    }

    let url = "/api/indicators-bulk/";
    let payload = { mode: currentMode, updates };
    if (currentMode === "weekly") {
      url = "/api/kpi-records/weekly/";
      payload = { updates };
    } else if (currentMode === "daily") {
      url = "/api/kpi-records/daily/";
      payload = { updates };
    }

    $.ajax({
      url: url,
      type: "PATCH",
      contentType: "application/json",
      data: JSON.stringify(payload),
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      success: function (resp) {
        const saved = resp.saved || (resp.results ? resp.results.length : 0);
        const errors = resp.errors || [];

        if (errors.length) {
          console.error("Some updates failed:", errors);
          alert(
            `Saved ${saved} updates, but some failed:\n` +
            errors.map((e) => JSON.stringify(e)).join("\n")
          );
        } else {
          console.log(`Saved ${saved} updates successfully.`);
          if (resp.verification_status === 'pending') {
            alert(`Saved ${saved} updates. Data has been sent for approval.`);
          } else {
            alert(`Saved ${saved} updates successfully.`);
          }
        }

        rememberSavedValues(updates);

        // Clear buffer and reset cells
        $(".editable-cell.edited-cell").removeClass("edited-cell");
        for (const k in EDIT_BUFFER) delete EDIT_BUFFER[k];

        // Reload sidebar page (which re-renders the table) to reflect saved data
        loadSidebarItems();
      },
      error: function (xhr) {
        const txt = xhr.responseJSON
          ? JSON.stringify(xhr.responseJSON)
          : xhr.statusText;
        alert("Save failed: " + txt);
      },
    });
  }

  // --- Initial render
  updateCategoryList();
  updateIndicatorList();
  renderTable();

  // expose saveEdits
  window.__saveDataExplorerEdits = saveEdits;
})();