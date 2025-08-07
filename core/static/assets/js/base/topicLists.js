$(document).ready(function () {

  const colors = [
    "primary",
    "secondary",
    "success",
    "danger",
    "warning",
    "info",
    "dark",
  ];

  const getColorHex = (colorClass) => {
    switch (colorClass) {
      case "primary":
        return "#007bff"; // Example primary color
      case "secondary":
        return "#6c757d"; // Example secondary color
      case "success":
        return "#28a745"; // Example success color
      case "danger":
        return "#dc3545"; // Example danger color
      case "warning":
        return "#ffc107"; // Example warning color
      case "info":
        return "#17a2b8"; // Example info color
      case "dark":
        return "#343a40"; // Example dark color
      default:
        return "#000000"; // Default color (black) or handle unknown cases
    }
  };

  const categoryList = async (id) => {
    let url = `/data-portal/api/category-with-indicator/${id}`;
    let [loading, response] = await useFetch(url);
    let category_list = response.map((category) => {
      let color = colors[Math.floor(Math.random() * colors.length)];
      return categoryCard(category, color);
    });

    $("#category_list").html(category_list);
  };

  const topicCard = (topic, color) => {
    return `
    <style>
      .topic-card {
        transition: box-shadow 0.3s;
      }
      
      .topic-card:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.3);
        background-color: gray;
        text : white;
      }
    </style>
    <div data-id="${topic.id}" name="topic-card" class="col-md-3 col-sm-6">
      <div style="border-radius: 16px;" class="card topic-card border-0 shadow-sm p-3">
        <h4 class="fw-bold">${topic.category_count}+</h4>
        <p>${topic.title_ENG}</p>
        <div class="row justify-content-between d-flex align-items-center">
          <div class="col-6">
            <div style="width: 60px; height: 60px;" class="bg-${color} d-flex flex-column justify-content-center rounded-circle text-center">
              <i class="fa fa-${topic?.icon?.split(",")[1]} h3"></i>
            </div>
          </div>
          <div class="col-6 text-center">
            <i style="font-size: 40px;" class="bi text-${color} align-text-bottom bi-bar-chart-line-fill"></i>
          </div>
        </div>
      </div>
    </div>
    `;
  };


  const categoryCard = (category, color) => {
    let htmlContent = '';
    const hexColor = getColorHex(color);
    console.log(category)
    if (category.indicators.length > 0) {
    category.indicators.forEach((indicator) => {
    if (indicator.annual_data && indicator.annual_data.length > 0) {
      const latestDataPoint = indicator.annual_data[0];
      const latestYear = latestDataPoint.for_datapoint;
      const latestPerformance = latestDataPoint.performance;

            const seriesData = [{
                name: " ",
                data: indicator.annual_data.reverse().map(dataPoint => {
                  return {
                    x : dataPoint.for_datapoint,
                    y : dataPoint.performance,
                  }
                })
            }];

            const hexColor = getColorHex(color);

            const options = {
                series: seriesData,
                chart: {
                    height: 100,
                    type: 'area',
                    zoom: {
                        enabled: false
                    },
                    sparkline: {
                      enabled: true,
                  },
                    toolbar: {
                      show: false
                    }
                },
                colors : [hexColor],
                xaxis: {
                  crosshairs: {
                      width: 1,
                  },
              },
                dataLabels: {
                    enabled: false
                },
                grid: {
                  show: false,      // you can either change hear to disable all grids
                  xaxis: {
                    lines: {
                      show: false  //or just here to disable only x axis grids
                     }
                   },  
                  yaxis: {
                    lines: { 
                      show: false  //or just here to disable only y axis
                     }
                   },   
                },

                tooltip: {
                  fixed: {
                      enabled: true,
                  },
                  x: {
                      show: true,
                      formatter: function (val) {
                          return `Year: ${val}`; // Access x value (year) directly
                      },
                  },
                  y: {
                      title: {
                          formatter: function (e) {
                              return "";
                          },
                      },
                  },
                  marker: {
                  show: false,
              },
              },
            };

            

            const indicatorChartId = `chart_${indicator.id}`;

            const indicatorChartHtml = `
            <div class="col-md-4 col-xxl-4 col-12">
                <div class="card border-${color}">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-shrink-0">
                                <div class="avtar avtar-s bg-light-primary">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <!-- SVG code for icon -->
                                    </svg>
                                </div>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <a  href="/user-admin/indicator_detail_view/${indicator.id}" class="text-${color}">${indicator.title_ENG} (Annual) <span> <i class="fa fa-eye float-end text-${color}"></i> </span> </a>
                            </div>
                        </div>
                        <div class="bg-body mt-3 rounded ">
                            <div class="row align-items-center bg-light p-3">
                                <div class="col-7 col-md-8">
                                    <div class="" id="${indicatorChartId}"></div>
                                </div>
                                <div class="col-3">
                                    <h4 class="">
                                        <span class="badge bg-${color} border border-${color}">
                                          ${latestYear}
                                            <hr>
                                            ${latestPerformance}
                                        </span>
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <script>
                    var options_${indicator.id} = ${JSON.stringify(options)};
                    var chart_${indicator.id} = new ApexCharts(document.getElementById("${indicatorChartId}"), options_${indicator.id});
                    chart_${indicator.id}.render();
                </script>
            </div>
            `;

            htmlContent += indicatorChartHtml;
        } 
    });
    }
    else {
      htmlContent = `
          <h5 class="text-danger text-center"> 
             No data found
          </h5>
      `
    }

    return `
        <h4 class="fw-bold text-${color} text-center">${category.name_ENG}</h4>
        <div class="border border-${color} mt-3 mb-5 rounded">
            <div class="row m-3">
                ${htmlContent}
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    `;
  };

  const fetchTopicLists = async () => {
    let url = "/topic_list/";
    let [loading, response] = await useFetch(url);

    let topicLists = response.map((topic) => {
      let color = colors[Math.floor(Math.random() * colors.length)];
      return topicCard(topic, color);
    });

    $("#topic_list").html(topicLists);

    $("[name='topic-card']").click(async function () {
      let id = $(this).data("id");
      categoryList(id);
    });
  };

  fetchTopicLists();
});



 // const categoryCard2 = (category, color) => {
  //   const hexColor = getColorHex(color);
  //   const options = {
  //     colors: [hexColor],
  //     series: [
  //       {
  //         name: "Performance",
  //         data: category.indicators.map(
  //           (item) => item.annual_data[0].performance
  //         ),
  //       },
  //     ],
  //     chart: {
  //       height: 350,
  //       type: "bar",
  //       toolbar: {
  //         show: false,
  //         offsetX: 0,
  //         offsetY: 0,
  //       },
  //     },
  //     plotOptions: {
  //       bar: {
  //         borderRadius: 10,
  //         columnWidth: "50%",
  //       },
  //     },
  //     dataLabels: {
  //       enabled: false,
  //     },
  //     stroke: {
  //       width: 0,
  //     },
  //     grid: {
  //       row: {
  //         colors: ["#fff", "#f2f2f2"],
  //       },
  //     },
  //     xaxis: {
  //       labels: {
  //         rotate: -45,
  //       },
  //       categories: category.indicators.map((item) => item.title_ENG),
  //       tickPlacement: "on",
  //     },
  //     yaxis: {
  //       title: {
  //         text: "Last 10 Years Performance",
  //       },
  //     },
  //     fill: {
  //       type: "gradient",
  //       gradient: {
  //         shade: "light",
  //         type: "horizontal",
  //         shadeIntensity: 0.25,
  //         gradientToColors: undefined,
  //         inverseColors: true,
  //         opacityFrom: 0.85,
  //         opacityTo: 0.85,
  //         stops: [50, 0, 100],
  //       },
  //     },
  //   };

  //   const yearChartId = `admin_chart_year_${category.id}`;
  //   return `
  //      <h4 class="fw-bold text-${color} text-center">${category.name_ENG}</h4>
  //       <div class="border border-xl border-${color} mt-3 mb-5 rounded shadow">
  //           <div class="row">
  //               <div class="col-lg-8">
  //                   <div id="${yearChartId}"></div>
  //               </div>
              
               
              
                
  //           </div>
  //           <script>
  //               var chart_${yearChartId} = new ApexCharts(document.getElementById("${yearChartId}"), ${JSON.stringify(options)});
  //               chart_${yearChartId}.render();
  //           </script>
  //       </div>
  //   `;
  // };
