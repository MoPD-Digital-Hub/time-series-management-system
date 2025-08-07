const size = {
  "50%": "col-md-6",
  "33%": "col-md-4",
  "25%": "col-md-3",
  "100%": "col-md-12",
};

const bar_horizontal_stacked = (id, component) => {
  const newComponent = component;
  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });

  const data = newComponent.indicator.map((indicator) => {
    let annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));
    return {
      name: indicator.title_ENG,
      data: annual,
    };
  });

  const years = Array.from(
    new Set(newComponent?.annual_value?.map((item) => item.for_datapoint))
  );
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "bar", stacked: !0, stackType: "100%" },
    title: { text: newComponent.title, align: 'left' },

    plotOptions: { bar: { horizontal: !0 } },
    stroke: { width: 1, colors: ["#fff"] },
    series: data,
    xaxis: { categories: years },
    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    fill: { opacity: 1 },
    legend: { show: false },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const bar_horizontal = (id, component) => {
  const newComponent = component;
  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });
  const years = Array.from(
    new Set(newComponent?.annual_value?.map((item) => item.for_datapoint))
  );
  const data = newComponent.indicator.map((indicator) => {
    let annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));
    return {
      name: indicator.title_ENG,
      data: annual,
    };
  });
  var options = {
    series: data,
    chart: {
      type: "bar",
      height: 400,
      spacingBottom: 60, // Adds extra space below the chart for the subtitle
    },
    title: { 
      text: newComponent.title, 
      align: 'left' 
    },
    subtitle: { 
      text: newComponent.description, 
      align: 'bottom', 
      y: 30 // Adjusts vertical position to move the subtitle below the chart
    },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: -6,
      style: {
        fontSize: "12px",
        colors: ["#fff"],
      },
    },
    stroke: {
      show: true,
      width: 1,
      colors: ["#fff"],
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
    xaxis: {
      categories: years,
    },
  };
  

  var chart = new ApexCharts(document.querySelector(`#${id}`), options);
  chart.render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )

 
};

const bar = (id, component) => {
  const newComponent = component;

  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });

  const years = Array.from(
    new Set(newComponent?.annual_value?.map((item) => item.for_datapoint))
  );
  const data = newComponent.indicator.map((indicator) => {
    let annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));
    return {
      name: indicator.title_ENG,
      data: annual,
    };
  });

  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "bar" },
    plotOptions: {
      bar: { horizontal: !1, columnWidth: "55%", endingShape: "rounded" },
    },
    dataLabels: { enabled: !1 },
    colors: ["#2CA87F", "#4680FF", "#13c2c2"],
    stroke: { show: !0, width: 2, colors: ["transparent"] },
    series: data,
    title: { text: newComponent.title, align: 'left' },

    xaxis: {
      categories: years,
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: function (e) {
          return "$ " + e + " thousands";
        },
      },
    },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const different_line_area = (id, component) => {
  const newComponent = component;

  // Sort annual_value array
  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });

  // Prepare series data with first indicator as line and second as area
  const seriesData = newComponent.indicator.map((indicator, index) => {
    const annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));

    return {
      name: indicator.title_ENG,
      type: index === 0 ? "line" : "area", // Line for the first, area for the second
      data: annual,
    };
  });

  // Extract unique years for x-axis categories
  const years = Array.from(
    new Set(newComponent.annual_value.map((item) => item.for_datapoint))
  );

  // Configure and render the chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "line" },
    title: { text: newComponent.title, align: 'left' },

    stroke: { width: [2, 2], curve: "smooth" }, // Width for both line and area
    series: seriesData,
    xaxis: { categories: years },
    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    fill: {
      opacity: [1, 0.4], // Full opacity for line, semi-transparent for area
    },
    legend: { show: false },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const mixed_area_line_bar = (id, component) => {
  const newComponent = component;

  // Sort annual_value array
  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });

  // Prepare series data with first indicator as line, second as bar, and third as area
  const seriesData = newComponent.indicator.map((indicator, index) => {
    const annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));

    return {
      name: indicator.title_ENG,
      type: index === 0 ? "line" : index === 1 ? "bar" : "area", // Line for 1st, Bar for 2nd, Area for 3rd
      data: annual,
    };
  });

  // Extract unique years for x-axis categories
  const years = Array.from(
    new Set(newComponent.annual_value.map((item) => item.for_datapoint))
  );

  // Configure and render the chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "line" },
   title: { text: newComponent.title, align: 'left' },

    stroke: { width: [2, 0, 2], curve: "smooth" }, // Line and area have width 2, bar has 0
    plotOptions: { bar: { columnWidth: "50%" } },
    series: seriesData,
    xaxis: { categories: years },
    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    fill: {
      opacity: [0.85, 1, 0.4], // Different opacities for area effect
    },
    legend: { show: false },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const mixed_line_bar = (id, component) => {
  const newComponent = component;

  // Sort annual_value array
  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });

  // Prepare series data with first indicator as line and second as bar
  const seriesData = newComponent.indicator.map((indicator, index) => {
    const annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));

    return {
      name: indicator.title_ENG,
      type: index === 0 ? "line" : "bar", // First indicator as line, second as bar
      data: annual,
    };
  });

  // Extract unique years for x-axis categories
  const years = Array.from(
    new Set(newComponent.annual_value.map((item) => item.for_datapoint))
  );

  // Configure and render the chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "line" },
   title: { text: newComponent.title, align: 'left' },

    stroke: { width: [2, 0], curve: "smooth" }, // Width 2 for line, 0 for bar
    plotOptions: { bar: { columnWidth: "50%" } },
    series: seriesData,
    xaxis: { categories: years },
    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    fill: { opacity: 0.85 },
    legend: { show: false },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const bar_stacked = (id, component) => {
  const newComponent = component;

  // Sort annual_value array as in previous functions
  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });

  // Prepare data for the series
  const data = newComponent.indicator.map((indicator) => {
    const annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));

    return {
      name: indicator.title_ENG,
      data: annual,
    };
  });

  // Extract unique years for x-axis categories
  const years = Array.from(
    new Set(newComponent.annual_value.map((item) => item.for_datapoint))
  );

  // Configure and render the chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "bar", stacked: true },
   title: { text: newComponent.title, align: 'left' },

    plotOptions: { bar: { horizontal: false } }, // Vertical stacked bars
    stroke: { width: 1, colors: ["#fff"] },
    series: data,
    xaxis: { categories: years },
    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    fill: { opacity: 1 },
    legend: { show: false },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const basic_line = (id, component) => {
  const newComponent = component;

  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });

  const years = Array.from(
    new Set(
      newComponent?.annual_value?.map((item) => String(item.for_datapoint))
    )
  );
  const data = newComponent.indicator.map((indicator) => {
    let annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));
    return {
      name: indicator.title_ENG,
      data: annual,
    };
  });

  var options = {
    series: [
      {
        name: data[0].name,
        data: data[0].data,
      },
    ],
    chart: {
      height: 400,
      type: "line",
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "straight",
    },
    title: { text: newComponent.title, align: 'left' },

    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: years,
    },
  };

  var chart = new ApexCharts(document.querySelector(`#${id}`), options);
  chart.render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const pie_donut = (id, component) => {
  const newComponent = component;

  // Prepare series data for the donut chart by summing performance for each indicator
  const seriesData = newComponent.indicator.map((indicator) => {
    const totalPerformance = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .reduce((sum, item) => sum + item.performance, 0); // Sum performance for each indicator

    return totalPerformance;
  });

  // Prepare labels for the donut chart using indicator titles
  const labels = newComponent.indicator.map((indicator) => indicator.title_ENG);

  // Configure and render the donut chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "donut" },
    series: seriesData,
    labels: labels,
   title: { text: newComponent.title, align: 'left' },

    plotOptions: {
      pie: {
        donut: {
          size: "50%", // Adjust the size of the donut hole
          labels: {
            show: true,
            name: { show: true, fontSize: "16px" },
            value: {
              show: true,
              fontSize: "14px",
              formatter: function (val) {
                return val + "K";
              },
            },
            total: {
              show: true,
              label: "Total",
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + "K";
              },
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    legend: {
      show: false,
    },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const radial_bar_custom_angle = (id, component) => {
  const newComponent = component;

  // Prepare series data for radial bar chart by summing performance for each indicator
  const seriesData = newComponent.indicator.map((indicator) => {
    const totalPerformance = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .reduce((sum, item) => sum + item.performance, 0); // Sum performance for each indicator

    return totalPerformance;
  });

  // Prepare labels for radial bars using indicator titles
  const labels = newComponent.indicator.map((indicator) => indicator.title_ENG);

  // Configure and render the custom-angle radial bar chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: {
      height: 400,
      type: "radialBar",
    },
    series: seriesData,
    labels: labels,
   title: { text: newComponent.title, align: 'left' },

    plotOptions: {
      radialBar: {
        startAngle: -90, // Customize the start angle for a half or quarter-circle
        endAngle: 90, // Customize the end angle
        dataLabels: {
          name: { fontSize: "16px" },
          value: {
            fontSize: "14px",
            formatter: function (val) {
              return val + "K";
            },
          },
          total: {
            show: true,
            label: "Total",
            formatter: function (w) {
              return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + "K";
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    legend: {
      show: false,
    },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const radial_bar = (id, component) => {
  const newComponent = component;

  // Prepare series data for radial bar chart by mapping annual values to performance
  const seriesData = newComponent.indicator.map((indicator) => {
    const totalPerformance = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .reduce((sum, item) => sum + item.performance, 0); // Sum performance for each indicator

    return totalPerformance;
  });

  // Prepare labels for radial bars using indicator titles
  const labels = newComponent.indicator.map((indicator) => indicator.title_ENG);

  // Configure and render the radial bar chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "radialBar" },
    series: seriesData,
    labels: labels,
   title: { text: newComponent.title, align: 'left' },
   
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: { fontSize: "16px" },
          value: {
            fontSize: "14px",
            formatter: function (val) {
              return val + "K";
            },
          },
          total: {
            show: true,
            label: "Total",
            formatter: function (w) {
              return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + "K";
            },
          },
        },
      },
    },
    legend: {
      show: false,
    },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const pie = (id, component) => {
  const newComponent = component;

  // Prepare series data for pie chart by mapping annual values to performance
  const seriesData = newComponent.indicator.map((indicator) => {
    const totalPerformance = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .reduce((sum, item) => sum + item.performance, 0); // Sum performance for each indicator

    return totalPerformance;
  });

  // Prepare labels for pie chart using indicator titles
  const labels = newComponent.indicator.map((indicator) => indicator.title_ENG);

  // Configure and render the pie chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "pie" },
    series: seriesData,
    labels: labels,
   title: { text: newComponent.title, align: 'left' },

    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    legend: {
      show: false,
    },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const different_line = (id, component) => {
  const newComponent = component;

  // Sort annual_value array as in `bar_horizontal_stacked`
  newComponent.annual_value.sort((a, b) => {
    if (a.for_datapoint < b.for_datapoint) return -1;
    return 1;
  });

  // Prepare data for series
  const data = newComponent.indicator.map((indicator) => {
    const annual = newComponent.annual_value
      .filter((item) => item.indicator === indicator.id)
      .map((item) => item.performance.toFixed(2));

    return {
      name: indicator.title_ENG,
      data: annual,
    };
  });

  // Extract unique years for x-axis categories
  const years = Array.from(
    new Set(newComponent.annual_value.map((item) => item.for_datapoint))
  );

  // Configure and render the chart
  new ApexCharts(document.querySelector(`#${id}`), {
    chart: { height: 400, type: "line", zoom: { enabled: false } },
   title: { text: newComponent.title, align: 'left' },

    stroke: { curve: "smooth" },
    series: data,
    xaxis: { categories: years },
    tooltip: {
      y: {
        formatter: function (e) {
          return e + "K";
        },
      },
    },
    fill: { opacity: 0.5 },
    legend: { show: false },
  }).render();

   $(`#${id}`).append(
    `<div class="mt-3 ms-3">${newComponent.description}</div>`
  )
};

const banner = (id, component) => {
  $(`#${id}`).html(`
        <div class="card welcome-banner bg-blue-900">
            <div class="card-body">
                <div class="row">
                    <div class="col-sm-6">
                        <div class="p-4">
                            <h2 class="text-white">${component?.title}</h2>
                            <p class="text-white">${component?.description}</p>
                        </div>
                    </div>
                     <div class="col-sm-6 text-center">
                    <div class="img-welcome-banner"><img
                            src="${component?.icon}" alt="img"
                            class="img-fluid"></div>
                </div>
                </div>
            </div>
        </div>`
      );
};

//Not done
const progress_card = (id , component) => {
  

  $(`#${id}`).html(`
      <div class="card-body">
        <h5 class="card-title">${component.title}</h5>
        <p class="card-text">${component.description}</p>

        <!-- Progress Bar with Dynamic Value -->
        <div class="progress" style="height: 22px;">
          <div 
            class="progress-bar bg-success" 
            role="progressbar" 
            style="width: ${component.custom_value}%;"
            aria-valuenow="${component.custom_value}" 
            aria-valuemin="0" 
            aria-valuemax="100">
          </div>
        </div>
        <div class="text-end mt-2">${component.custom_value}%</div>
      </div>
    `
  );
};

const rate_card = () => {
  // Function logic for rate_card
};

const simple_card = (id, component) => {
  $(`#${id}`).html(`
    <div>
        <div class="card-body">
            <div class="row align-items-center">
                <div class="col-8">
                    <h3 class="mb-1">${component.annual_value[0].performance}</h3>
                    <p class="text-muted mb-0">${component.title}</p>
                </div>
                <div class="col-4 text-end">
                   <img src="${component.icon}" class="img-fluid" alt="--"/>
                </div>
            </div>
        </div>
    </div>
    `);
};


const simple_card_custom_data = (id, component) => {
  $(`#${id}`).html(`
    <div>
        <div class="card-body">
            <div class="row align-items-center">
                <div class="col-8">
                    <h3 class="mb-1">${component.custom_value}</h3>
                    <p class="text-muted mb-0">${component.title}</p>
                </div>
                <div class="col-4 text-end">
                   <img src="${component.icon}" class="img-fluid" alt="--"/>
                </div>
            </div>
        </div>
    </div>
    `);
};


const image = (id, component) => {
  $(`#${id}`).html(`
    <div>
        <div class="card-body">
            <div class="row align-items-center">
                <img src="${component.image}" class="img-fluid" alt="--"/>
            </div>
        </div>
    </div>
    `);
};

const top_list = () => {
  // Function logic for top_list
};

const list_with_category = (id, component) => {
  const years = [
    ...new Set(component.annual_value.map((data) => data.for_datapoint)),
  ];
  const indicatorTitles = component.indicator.reduce((acc, indicator) => {
    acc[indicator.id] = indicator.title_ENG;
    return acc;
  }, {});
  let rows = component.indicator
    .map((indicator) => {
      let row = `<tr><td>${indicator.title_ENG}</td>`;
      years.forEach((year) => {
        const dataPoint = component.annual_value.find(
          (data) =>
            data.indicator === indicator.id && data.for_datapoint === year
        );
        row += `<td>${dataPoint ? dataPoint.performance : "-"}</td>`;
      });
      row += "</tr>";
      return row;
    })
    .join("");
  let table = `
        <div class="container mt-5">
            <h2>${component.title}</h2>
            <div class="table-responsive">
            <table class="table table-bordered table-hover table-responsive">
                <thead>
                    <tr>
                        <th>Indicator</th>
                        ${years.map((year) => `<th>${year}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            </div>
        </div>
    `;
  $(`#${id}`).html(table);
};

const country = (id, component) => {
  (async () => {
    const topology = await fetch(
      "https://code.highcharts.com/mapdata/countries/et/et-all.topo.json"
    ).then((response) => response.json());

    // Prepare demo data. The data is joined to map using value of 'hc-key'
    // property by default. See API docs for 'joinBy' for more info on linking
    // data and map.
    const data = [
      ["et-be", component?.benshangul_gumuz || 0],
      ["et-2837", 11],
      ["et-ha", component?.harari || 0],
      ["et-sn", component?.snnp || 0],
      ["et-ga", component?.gambella || 0],
      ["et-aa", component?.addis_ababa || 0],
      ["et-so", component?.somali || 0],
      ["et-dd", component?.dire_dawa || 0],
      ["et-ti", component?.tigray || 0],
      ["et-af", component?.afar || 0],
      ["et-am", component?.amhara || 0],
    ];

    // Create the chart
    Highcharts.mapChart(`${id}`, {
      chart: {
        map: topology,
      },
      title: {
        text: component?.title,
      },
      subtitle: {
        text: component?.description,  // Add the description here
        align: 'bottom',
         verticalAlign: 'bottom'
      },
      credits: {
        enabled: false,
      },
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: "bottom",
        },
      },
      colorAxis: {
        min: Math.min(...data.map((d) => d[1])), // Dynamic min based on data
        max: Math.max(...data.map((d) => d[1])), // Dynamic max based on data
        stops: [
          [0, "#B7D8B1"], // Starting color for minimum value
          [1, "#162F12"], // Color for maximum value
        ],
        nullColor: "#B7D8B1", // Fallback color for areas with no data
      },
      series: [
        {
          data: data,
          name: component?.title,
          dataLabels: {
            enabled: true,
            format: "{point.name}",
          },
        },
      ],
    });
  })();
};

const fetchData = async () => {
  let urlPath = window.location.pathname;
  let pathID = urlPath
    .replace("/dashboard/dashboard_detail/", "")
    .replace("/", "");
  let url = `/dashboard/components/${pathID}`;
  try {
    const res = await axios.get(url);

    res.data.rows.forEach((row) => {
      let col = row.cols
        .map((component) => {
          return `
          <div class="${size[component.width]} p-2 ">
            <div id="graph-${component.id}" class="card p-2" >
            </div>
          </div>
            `;
        })
        .join("");

      $("#pc-content").append(`
                  <div class="row ${row.style}">
                      ${col}
                  </div>`);

      row.cols.forEach((component) => {
        let id = `graph-${component.id}`;
        new Function("arg1", "arg2", component.component + "(arg1 , arg2)")(
          id,
          component
        );
      });
    });
  } catch (error) {
    console.log(error);
  }
};

fetchData();
