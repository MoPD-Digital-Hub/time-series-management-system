let urlPath = window.location.pathname;
let pathID = urlPath.replace("/user-admin/indicator_detail_view/", "").replace("/", "");

document.addEventListener('DOMContentLoaded', async () => {
  // Get the path ID from the URL
 
  // Function to fetch data based on path ID
  async function fetchData(pathID) {
    try {
      const response = await axios.get(`/indicator_graph/${pathID}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // Fetch and handle data
  const data = await fetchData(pathID);
  if (!data || !data.quarter_data_value) {
    console.error("Data not found or empty.");
    return;
  }

  const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF3357', '#57FF33', '#5733FF'];
  function getRandomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Function to prepare data structure for the chart
  function makeData() {
    let yearData = data.quarter_data_value.reduce((acc, curr) => {
      let year = curr.for_datapoint__year_EC;
      if (!acc[year]) acc[year] = [];
      acc[year].push(curr);
      return acc;
    }, {});

    return Object.keys(yearData).map(year => ({
      x: year,
      y: yearData[year].reduce((sum, item) => sum + item.performance, 0),
      color: getRandomColor(colors),
      quarters: yearData[year].map(item => ({ x: `Q${item.for_quarter__number}`, y: item.performance }))
    }));
  }

  // ApexCharts global options
  Apex = {
    chart: { toolbar: { show: false } },
    tooltip: { shared: false }
  };

  // Year chart options
  const optionsYear = {
    chart: {
      id: 'barYear',
      height: 400,
      width: '100%',
      type: 'bar'
    },
    plotOptions: {
      bar: {
        distributed: true,
        horizontal: true,
        endingShape: 'arrow',
        barHeight: '75%',
        dataLabels: { position: 'bottom' }
      }
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: { colors: ['#fff'] },
      formatter: function(val, opt) {
        return opt.w.globals.labels[opt.dataPointIndex];
      },
      offsetX: 0,
      dropShadow: { enabled: true }
    },
    colors: colors,
    series: [{ data: makeData() }],
    states: {
      normal: { filter: { type: 'desaturate' } },
      active: {
        allowMultipleDataPointsSelection: true,
        filter: { type: 'darken', value: 1 }
      }
    },
    tooltip: {
      x: { show: false },
      y: { title: { formatter: function(val, opts) { return opts.w.globals.labels[opts.dataPointIndex]; } } }
    },
    title: {
      text: 'Recent 10 years quarterly performance result',
      offsetX: 15
    },
    subtitle: {
      text: '(Click on year bar to see quarter details)',
      offsetX: 15
    },
    yaxis: { labels: { show: false } }
  };

  // Initialize and render the year chart
  try {
    const yearChart = new ApexCharts(document.querySelector("#chart-year"), optionsYear);
    await yearChart.render();

    // Quarter chart options
    const optionsQuarters = {
      chart: {
        id: 'barQuarter',
        height: 400,
        width: '100%',
        type: 'bar',
        stacked: true
      },
      plotOptions: {
        bar: { columnWidth: '50%', horizontal: false }
      },
      series: [{ data: [] }],
      legend: { show: false },
      grid: {
        yaxis: { lines: { show: false } },
        xaxis: { lines: { show: true } }
      },
      yaxis: { labels: { show: false } },
      title: {
        text: `Quarterly performance results`,
        offsetX: 10
      },
      tooltip: {
        x: { formatter: function(val, opts) { return opts.w.globals.seriesNames[opts.seriesIndex]; } },
        y: { title: { formatter: function(val, opts) { return opts.w.globals.labels[opts.dataPointIndex]; } } }
      }
    };

    const chartQuarters = new ApexCharts(document.querySelector("#chart-quarter"), optionsQuarters);
    await chartQuarters.render();

    // Update quarter chart based on year chart selection
    function updateQuarterChart(sourceChart, destChartIDToUpdate) {
      const series = [];
      const seriesIndex = 0;
      const colors = [];
      if (sourceChart.w.globals.selectedDataPoints[0]) {
        const selectedPoints = sourceChart.w.globals.selectedDataPoints;
        for (let i = 0; i < selectedPoints[seriesIndex].length; i++) {
          const selectedIndex = selectedPoints[seriesIndex][i];
          const yearSeries = sourceChart.w.config.series[seriesIndex];
          series.push({
            name: yearSeries.data[selectedIndex].x,
            data: yearSeries.data[selectedIndex].quarters
          });
          colors.push(yearSeries.data[selectedIndex].color);
        }
      }
      if (series.length === 0) series.push({ data: [] });
      ApexCharts.exec(destChartIDToUpdate, 'updateOptions', { series, colors, fill: { colors } });
    }

    // Add data point selection event for year chart
    yearChart.addEventListener('dataPointSelection', (e, chart, opts) => {
      const quarterChartEl = document.querySelector("#chart-quarter");
      const yearChartEl = document.querySelector("#chart-year");
      if (opts.selectedDataPoints[0].length === 1) {
        if (quarterChartEl.classList.contains("active")) {
          updateQuarterChart(chart, 'barQuarter');
        } else {
          yearChartEl.classList.add("chart-quarter-activated");
          quarterChartEl.classList.add("active");
          updateQuarterChart(chart, 'barQuarter');
        }
      } else {
        updateQuarterChart(chart, 'barQuarter');
      }
      if (opts.selectedDataPoints[0].length === 0) {
        yearChartEl.classList.remove("chart-quarter-activated");
        quarterChartEl.classList.remove("active");
      }
    });

    // Add update event for the year chart
    yearChart.addEventListener('updated', chart => updateQuarterChart(chart, 'barQuarter'));

    // Update chart on model change
    const modelElement = document.querySelector("#model");
    if (modelElement) {
      modelElement.addEventListener("change", () => {
        yearChart.updateSeries([{ data: makeData() }]);
      });
    } else {
      console.warn("Element '#model' not found.");
    }
  } catch (error) {
    console.error("Error rendering charts:", error);
  }
});
