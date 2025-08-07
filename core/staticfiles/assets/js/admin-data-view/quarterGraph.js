   

    let urlPath = window.location.pathname;
    let pathID = urlPath.replace("/user-admin/indicator_detail_view/", "").replace("/", "");


    async function fetchData(pathID) {
        try {
            const response = await axios.get(`/indicator_graph/${pathID}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            return response.data;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    fetchData(pathID)
        .then((data) => {

            function makeData() {
                // Group quarter data by year
                var yearData = data.quarter_data_value.reduce((acc, curr) => {
                    var year = curr.for_datapoint__year_EC;
                    if (!acc[year]) {
                        acc[year] = [];
                    }
                    acc[year].push(curr);
                    return acc;
                }, {});
            
                
            
                // Map grouped data to the final structure
                var dataYearSeries = Object.keys(yearData).map(year => {
                    var yearPerformance = yearData[year].reduce((sum, item) => sum + item.performance, 0);
            
                    var quarters = yearData[year].map(item => ({
                        x: `Q${item.for_quarter__number}`,
                        y: item.performance
                    }));
            
                    return {
                        x: year,
                        y: yearPerformance,
                        color: getRandomColor(colors),
                        quarters: quarters
                    };
                });
            
                return dataYearSeries;
            }
            
           var colors = ['#FF5733', '#33FF57', '#3357FF', '#FF3357', '#57FF33', '#5733FF'];
            function getRandomColor(colors) {
                return colors[Math.floor(Math.random() * colors.length)];
            }

            
           
            var result = makeData();
           
            

            

    Apex = {
        chart: {
          toolbar: {
            show: false
          }
        },
        tooltip: {
          shared: false
        },
      }
  
      var optionsYear = {
        chart: {
          id: 'barYear',
          height: 400,
          width: '100%',
          type: 'bar',
        },
        plotOptions: {
          bar: {
            distributed: true,
            horizontal: true,
            endingShape: 'arrow',
            barHeight: '75%',
            dataLabels: {
              position: 'bottom'
            }
          }
        },
        dataLabels: {
          enabled: true,
          textAnchor: 'start',
          style: {
            colors: ['#fff']
          },
          formatter: function(val, opt) {
            return opt.w.globals.labels[opt.dataPointIndex]
          },
          offsetX: 0,
          dropShadow: {
            enabled: true
          }
        },
        colors: colors,
        series: [{
          data: makeData()
        }],
        states: {
          normal: {
            filter: {
              type: 'desaturate'
            }
          },
          active: {
            allowMultipleDataPointsSelection: true,
            filter: {
              type: 'darken',
              value: 1
            }
          }
        },
        tooltip: {
          x: {
            show: false
          },
          y: {
            title: {
              formatter: function(val, opts) {
                return opts.w.globals.labels[opts.dataPointIndex]
              }
            }
          }
        },
        title: {
          text: 'Recent 10 ---------- years quarterly performance result',
          offsetX: 15
        },
        subtitle: {
          text: '(Click on year bar to see quarter details)',
          offsetX: 15
        },
        yaxis: {
          labels: {
            show: false
          }
        },
      }
      var yearChart = new ApexCharts(
        document.querySelector("#chart-year"),
        optionsYear
      );
      yearChart.render();
    
      function updateQuarterChart(sourceChart, destChartIDToUpdate) {
        var series = [];
        var seriesIndex = 0;
        var colors = []
        if (sourceChart.w.globals.selectedDataPoints[0]) {
          var selectedPoints = sourceChart.w.globals.selectedDataPoints;
          for (var i = 0; i < selectedPoints[seriesIndex].length; i++) {
            var selectedIndex = selectedPoints[seriesIndex][i];
            var yearSeries = sourceChart.w.config.series[seriesIndex];
            series.push({
              name: yearSeries.data[selectedIndex].x,
              data: yearSeries.data[selectedIndex].quarters
            })
            colors.push(yearSeries.data[selectedIndex].color)
          }
          if (series.length === 0) series = [{
            data: []
          }]
          return ApexCharts.exec(destChartIDToUpdate, 'updateOptions', {
            series: series,
            colors: colors,
            fill: {
              colors: colors
            }
          })
        }
      }
      var optionsQuarters = {
        chart: {
          id: 'barQuarter',
          height: 400,
          width: '100%',
          type: 'bar',
          stacked: true
        },
        plotOptions: {
          bar: {
            columnWidth: '50%',
            horizontal: false
          }
        },
        series: [{
          data: []
        }],
        legend: {
          show: false
        },
        grid: {
          yaxis: {
            lines: {
              show: false,
            }
          },
          xaxis: {
            lines: {
              show: true,
            }
          }
        },
        yaxis: {
          labels: {
            show: false
          }
        },
        title: {
          text: `Quarterly performance results`,
          offsetX: 10
        },
        tooltip: {
          x: {
            formatter: function(val, opts) {
              return opts.w.globals.seriesNames[opts.seriesIndex]
            }
          },
          y: {
            title: {
              formatter: function(val, opts) {
                return opts.w.globals.labels[opts.dataPointIndex]
              }
            }
          }
        }
      }
      var chartQuarters = new ApexCharts(
        document.querySelector("#chart-quarter"),
        optionsQuarters
      )
      chartQuarters.render();
      yearChart.addEventListener('dataPointSelection', function(e, chart, opts) {
        var quarterChartEl = document.querySelector("#chart-quarter");
        var yearChartEl = document.querySelector("#chart-year");
        if (opts.selectedDataPoints[0].length === 1) {
          if (quarterChartEl.classList.contains("active")) {
            updateQuarterChart(chart, 'barQuarter')
          } else {
            yearChartEl.classList.add("chart-quarter-activated")
            quarterChartEl.classList.add("active");
            updateQuarterChart(chart, 'barQuarter')
          }
        } else {
          updateQuarterChart(chart, 'barQuarter')
        }
        if (opts.selectedDataPoints[0].length === 0) {
          yearChartEl.classList.remove("chart-quarter-activated")
          quarterChartEl.classList.remove("active");
        }
      })
      yearChart.addEventListener('updated', function(chart) {
        updateQuarterChart(chart, 'barQuarter')
      })
      document.querySelector("#model").addEventListener("change", function(e) {
        yearChart.updateSeries([{
          data: makeData()
        }])
      })

        })
        .catch((error) => {
            console.error('Error:', error);
        });

   

    
    
    

