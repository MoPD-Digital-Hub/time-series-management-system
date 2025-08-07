$(document).ready(() => {
    $(function () {

        // Define a variable to hold the Choices instance
        let multipleCancelButton;

        //generate unique id
        function* generateId() {
            let i = 0;
            while (true) {
                yield i++;
            }
        }

        const idGen = generateId();

        $("[name='component']").draggable({
            revert: "invalid",
            stack: ".draggable",
            helper: 'clone',
            scroll: false,
        });
        
        $("[name='row']").draggable({
            revert: "invalid",
            stack: ".draggable",
            helper: 'clone',
            scroll: false,
        });
        
        // Define handleAfterDropped function to handle element drop
        const handleAfterDropped = (event, ui) => {
            let droppable = $(event.target); // Target the specific row element
            let draggable = ui.draggable;
        
            droppable.addClass("bg-gray-300").find("h5").html("");
        
            let colId = idGen.next().value;
        
            // Create a new parent div for the column
            let parentDiv = $(`<div name="col_component" data-rank=-1 id="dragged_col_${colId}" class="col-md-4 row-col"></div>`);
            let card = $(`<div class="card"></div>`);
            let cardBody = $(`
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div id="col-rank-info-col_${colId}" class="flex-grow-1 ms-3">
                            <small class="mb-0 text-danger">col rank - None (component not created!)</small>
                        </div>
                        <div class="flex-shrink-0 ms-3">
                            <div class="dropdown">
                                <a class="avtar avtar-s btn-link-primary dropdown-toggle arrow-none" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="ti ti-dots-vertical f-18"></i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end">
                                    <button 
                                        type="button"
                                        name="btn-edit" 
                                        data-id="${draggable.data('id')}"
                                        data-is-multiple="${draggable.data('isMultiple')}"
                                        data-is-single-year="${draggable.data('isSingleYear')}"
                                        data-is-range="${draggable.data('isRange')}"
                                        data-is-country="${draggable.data('isCountry')}"  
                                        data-row-id="${droppable.attr('id')}"
                                        data-has-title="${draggable.data('hasTitle')}"
                                        data-has-indicator="${draggable.data('hasIndicator')}"
                                        data-has-description="${draggable.data('hasDescription')}"
                                        data-has-icon="${draggable.data('hasIcon')}"
                                        data-is-custom="${draggable.data('isCustom')}"
                                        data-is-image-component="${draggable.data('isImageComponent')}"
                                        data-col-rank="None"
                                        id="col_${colId}"
                                        data-bs-toggle="modal" 
                                        data-bs-target="#modalAddDashboardRow" 
                                        class="dropdown-item">
                                        <svg class="pc-icon"><use xlink:href="#custom-flash"></use></svg> 
                                        Edit
                                    </button>
        
                                    <!-- Col Delete Button -->
                                    <button 
                                        type="button" 
                                        name="btn-delete"
                                        id="delete_btn_col_${colId}"
                                        data-col-id="${colId}" 
                                        data-is-created="False"
                                        data-bs-toggle="modal" 
                                        data-bs-target="#removeComponent"
                                        class="dropdown-item">
                                        <i class="text-danger ti ti-x f-20 "></i>
                                        <span class="text-danger">Delete</span>
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>`);
        
            // Append the cloned draggable and card structure
            cardBody.appendTo(card);
            draggable.clone().appendTo(cardBody);
            card.find('img').css('width', '100%');
            card.appendTo(parentDiv);
        
            // Append the parent div to the droppable element
            parentDiv.appendTo(droppable);
        
            // Make the columns sortable within each row
            droppable.sortable({
                items: '.row-col',
                placeholder: "ui-state-highlight",
            }).disableSelection();
        };
        
        // Apply droppable to the row container
        $('#droppable2').droppable({
            accept: "[name='row']",
            drop: async function (event, ui) {
                let droppable = $(this); // Get droppable element
                let [rowId, rank] = await handleRowCreated(); // Get row id from backend
        
                if (rowId) {
                    let parentDiv = $(`
                        <div name="row" id="${rowId}" data-rank="${rank}" class="row justify-content-start p-5 border mt-1 rounded-3 ui-droppable ui-sortable ui-draggable ui-draggable-handle">
                            
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <small id="rank-text-${rowId}" class="mb-0">rank - ${rank}</small>
                                <div class="dropdown">
                                    <a class="avtar avtar-s btn-link-secondary dropdown-toggle arrow-none" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="ti ti-dots-vertical f-18"></i>
                                    </a>
                                    <div class="dropdown-menu dropdown-menu-end">
                                        <button 
                                           class="dropdown-item" 
                                           name="btn-style-row" 
                                           data-bs-toggle="modal" 
                                           data-bs-target="#modalRowStyle"
                                           data-row-id="${rowId}"
                                           data-row-style="justify-content-start"
                                           >Style
                                        </button>
                                        <button 
                                            class="dropdown-item" 
                                            name="btn-rank-row" 
                                            data-bs-toggle="modal" 
                                            data-bs-target="#modalRowRank"
                                            data-row-id="${rowId}"
                                            data-row-rank="${rank}"
                                            >Edit row
                                        </button>
                                        <button 
                                            class="dropdown-item text-danger" 
                                            name="btn-delete-row" 
                                            data-bs-toggle="modal" 
                                            data-bs-target="#removeRow"
                                            data-row-id="${rowId}"
                                            >Delete
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <h5>Drop Here</h5>
                        </div>`);
                    parentDiv.appendTo(droppable);
                } else {
                    console.error("Failed to get ID");
                }
            }
        });
        
        $(document).on('drop', '[name="row"]', function(event, ui) {
            handleAfterDropped(event, ui);
        });
        
        $(document).on('mouseenter', '[name="row"]', function() {
            if (!$(this).data("droppable")) {
                $(this).droppable({
                    accept: "[name='component']"
                });
            }
        });
        


    // Event delegation to handle dynamically added elements
    $(document).on('click', "[name='btn-edit']", function () {
        let isMultiple = $(this).data('isMultiple');
        let isRange = $(this).data('isRange');
        let isCountry = $(this).data('isCountry') == 'True' ? true : false;
        let colId = $(this).attr('id');
        let hasTitle = $(this).data('hasTitle') == 'True' ? true : false
        let hasDescription = $(this).data('hasDescription') == 'True' ? true : false
        let isSingleYear = $(this).data('isSingleYear') == 'True' ? true : false
        let hasIndicator = $(this).data('hasIndicator') == 'True' ? true : false
        let hasIcon = $(this).data('hasIcon') == 'True' ? true : false
        let isCustom = $(this).data('isCustom') == 'True' ? true : false
        let isImageComponent = $(this).data('isImageComponent') == 'True' ? true : false




        //handle form type
        if (isRange === 'True') {
            $("#id_year").removeAttr('required').parent().hide();
            $("#id_data_range_start").attr('required', true).parent().show();
            $("#id_data_range_end").attr('required', true).parent().show();
        } else {
            $("#id_year").attr('required', true).parent().show();
            $("#id_data_range_start").removeAttr('required').parent().hide();
            $("#id_data_range_end").removeAttr('required').parent().hide();
        }
        

        // Show or hide the title field based on hasTitle
        hasTitle 
        ? $("#id_title").show().attr('required', true).prev().show()
        : $("#id_title").removeAttr('required').hide().prev().hide();
        
        // Show or hide the description field based on hasDescription
        hasDescription 
        ? $("#id_description").attr('required', true).show().prev().show()
        : $("#id_description").removeAttr('required').hide().prev().hide();
        
        // Show or hide the year field based on isSingleYear
        isSingleYear 
        ? $("#id_year").show().attr('required', true).prev().show()
        : $("#id_year").removeAttr('required').hide().prev().hide();
        
        // Show or hide the indicator field based on hasIndicator
        hasIndicator 
        ? $("#id_indicator").show().prev().show()
            : $("#id_indicator").hide().prev().hide();
        
        // Show or hide the icon field based on hasIcon
        hasIcon 
        ? $("#id_icon").show().attr('required', true).prev().show()
        : $("#id_icon").removeAttr('required').hide().prev().hide();
        
        isCustom
            ? $("#id_custom_value").show().attr('required', true).prev().show()
            : $("#id_custom_value").removeAttr('required').hide().prev().hide();
        
        isImageComponent
            ? $("#id_image").show().attr('required', true).prev().show()
            : $("#id_image").removeAttr('required').hide().prev().hide();
        
        // Show or hide the country Lists field based on hasCountry
        if (!isCountry) {
            $("#id_addis_ababa").removeAttr('required').hide().prev().hide();
            $("#id_tigray").removeAttr('required').hide().prev().hide();
            $("#id_amhara").removeAttr('required').hide().prev().hide();
            $("#id_oromia").removeAttr('required').hide().prev().hide();
            $("#id_somali").removeAttr('required').hide().prev().hide();
            $("#id_afar").removeAttr('required').hide().prev().hide();
            $("#id_benshangul_gumuz").removeAttr('required').hide().prev().hide();
            $("#id_dire_dawa").removeAttr('required').hide().prev().hide();
            $("#id_gambella").removeAttr('required').hide().prev().hide();
            $("#id_snnp").removeAttr('required').hide().prev().hide();
            $("#id_harari").removeAttr('required').hide().prev().hide();
        } else {
            $("#id_addis_ababa").show().attr('required', true).prev().show()
            $("#id_tigray").show().attr('required', true).prev().show()
            $("#id_amhara").show().attr('required', true).prev().show()
            $("#id_oromia").show().attr('required', true).prev().show()
            $("#id_somali").show().attr('required', true).prev().show()
            $("#id_afar").show().attr('required', true).prev().show()
            $("#id_benshangul_gumuz").show().attr('required', true).prev().show()
            $("#id_dire_dawa").show().attr('required', true).prev().show()
            $("#id_gambella").show().attr('required', true).prev().show()
            $("#id_snnp").show().attr('required', true).prev().show()
            $("#id_harari").show().attr('required', true).prev().show()
        }
        
        
        let isMultipleSelect = isMultiple == 'True' ? true : false; // Set your condition here

        if (multipleCancelButton) {
            multipleCancelButton.destroy();
        }

        if (isMultipleSelect) {
            $("#form-configuration").trigger("reset");
            $('#id_indicator').attr('multiple', 'multiple').addClass('form-select');


        } else {
            $("#form-configuration").trigger("reset");
            $('#id_indicator').removeAttr('multiple').addClass('form-select');
            
        }

        //activate multi select with search
        multipleCancelButton = new Choices('#id_indicator', {
            removeItemButton: true,
            searchResultLimit: 10,
            shouldSort: false,  // Optional: Disable sorting if needed
        });

        const choicesContainer = document.querySelector('.choices');
        if (choicesContainer) {
            // Set your custom ID
            choicesContainer.id = 'id_indicator_search';
        }

        hasIndicator 
        ? $("#id_indicator_search").show().prev().show()
        : $("#id_indicator_search").hide().prev().hide();


        //assign value to form
        $("#form_col_id").val(colId);

        //assign form value if exist
        let colIndicatorId = $(this).data('colIndicatorId') || null;
        let colYearId = $(this).data('colYearId') || null;
        let colWidth = $(this).data('colWidth') || null;
        let colTitle = $(this).data('colTitle') || null;
        let colDescription = $(this).data('colDescription') || null;
        let colDataRangeStart = $(this).data('colDataRangeStart') || null;
        let colDataRangeEnd = $(this).data('colDataRangeEnd') || null;
        let colRank = $(this).data('colRank') || 0;
        let colCustomValue = $(this).data('colCustomValue') || null;

        

        let addisAbaba = $(this).data('colAddisAbaba') || null;
        let tigray = $(this).data('colTigray') || null;
        let amhara = $(this).data('colAmhara') || null;
        let oromia = $(this).data('colOromia') || null;
        let somali = $(this).data('colSomali') || null;
        let afar = $(this).data('colAfar') || null;
        let benshangulGumuz = $(this).data('colBenshangulGumuz') || null;
        let direDawa = $(this).data('colDireDawa') || null;
        let gambella = $(this).data('colGambella') || null;
        let snnp = $(this).data('colSnnp') || null;
        let harari = $(this).data('colHarari') || null;

        

        //assign selected item for select option 
        if(Array.isArray(colIndicatorId)){
            multipleCancelButton.removeActiveItems(); //clear selected item first 
            colIndicatorId?.forEach((item) =>{
                multipleCancelButton.setChoiceByValue(item.toString());
            })
        }else if(colIndicatorId){
            multipleCancelButton.removeActiveItems(); //clear selected item first 
            multipleCancelButton.setChoiceByValue(colIndicatorId);
        }else{
            multipleCancelButton.removeActiveItems();
        }

        $("#id_indicator").val(colIndicatorId)
        $("#id_year").val(colYearId);
        $("#id_width").val(colWidth);
        $("#id_title").val(colTitle);
        $("#id_description").val(colDescription);
        $("#id_data_range_start").val(colDataRangeStart);
        $("#id_data_range_end").val(colDataRangeEnd);
        $("#id_rank").val(colRank != 'None' ? Number(colRank) : 0)
        $("#id_custom_value").val(colCustomValue);


        $("#id_addis_ababa").val(addisAbaba);
        $("#id_tigray").val(tigray);
        $("#id_amhara").val(amhara);
        $("#id_oromia").val(oromia);
        $("#id_somali").val(somali);
        $("#id_afar").val(afar);
        $("#id_benshangul_gumuz").val(benshangulGumuz);
        $("#id_dire_dawa").val(direDawa);
        $("#id_gambella").val(gambella);
        $("#id_snnp").val(snnp);
        $("#id_harari").val(harari);

    });

    //handle on component remove 
    $(document).on('click', "[name='btn-delete']", function () {
        const colID = $(this).data('colId')
        const isCreated = $(this).data('isCreated')
        $('#delete_input_col_id').val(colID)
        $(`#delete_input_id_created`).val(isCreated)
    });


    //handle on row remove
    $(document).on('click', '[name="btn-delete-row"]', function (){
        const rowId = $(this).data('rowId')
        $("#delete_row_id").val(rowId)
    })

    //handle on row rank clicked
    $(document).on('click', '[name="btn-rank-row"]', function (){
        const rowId = $(this).attr('data-row-id'); 
        const rowRank = $(this).attr('data-row-rank'); 

        $("#row_rank_input").val(rowRank)
        $("#row_rank_input_row_id").val(rowId)
    })

    //handle on row style clicked
    $(document).on('click', '[name="btn-style-row"]', function (){
        const rowId = $(this).attr('data-row-id'); 
        const rowStyle = $(this).attr('data-row-style'); 

        $("#id_style").val(rowStyle)
        $("#row_row_input_row_id").val(rowId)
    })



});
})
