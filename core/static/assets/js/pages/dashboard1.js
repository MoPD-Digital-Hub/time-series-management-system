
let filterData = () => {
  fetch("/user-admin/json-dashboard/")
    .then((response) => response.json())
    .then((data) => {
      let yearRandomDataChart = () => {

        let excludedRandomNumbers = [];

        //last 5 Year Data
        let lastFiveYearData = []

        function getRandomInt(min, max) {
          min = Math.ceil(min);
          max = Math.floor(max);
          let index = Math.floor(Math.random() * (max - min)) + min;
          while (excludedRandomNumbers.includes(index)) {
            index = Math.floor(Math.random() * (max - min)) + min;
            excludedRandomNumbers.push(index);
          }
          return index;
        }

        let randomCategoryIndex1 = getRandomInt(0, data.categories.length);
        let randomCategoryIndex2 = getRandomInt(0, data.categories.length);

        //Random Category
        let randomCategory = () => {
          randomCategoryIndex1 = getRandomInt(0, data.categories.length);
          return data.categories[randomCategoryIndex1];
        };

        let randomChoocedCategory = "";

        let indicatorActualvalue = [];
        let checkIndicatorValue = false;

        while (checkIndicatorValue != true) {
          //Indicaor
          indicatorActualvalue = [];
          randomChoocedCategory = randomCategory();
          indicatorLists = data.indicators.filter(
            (item) =>
              String(item.for_category_id) ==
              String(randomChoocedCategory.id) && item.type_of == "yearly"
          );

          while (indicatorLists.length == 0) {
            randomChoocedCategory = randomCategory();
            indicatorLists = data.indicators.filter(
              (item) =>
                String(item.for_category_id) ==
                String(randomChoocedCategory.id) && item.type_of == "yearly"
            );
          }

          //Value
          for (indicator of indicatorLists) {
            let val = [];
            for (year of data.year) {
              let value = data.value.find(
                (value) =>
                  String(value.for_indicator_id) == String(indicator.id) &&
                  String(value.for_datapoint_id) == String(year.id) &&
                  value.for_month_id == null &&
                  value.for_quarter_id == null
              );
              value ? val.push(value.value) : val.push(null);
            }
            indicatorActualvalue.push({ name: indicator.title_ENG, data: val });
          }

          for (let i of indicatorActualvalue) {
            let checkValue = i.data.filter((item) => item != null);
            if (checkValue.length != 0) {
              checkIndicatorValue = true;
              break;
            }
          }
        }


        for (let cut of indicatorActualvalue) {
          lastFiveYearData.push({ name: cut.name, data: cut.data.slice(cut.data.length - 5, cut.data.length) })
        }


        ///CHART

        //Random Yearly Graph 1
        Highcharts.chart("containerYear1", {
          title: {
            text: `${randomChoocedCategory.name_ENG}`,
            align: "left",
          },

          subtitle: {
            text: "Source: MOPD.",
            align: "left",
          },

          yAxis: {
            title: {
              text: "Values",
            },
          },

          xAxis: {
            accessibility: {
              rangeDescription: "Range: 1967 to 2015",
            },
          },

          plotOptions: {
            series: {
              label: {
                connectorAllowed: false,
              },
              pointStart: parseInt(data.year[0].year_EC),
            },
          },

          series: indicatorActualvalue,

          responsive: {
            rules: [
              {
                condition: {
                  maxWidth: 500,
                },
                chartOptions: {
                  legend: {
                    layout: "horizontal",
                    align: "center",
                    verticalAlign: "bottom",
                  },
                },
              },
            ],
          },
        });


        //Random Yearly Graph 2
        Highcharts.chart("containerYear2", {
          title: {
            text: `${randomChoocedCategory.name_ENG} Last 5 Years`,
            align: "left",
          },

          subtitle: {
            text: "Source: MOPD.",
            align: "left",
          },

          yAxis: {
            title: {
              text: "Values",
            },
          },

          xAxis: {
            accessibility: {
              rangeDescription: "Range: 1967 to 2015",
            },
          },

          plotOptions: {
            series: {
              label: {
                connectorAllowed: false,
              },
              pointStart: parseInt(data.year[data.year.length - 5].year_EC),
            },
          },

          series: lastFiveYearData,

          responsive: {
            rules: [
              {
                condition: {
                  maxWidth: 500,
                },
                chartOptions: {
                  legend: {
                    layout: "horizontal",
                    align: "center",
                    verticalAlign: "bottom",
                  },
                },
              },
            ],
          },
        });
      };

      let monthRandomDataChart = () => {
        let lastYear = data.year[data.year.length - 2]; // last Year
        //Month Data
        let monthlyValue = [];

        //Month Data
        let monthlyIndicator = data.indicators.filter(
          (item) => item.type_of == "monthly"
        );
        let randomMonthlyIndicatorIndex1 = null;
        let randomMonthlyIndicatorIndex2 = null;
        let randomMonthlyIndicator1 = null;
        let randomMonthlyIndicator2 = null;

        //Find the right indicator which is the indicator shouldn't duplicated and is not deleted
        do {
          do {
            randomMonthlyIndicatorIndex1 =
              Math.floor(Math.random() * (monthlyIndicator.length - 0)) + 0;
            randomMonthlyIndicatorIndex2 =
              Math.floor(Math.random() * (monthlyIndicator.length - 0)) + 0;
          } while (
            String(randomMonthlyIndicatorIndex1) ==
            String(randomMonthlyIndicatorIndex2)
          );

          randomMonthlyIndicator1 =
            monthlyIndicator[randomMonthlyIndicatorIndex1];
          randomMonthlyIndicator2 =
            monthlyIndicator[randomMonthlyIndicatorIndex2];
        } while (
          randomMonthlyIndicator1.is_deleted == true ||
          randomMonthlyIndicator2.is_deleted == true
        );

        let monthValue1 = [];
        let monthValue2 = [];

        for (month of data.month) {
          let value1 = data.value.find(
            (itemValue) =>
              String(itemValue.for_indicator_id) ==
              String(randomMonthlyIndicator1.id) &&
              String(itemValue.for_month_id) == String(month.id) &&
              String(itemValue.for_datapoint_id) == String(lastYear.id)
          );
          value1 ? monthValue1.push(value1.value) : monthValue1.push(null);

          let value2 = data.value.find(
            (itemValue) =>
              String(itemValue.for_indicator_id) ==
              String(randomMonthlyIndicator2.id) &&
              String(itemValue.for_month_id) == String(month.id) &&
              String(itemValue.for_datapoint_id) == String(lastYear.id)
          );
          value2 ? monthValue2.push(value2.value) : monthValue2.push(null);
        }

        cat1 = data.categories.find((item) => String(item.id) == String(randomMonthlyIndicator1.for_category_id))
        cat2 = data.categories.find((item) => String(item.id) == String(randomMonthlyIndicator2.for_category_id))

        monthlyValue.push(
          { name: String(randomMonthlyIndicator1.title_ENG) + "  ( " + String(cat1.name_ENG)+")",  data: monthValue1 },
          { name: String(randomMonthlyIndicator2.title_ENG) + "  ( " + String(cat2.name_ENG)+")",  data: monthValue2 }
        );

        //Random Month Graph
        // Data retrieved https://en.wikipedia.org/wiki/List_of_cities_by_average_temperature
        Highcharts.chart("containerMonth1", {
          chart: {
            type: "spline",
          },
          title: {
            text: `${lastYear.year_EC} Yearly Random Data`,
          },
          subtitle: {
            text: "Source: " + "MoPD",
          },
          xAxis: {
            categories: [
              "መስከረም",
              "ጥቅምት",
              "ኅዳር",
              "ታኅሣሥ",
              "ጥር",
              "የካቲት",
              "መጋቢት",
              "ሚያዝያ",
              "ግንቦት",
              "ሰኔ",
              "ሐምሌ",
              "ነሐሴ",
            ],
            accessibility: {
              description: "Months of the year",
            },
          },
          yAxis: {
            title: {
              text: "Value",
            },
            labels: {
              format: "{value}",
            },
          },
          tooltip: {
            crosshairs: true,
            shared: true,
          },
          plotOptions: {
            spline: {
              marker: {
                radius: 4,
                lineColor: "#666666",
                lineWidth: 1,
              },
            },
          },
          series: monthlyValue,
        });
      }


      yearRandomDataChart()
      monthRandomDataChart()


    })
    .catch((err) => console.log(err));
};

filterData();

$.ajax({
  url: "/user-admin/json-filter-drill/",
  type: "GET",
  success: function(data) {
      Highcharts.chart('drilldown', {
          chart: {
              type: 'column'
          },
          title: {
            align: 'left',
            text: 'Topic relation with catagory counted'
          },
          xAxis: {
              type: 'category'
          },
          yAxis: {
              title: {
                  text: 'Total relation count'
              }
          },
          legend: {
              enabled: false
          },
          plotOptions: {
              series: {
                  borderWidth: 0,
                  dataLabels: {
                      enabled: true,
                      format: '{point.y:.0f}'
                  }
              }
          },
          tooltip: {
              headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
              pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b><br/>'
          },
          series: [
            data.topic_data
        ],
          drilldown: {
            breadcrumbs: {
                position: {
                    align: 'right'
                }
            },
            series: 
               data.drilldown
            
        }
        
      });
  },
  error: function(error) {
      console.error("Error fetching chart data:", error);
  }
});


let globalData = [];
let chart;
let duration = 500;
let smallestYear = Infinity;
let largestYear = -Infinity;
let currentYear;
let guiButton = document.getElementById('start');
let guiButtonState = 'Start';
let intervalId;

// Function to start the chart automatically
function startChartAutomatically() {
  guiButton.click(); // Simulate a click on the "Start" button
}

fetch('/user-admin/json-filter-random/')
  .then(response => response.json())
  .then(data => {
    parseData(data);
    initializeChart();
    initEvents();
    startChartAutomatically();
  });

function initEvents() {
  guiButton.addEventListener('click', function () {
    if (guiButtonState === 'Stop') {
      intervalId = clearInterval(intervalId);
      guiButton.innerText = guiButtonState = 'Resume';
    } else {
      if (guiButtonState === 'Restart') {
        initializeChart();
      }
      guiButton.innerText = guiButtonState = 'Stop';
      intervalId = setInterval(function () {
        if (currentYear > largestYear) {
          intervalId = clearInterval(intervalId);
          currentYear = smallestYear;
          guiButton.innerText = guiButtonState = 'Restart';
        } else {
          updateChart(currentYear += 1);
        }
      }, duration);
    }
  });
}

function updateChart(year) {
  chart.setTitle(null, {
    text: `Year: ${year}`
  }, false);

  chart.series.forEach((series, seriesIndex) => {
    const indicatorName = globalData[seriesIndex].name;
    const indicatorData = globalData[seriesIndex].data;
    const point = indicatorData.find(point => parseInt(point.year) === year);

    if (point) {
      series.addPoint({
        x: year,
        y: point.value,
        dataLabels: {
          enabled: true
        },
        marker: {
          enabled: true
        }
      }, false, false, false);
    }
  });

  chart.redraw({
    duration
  });
}

function parseData(data) {
  globalData = [];

  Object.keys(data).forEach(indicatorType => {
    const indicatorData = data[indicatorType];
    globalData.push({
      name: indicatorType,
      data: indicatorData.map(point => ({
        year: point.year,
        value: point.value
      }))
    });

    const years = indicatorData.map(point => parseInt(point.year));
    smallestYear = Math.min(smallestYear, ...years);
    largestYear = Math.max(largestYear, ...years);
  });

  currentYear = smallestYear;
}

function initializeChart() {
  chart = Highcharts.chart('live_data', {
    chart: {
      type: 'line',
      marginLeft: 10,
    },
    legend: {
      layout: 'proximate',
      align: 'right'
    },
    title: {
      floating: true,
      align: 'left',
      x: 93,
      y: 20,
      text: 'Random category indicator(s) data per year'
    },
    subtitle: {
      floating: true,
      align: 'left',
      y: 60,
      x: 90,
      text: `Year: ${currentYear}`,
      style: {
        fontSize: '40px'
      }
    },
    tooltip: {
      split: true
    },
    yAxis: {
      title: {
        text: ''
      },
      maxPadding: 0.2,
      softMax: 200
    },
    xAxis: {
      gridLineWidth: 2,
      min: smallestYear,
      max: largestYear,
      labels: {
        format: '{value}'
      }
    },
    plotOptions: {
      series: {
        animation: {
          duration
        },
        marker: {
          symbol: 'circle'
        }
      }
    },
    series: globalData.map(indicator => {
      return {
        name: indicator.name,
        data: []
      };
    }),
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 1800 // Adjust the maximum width as needed
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              verticalAlign: 'bottom'
            }
          }
        }
        // Add more rules for other screen sizes if needed
      ]
    }
  });
}









