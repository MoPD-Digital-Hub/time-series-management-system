
axios.get(`/indicator_graph/${pathID}`)
  .then(response => {
    const data = response.data;
    const annualData = data.annual_data_value.map(item => ({
      year: item.for_datapoint__year_EC,
      performance: item.performance
    }));

    // Update the chart with the fetched data
    const options = {
      colors: ['#40864b'],
      series: [{
        name: 'Performance',
        data: annualData.map(item => item.performance)
      }],
      chart: {
        height: 350,
        type: 'bar',
        toolbar: {
          show: false,
          offsetX: 0,
          offsetY: 0
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: '50%',
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 0
      },
      grid: {
        row: {
          colors: ['#fff', '#f2f2f2']
        }
      },
      xaxis: {
        labels: {
          rotate: -45
        },
        categories: annualData.map(item => item.year),
        tickPlacement: 'on'
      },
      yaxis: {
        title: {
          text: 'Last 10 Years Performance',
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "horizontal",
          shadeIntensity: 0.25,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 0.85,
          opacityTo: 0.85,
          stops: [50, 0, 100]
        },
      }
    };

    const chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
 
    const monthData = data.month_data_value.map(item => ({
      month: item.for_month__number,
      year: item.for_datapoint__year_EC,
      performance: item.performance
    }));
    console.log(data);

    // Create month-year combinations for x-axis categories
    const categories = monthData.map(item => `${item.month}/2/${item.year}`);
    console.log(categories);

    const optionsMonth = {
      colors: ['#40864b'],
      series: [{
        name: 'Performance',
        data: monthData.map(item => item.performance)
      }],
      chart: { 
        height: 350, 
        type: 'line', 
      }, 
      forecastDataPoints: { 
        count: 10 
      }, 
      stroke: { 
        width: 5, 
        curve: 'smooth' 
      }, 
      xaxis: { 
        type: 'datetime', 
        categories: categories, 
        tickAmount: 10, 
        labels: { 
          formatter: function(value, timestamp, opts) { 
            return opts.dateFormatter(new Date(timestamp), 'dd MMM') 
          } 
        } 
      }, 
      title: { 
        text: 'Recent year month performance', 
        align: 'left', 
        style: { 
          fontSize: "16px", 
          color: '#666' 
        } 
      }, 
      fill: { 
        type: 'gradient', 
        gradient: { 
          shade: 'dark', 
          gradientToColors: [ '#FDD835'], 
          shadeIntensity: 1, 
          type: 'horizontal', 
          opacityFrom: 1, 
          opacityTo: 1, 
          stops: [0, 100, 100, 100] 
        }, 
      } 
      }; 
  
      var chartMonth = new ApexCharts(document.querySelector("#chartMonth"), optionsMonth); 
      chartMonth.render();
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });

   


 