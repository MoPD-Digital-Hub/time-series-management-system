/* ================================
   SEARCH + FILTER
================================ */

$("#topic-select").on("change", function () {
    var topicId = $(this).val();
    var $cat = $("#category-select");
    var $indicatorInput = $("#indicator-search-input");

    $cat.empty().append('<option value="">All Categories</option>');
    $indicatorInput.val("").addClass("hidden");

    if (topicId) {
        $.get("/api/topic/" + topicId + "/", function (data) {
            var categories = Array.isArray(data?.categories) ? data.categories : [];

            if (categories.length > 0) {
                categories.forEach(function (cat) {
                    $cat.append('<option value="' + cat.id + '">' + cat.name_ENG + "</option>");
                });
                $cat.removeClass("hidden");
            } else {
                $cat.addClass("hidden");
            }
        });
    } else {
        $cat.addClass("hidden");
    }
});


$("#category-select").on("change", function () {
    var catId = $(this).val();
    var $indicatorInput = $("#indicator-search-input");

    if (catId) {
        $indicatorInput.removeClass("hidden");
    } else {
        $indicatorInput.val("").addClass("hidden");
    }
});


$("#filter-btn").on("click", function () {
    var topicId = $("#topic-select").val();
    var catId = $("#category-select").val();
    var search = $("#indicator-search-input").val().toLowerCase();

    $(".subcat-section").hide();
    if (!topicId || !catId) {
        $("#search-result-section").hide();
        return;
    }

    var color =
        $('.topic-card[data-topicid="' + topicId + '"]').data("color") ||
        "bg-primary-500";
    var cardColor = colorHexMap[color] || colorHexMap["bg-primary-500"];

    $.get("/api/topic/" + topicId + "/", function (data) {
        var categories = Array.isArray(data?.categories) ? data.categories : [];
        
        var allIndicators = [];
        categories.forEach(function (cat) {
            if (catId && cat.id != catId) return;

            var indicators = Array.isArray(cat?.indicators)
                ? cat.indicators.filter(function (ind) {
                      return !search || ind.title_ENG.toLowerCase().includes(search);
                  })
                : [];

            if (indicators.length > 0) {
                allIndicators.push(...indicators);
            }
        });

        renderSearchResultsWithPagination(allIndicators, cardColor, 1);

        /* ================================
           RENDER CHARTS
        ================================= */
        categories.forEach(function (cat) {
            if (catId && cat.id != catId) return;

            var indicators = Array.isArray(cat?.indicators) ? cat.indicators : [];

            indicators.forEach(function (ind) {
                if (search && !ind.title_ENG.toLowerCase().includes(search)) return;

                var ctx = document.getElementById("chart-search-" + ind.id);
                if (!ctx) return;

                var labels = Array.isArray(ind.data_points)
                    ? ind.data_points.map((dp) => dp.year_GC)
                    : [];

                var values = Array.isArray(ind.data_points)
                    ? ind.data_points.map((dp) => dp.value)
                    : [];

                new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: ind.title_ENG,
                                data: values,
                                borderColor: cardColor,
                                backgroundColor: hexToRgba(cardColor, "0.1"),
                                tension: 0.3,
                                fill: true,
                                pointRadius: 3,
                                pointBackgroundColor: cardColor,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            title: { display: false },
                        },
                        scales: {
                            x: { title: { display: true, text: "Year (GC)" } },
                            y: { title: { display: true, text: "Performance" } },
                        },
                    },
                });
            });
        });
    });
});

$("#clear-btn").on("click", function () {

    // Reset filters
    $("#topic-select").val("");
    $("#category-select").val("").addClass("hidden");
    $("#indicator-search-input").val("").addClass("hidden");

    // Fully clear results
    $("#search-result-section").empty().hide();

    // Optional: also clear/close any sub-category sections
    $(".subcat-section").hide().empty();

    // Optional: remove active chart canvases
    $("canvas[id^='chart-search-']").each(function () {
        let chartId = $(this).attr("id");
        if (window[chartId]) {
            try { window[chartId].destroy(); } catch (e) {}
        }
    });

});

/* ================================
   PAGINATION HELPER FUNCTIONS
================================ */

function renderSearchResultsWithPagination(allIndicators, cardColor, currentPage) {
    const itemsPerPage = 9; // 3x3 grid
    const totalPages = Math.ceil(allIndicators.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageIndicators = allIndicators.slice(startIndex, endIndex);

    var html = `<div class="card mb-4"><div class="card-body">
        <h5 class="chart-title font-bold mb-4">Results</h5>

        <div class="mb-8">
            <h6 class="font-semibold mb-3 text-gray-700">Charts (Page ${currentPage} of ${totalPages})</h6>
    `;

    if (pageIndicators.length > 0) {
        html += `<div class="grid grid-cols-3 gap-4 mb-4">`;

        pageIndicators.forEach(function (ind) {
            var chartId = "chart-search-" + ind.id;

            var lastDP = null;
            if (Array.isArray(ind.data_points) && ind.data_points.length > 0) {
                lastDP = ind.data_points.reduce((a, b) =>
                    a.year_GC > b.year_GC ? a : b
                );
            }

            html += `
                <div class="indicator-item">
                    <div class="card h-full">
                        <div class="card-body">
                            <div class="flex items-center justify-between mb-2">
                                <h5 class="mb-0 text-base font-bold leading-tight line-clamp-2">
                                    <a href="/indicator/${ind.id}/" target="_blank" class="text-primary-600 hover:underline">
                                        ${ind.title_ENG}
                                    </a>
                                </h5>
                            </div>
                            ${
                                lastDP
                                    ? `<span class="block text-xs text-gray-500 mb-1">${lastDP.year_GC} — ${lastDP.value}</span>`
                                    : ""
                            }
                            <div class="w-full h-40">
                                <canvas id="${chartId}"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        // Pagination controls
        if (totalPages > 1) {
            html += `
                <div class="flex items-center justify-center gap-2 mt-4">
                    <button onclick="searchPaginationPrev()" ${currentPage === 1 ? 'disabled' : ''} 
                        class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        Previous
                    </button>
                    <span class="px-4 py-2 text-gray-700">Page ${currentPage} of ${totalPages}</span>
                    <button onclick="searchPaginationNext()" ${currentPage === totalPages ? 'disabled' : ''} 
                        class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        Next
                    </button>
                </div>
            `;
        }
    } else {
        html += `<span class="text-xs text-gray-400">No indicators found.</span>`;
    }

    html += `</div>`;

    /* ================================
       DATA TABLE UI — FIXED & CLEANED
    ================================= */

    html += `
    <div class="mt-8">
        <div class="border rounded-xl overflow-hidden shadow-sm">
            <div class="overflow-auto max-h-[600px]">
                <table class="min-w-full border-collapse">
                    <thead class="bg-gray-100 sticky top-0 shadow-sm z-10">
                        <tr>
                            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b w-1/3">
                                Indicator
                            </th>
                            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b w-20">
                                Year
                            </th>
                            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b w-40">
                                Annual Performance
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
    `;

    if (allIndicators.length > 0) {
        allIndicators.forEach(function (ind) {
            if (!Array.isArray(ind.data_points) || !ind.data_points.length) return;

            var sortedData = ind.data_points.slice().sort((a, b) => a.year_GC - b.year_GC);

            sortedData.forEach(function (dp, idx) {
                html += `
                    <tr class="hover:bg-gray-50 transition">
                        ${
                            idx === 0
                                ? `
                                <td class="px-5 py-4 text-sm font-semibold text-gray-900 bg-gray-50 align-top"
                                    rowspan="${sortedData.length}">
                                    <a href="/indicator/${ind.id}/" target="_blank"
                                        class="text-primary-600 hover:underline block leading-snug">
                                        ${ind.title_ENG}
                                    </a>
                                </td>
                                `
                                : ""
                        }
                        <td class="px-5 py-3 text-sm text-gray-700 whitespace-nowrap">${dp.year_GC}</td>
                        <td class="px-5 py-3 text-sm font-semibold text-gray-800">${dp.value}</td>
                    </tr>
                `;
            });
        });
    } else {
        html += `<tr><td colspan="3" class="px-4 py-3 text-center text-sm text-gray-400">No data available.</td></tr>`;
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;

    html += `</div></div></div>`;

    $("#search-result-section").html(html).show();

    // Store pagination state
    window.searchPaginationState = {
        allIndicators: allIndicators,
        cardColor: cardColor,
        currentPage: currentPage,
        totalPages: totalPages
    };

    // Render charts for current page
    setTimeout(function() {
        pageIndicators.forEach(function (ind) {
            var ctx = document.getElementById("chart-search-" + ind.id);
            if (!ctx) return;

            var labels = Array.isArray(ind.data_points)
                ? ind.data_points.map((dp) => dp.year_GC)
                : [];

            var values = Array.isArray(ind.data_points)
                ? ind.data_points.map((dp) => dp.value)
                : [];

            new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: ind.title_ENG,
                            data: values,
                            borderColor: cardColor,
                            backgroundColor: hexToRgba(cardColor, "0.1"),
                            tension: 0.3,
                            fill: true,
                            pointRadius: 3,
                            pointBackgroundColor: cardColor,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: false },
                    },
                    scales: {
                        x: { title: { display: true, text: "Year (GC)" } },
                        y: { title: { display: true, text: "Performance" } },
                    },
                },
            });
        });
    }, 100);
}

function searchPaginationNext() {
    if (window.searchPaginationState) {
        const { allIndicators, cardColor, currentPage, totalPages } = window.searchPaginationState;
        if (currentPage < totalPages) {
            renderSearchResultsWithPagination(allIndicators, cardColor, currentPage + 1);
            $("html, body").animate({ scrollTop: $("#search-result-section").offset().top - 100 }, 300);
        }
    }
}

function searchPaginationPrev() {
    if (window.searchPaginationState) {
        const { allIndicators, cardColor, currentPage } = window.searchPaginationState;
        if (currentPage > 1) {
            renderSearchResultsWithPagination(allIndicators, cardColor, currentPage - 1);
            $("html, body").animate({ scrollTop: $("#search-result-section").offset().top - 100 }, 300);
        }
    }
}

function renderTopicChartsWithPagination(topicId, categories, cardColor, topicTitle, currentPage) {
    const itemsPerPage = 9; // 3x3 grid
    
    // Flatten all indicators with category info
    let allIndicatorsWithCategory = [];
    categories.forEach(function(cat) {
        var indicators = Array.isArray(cat?.indicators) ? cat.indicators : [];
        indicators.forEach(function(ind) {
            allIndicatorsWithCategory.push({
                ...ind,
                categoryName: cat.name_ENG
            });
        });
    });
    
    const totalPages = Math.ceil(allIndicatorsWithCategory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageIndicators = allIndicatorsWithCategory.slice(startIndex, endIndex);

    var html = `<div class="card mb-4">
        <div class="card-body">
            <h5 class="chart-title font-bold mb-3" style="color:${cardColor};">
                List of ${topicTitle} (annual)
            </h5>
            <h6 class="font-semibold mb-3 text-gray-700">Page ${currentPage} of ${totalPages}</h6>
    `;

    if (pageIndicators.length > 0) {
        html += `<div class="grid grid-cols-3 gap-4 mb-4">`;

        pageIndicators.forEach(function (ind) {
            var chartId = "chart-" + ind.id;

            var lastDP = null;
            if (ind.data_points?.length > 0) {
                lastDP = ind.data_points.reduce((a, b) =>
                    a.year_GC > b.year_GC ? a : b
                );
            }

            html += `
                <div class="indicator-item">
                    <div class="card h-full">
                        <div class="card-body">
                            <div class="mb-1">
                                <span class="text-xs font-semibold text-gray-500">${ind.categoryName}</span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <h5 class="mb-0 text-base font-bold leading-tight line-clamp-2" style="color:${cardColor}">
                                    <a href="/indicator/${ind.id}/" target="_blank"
                                        class="text-primary-600 hover:underline">
                                        ${ind.title_ENG}
                                    </a>
                                </h5>
                            </div>

                            ${
                                lastDP
                                    ? `<span class="block text-xs mb-1" style="color:${cardColor};">
                                        ${lastDP.year_GC} — ${lastDP.value}
                                    </span>`
                                    : ""
                            }

                            <div class="w-full h-40">
                                <canvas id="${chartId}"></canvas>
                            </div>

                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        // Pagination controls
        if (totalPages > 1) {
            html += `
                <div class="flex items-center justify-center gap-2 mt-4">
                    <button onclick="topicPaginationPrev()" ${currentPage === 1 ? 'disabled' : ''} 
                        class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        Previous
                    </button>
                    <span class="px-4 py-2 text-gray-700">Page ${currentPage} of ${totalPages}</span>
                    <button onclick="topicPaginationNext()" ${currentPage === totalPages ? 'disabled' : ''} 
                        class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        Next
                    </button>
                </div>
            `;
        }
    } else {
        html += `<span class="text-xs text-gray-400">No indicators</span>`;
    }

    html += `</div></div>`;

    var section = $("#subcat-section-" + topicId);
    section.html(html).show();

    // Store pagination state
    window.topicPaginationState = {
        topicId: topicId,
        categories: categories,
        cardColor: cardColor,
        topicTitle: topicTitle,
        currentPage: currentPage,
        totalPages: totalPages
    };

    // Render charts for current page
    setTimeout(function() {
        pageIndicators.forEach(function (ind) {
            var ctx = document.getElementById("chart-" + ind.id);
            if (!ctx) return;

            var labels = ind.data_points?.map((dp) => dp.year_GC) || [];
            var values = ind.data_points?.map((dp) => dp.value) || [];

            new Chart(ctx, {
                type: "line",
                data: {
                    labels,
                    datasets: [
                        {
                            label: ind.title_ENG,
                            data: values,
                            borderColor: cardColor,
                            backgroundColor: hexToRgba(cardColor, "0.1"),
                            tension: 0.3,
                            fill: true,
                            pointRadius: 3,
                            pointBackgroundColor: cardColor,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: false },
                    },
                    scales: {
                        x: { title: { display: true, text: "Year (GC)" } },
                        y: { title: { display: true, text: "Performance" } },
                    },
                },
            });
        });
    }, 100);
}

function topicPaginationNext() {
    if (window.topicPaginationState) {
        const { topicId, categories, cardColor, topicTitle, currentPage, totalPages } = window.topicPaginationState;
        if (currentPage < totalPages) {
            renderTopicChartsWithPagination(topicId, categories, cardColor, topicTitle, currentPage + 1);
            $("html, body").animate({ scrollTop: $("#subcat-section-" + topicId).offset().top - 100 }, 300);
        }
    }
}

function topicPaginationPrev() {
    if (window.topicPaginationState) {
        const { topicId, categories, cardColor, topicTitle, currentPage } = window.topicPaginationState;
        if (currentPage > 1) {
            renderTopicChartsWithPagination(topicId, categories, cardColor, topicTitle, currentPage - 1);
            $("html, body").animate({ scrollTop: $("#subcat-section-" + topicId).offset().top - 100 }, 300);
        }
    }
}

/* ================================
   COLOR PALETTE
================================ */

var colorHexMap = {
    "bg-primary-500": "#2563eb",
    "bg-success-500": "#22c55e",
    "bg-warning-500": "#f59e42",
    "bg-danger-500": "#ef4444",
    "bg-info-500": "#0ea5e9",
    "bg-secondary-500": "#64748b",
    "bg-blue-500": "#3b82f6",
    "bg-green-500": "#10b981",
    "bg-yellow-500": "#eab308",
    "bg-red-500": "#ef4444",
    "bg-cyan-500": "#06b6d4",
    "bg-purple-500": "#a21caf",
};

function hexToRgba(hex, alpha) {
    hex = hex.replace("#", "");
    return `rgba(${parseInt(hex.substring(0, 2), 16)},${parseInt(
        hex.substring(2, 4),
        16
    )},${parseInt(hex.substring(4, 6), 16)},${alpha})`;
}


/* ================================
   TOPIC CARDS CLICK LOGIC
================================ */

$(function () {
    var colors = [
        "bg-primary-500", "bg-success-500", "bg-warning-500",
        "bg-danger-500", "bg-info-500", "bg-secondary-500",
        "bg-blue-500", "bg-green-500", "bg-yellow-500",
        "bg-red-500", "bg-cyan-500", "bg-purple-500"
    ];

    var topicColorMap = {};

    $(".topic-card").each(function (i) {
        var color = colors[i % colors.length];
        $(this).data("color", color);

        var topicId = $(this).data("topicid");
        topicColorMap[topicId] = color;

        var bgImage = $(this).data("bg");
        var bgIcon = $(this).data("bgicon");

        var layers = [];
        var bgSize = [], bgRepeat = [], bgPosition = [];

        if (bgIcon) {
            layers.push(`url("${bgIcon}")`);
            bgSize.push("80px 80px");
            bgRepeat.push("no-repeat");
            bgPosition.push("right 12px bottom 12px");
        }

        if (bgImage) {
            layers.push(`url("${bgImage}")`);
            bgSize.push("cover");
            bgRepeat.push("no-repeat");
            bgPosition.push("center");
        }

        if (layers.length > 0) {
            $(this).css({
                backgroundImage: layers.join(", "),
                backgroundSize: bgSize.join(", "),
                backgroundRepeat: bgRepeat.join(", "),
                backgroundPosition: bgPosition.join(", "),
                color: "#fff",
            });
        }
    });

    $(".topic-card").on("click", function () {
        var topicId = $(this).data("topicid");
        var colorClass = topicColorMap[topicId] || "bg-primary-500";
        var cardColor = colorHexMap[colorClass];

        $(".subcat-section").html('')

        $.get("/api/topic/" + topicId + "/", function (data) {
            var categories = Array.isArray(data?.categories) ? data.categories : [];

            // Use pagination function
            renderTopicChartsWithPagination(topicId, categories, cardColor, data.title_ENG, 1);

            // Scroll to section
            setTimeout(function() {
                $("html, body").animate(
                    { scrollTop: $("#subcat-section-" + topicId).offset().top - 100 },
                    700
                );
            }, 100);
        });

        $("#subcat-section-" + topicId).show();
    });
});


/* ================================
   TRENDING INDICATORS
================================ */

$(document).ready(function () {
    $.get("/api/dashboard-counts/", function (data) {
        $("#total-topic-count").text(data.topics);
        $("#total-category-count").text(data.categories);
        $("#total-indicator-count").text(data.indicators);
    });

    function renderTrending(list) {
        var $ul = $("#trending-list");
        $ul.empty();

        if (!list.length) {
            $ul.append(
                '<li class="text-gray-400 text-sm py-2 text-center">No trending indicators.</li>'
            );
            return;
        }

        list.forEach(function (item) {
            var icon =
                item.direction === "up"
                    ? '<i class="fas fa-arrow-up text-green-500"></i>'
                    : '<i class="fas fa-arrow-down text-red-500"></i>';

            $ul.append(`
                <li class="flex items-center justify-between py-2">
                    <span class="flex items-center gap-2">
                        ${icon}
                        <span class="font-semibold">${item.indicator_title}</span>
                    </span>
                    <span class="font-mono">${item.performance}</span>
                    ${
                        item.note
                            ? `<span class="text-xs text-gray-400 ml-2">${item.note}</span>`
                            : ""
                    }
                </li>
            `);
        });
    }

    $.get("/api/trending-indicators/", function (data) {
        renderTrending(data);
    });
});
