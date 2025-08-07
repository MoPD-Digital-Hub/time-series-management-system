$(document).ready(function () {
    const COLORS = ['primary', 'secondary', 'success', 'danger', 'warning', 'info']
    const COLORS_CODE = ['#007bff', '#6c757d', '#28a745', '#dc3545', '#ffc107', '#17a2b8']

    const fetchData = async(url) =>{
        const response = await axios.get(url)
        try{
            return response.data
        }catch(error){
            console.error("Error:", error);
        }
    }

    const randomColor = () =>{
        let random = Math.floor(Math.random() * COLORS.length);
        return(COLORS[random])
    }

    const handleTopicSkeleton = (show=true) =>{
        const skeleton = `
                        <div class="col-md-6 col-xl-3 col-6 container loading-skeleton ">
                            <div class="card social-widget-card">
                                <div class="card-body d-flex justify-content-between align-items-center p-2">
                                    <div class="bg-body text-center text-primary p-3 mt-3 rounded" style="width: 100%;">
                                        <div class="spinner-grow" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        `
        $("#dashboard-card-list").html(show ? skeleton.repeat(8) : '')
    }


    const handleCardSkeleton = (show=true) =>{
        const skeleton = `
                        <div class="col-md-6 col-xl-4 d-md-block container loading-skeleton ">
                            <div class="card social-widget-card">
                                <div class="card-body d-flex justify-content-between align-items-center p-2">
                                    <div class="bg-body  d-flex flex-column justify-content-center align-items-center text-primary p-3 mt-3 rounded" style="height:160px; width: 100%;">
                                        <div class="spinner-grow" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
            `
        $("#category-card-list").html(show ? skeleton.repeat(6) : '')
    }


    const topicListHtml = (topics) =>{
        $("#dashboard-card-list").html('')  //clear inner html
        let topicList = topics.map((topic) => {
            return(`
            <div class="col-6 col-md-3" data-id="${topic.id}" data-topic-name="${topic.title_ENG}" name="topic-card" >
                <div class="card social-widget-card bg-${randomColor()}">
                    <div class="card-body d-flex justify-content-between align-items-center p-2">
                        <div class="d-flex flex-column">
                            <h3 class="text-white m-0">${topic.category_count}+</h3>
                            <span class="m-t-10">${topic.title_ENG}</span>
                        </div>
                        <i class="fa fa-${topic?.icon?.split(",")[1]}"></i>
                </div>
            </div>
        </div>

                `
            )
        })

        $("#dashboard-card-list").html(topicList)  //assign the cards
    }

    const categoryHtml = (data) => {
        for(item of data){
            let color = randomColor()
            $("#category-card-list").append(
            `
                <h4 class="text-center text-${color} mt-3">${item.name_ENG}</h4>
                <hr class="mb-5">
                ${indicatorCard(item.indicators, color)} 
            `)
           
            for(indicator of item.indicators){
                cardGraph(indicator, color)
            }
        }
    }

    
    const indicatorCard = (indicators, color) => {
        let card =  indicators.map((indicator) =>{
            return `
            <div class="col-md-6 col-xxl-4 col-12">
            <div class="card border-${color} ">
                <div class="card-body">

                    <!--card header-->
                    <div class="d-flex align-items-center">

                        <!--start Icon-->
                        <div class="flex-shrink-0">
                            <div class="avtar avtar-s  bg-light-primary">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path opacity="0.4" d="M13 9H7" stroke="#4680FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M22.0002 10.9702V13.0302C22.0002 13.5802 21.5602 14.0302 21.0002 14.0502H19.0402C17.9602 14.0502 16.9702 13.2602 16.8802 12.1802C16.8202 11.5502 17.0602 10.9602 17.4802 10.5502C17.8502 10.1702 18.3602 9.9502 18.9202 9.9502H21.0002C21.5602 9.9702 22.0002 10.4202 22.0002 10.9702Z" stroke="#4680FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M17.48 10.55C17.06 10.96 16.82 11.55 16.88 12.18C16.97 13.26 17.96 14.05 19.04 14.05H21V15.5C21 18.5 19 20.5 16 20.5H7C4 20.5 2 18.5 2 15.5V8.5C2 5.78 3.64 3.88 6.19 3.56C6.45 3.52 6.72 3.5 7 3.5H16C16.26 3.5 16.51 3.50999 16.75 3.54999C19.33 3.84999 21 5.76 21 8.5V9.95001H18.92C18.36 9.95001 17.85 10.17 17.48 10.55Z" stroke="#4680FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </div>
                        </div>

                        <!--Indicator Title-->
                        <div class="flex-grow-1 ms-3">
                            <h6 class="mb-0">${indicator.title_ENG}</h6>
                        </div>


                        <!--Detail-->
                        <div class="flex-shrink-0 ms-3">
                            <div class="dropdown">
                                <a class="avtar avtar-s btn-link-primary dropdown-toggle arrow-none" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="ti ti-dots-vertical f-18"></i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end">
                                    <a href="/data-portal/detail-indicator/${indicator.id}/"  class="dropdown-item">
                                        <svg class="pc-icon"> <use xlink:href="#custom-flash"></use></svg> 
                                        Detail
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>


                    <div class="bg-body p-3 mt-3 rounded" >
                        <div class="row align-items-center">
                            <div class="col-7 col-md-8">
                                <div id="chart${indicator.id}" ></div>
                            </div>

                            <div class="col-3" >
                                <h4 class="">
                                    <span class="badge bg-light-${color} border border-${color}">
                                        ${indicator?.annual_data[0]?.for_datapoint} 
                                        <hr>
                                        ${indicator?.annual_data[0]?.performance} 
                                    </span>
                                </h4>
                            </div>

                        </div>
                    </div>
                    
                </div>
            </div>
          </div>
            `
           
        }).join("")

        return card.length > 0 ?  card : `<p class="text-center text-danger">No data found</p>`
    }


    const cardGraph = (indicator, color) =>{
        
        const seriesData = indicator.annual_data.map((value) => {
            return {
              x: value.for_datapoint, // year
              y: value.performance, // value
            };
          }).reverse();


        var options = {
            series: [
                {
                  data: seriesData,
                },
              ],
          chart: {
              type: "bar",
              height: 100,
              sparkline: {
                  enabled: true,
              },
          },
          colors: [COLORS_CODE[COLORS.indexOf(color)]],
          plotOptions: {
              bar: {
                  columnWidth: "80%",
              },
          },
          dataLabels: {
            enabled: false,
          },
          
          xaxis: {
              crosshairs: {
                  width: 1,
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
  
          var chart = new ApexCharts(document.querySelector(`#chart${indicator.id}`), options);
          chart.render();
          return ''
    }

    const getWays = async() =>{


        handleTopicSkeleton(true) // show loading before fetching data
        const topics = await fetchData('/data-portal/api/topic-lists')
        handleTopicSkeleton(false)  // hide loading


        
        topicListHtml(topics) //contract the topic cards


         //handle on topic clicked
        $("[name='topic-card']").click(async function () {
            let cardData = $(this).data();
            $("#topic-title").html(cardData.topicName)  //change title of topic

            handleCardSkeleton(true)
            const categories = await fetchData(`/data-portal/api/category-with-indicator/${cardData.id}`)
            handleCardSkeleton(false)

            categoryHtml(categories)
        })





    }

    getWays()

   


  
})