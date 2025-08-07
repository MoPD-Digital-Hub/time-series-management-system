// Function to update category information
let updateCategory = () => {
  // Fetch category data from the server
  fetch("/user-admin/json-filter-catagory")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Get all elements with the name "EditCategory""
       let btnEditCategory = document.querySelectorAll("[name='EditCategory']");

      // Add click event listener to each "EditCategory" button
      btnEditCategory.forEach((editCategory) => {
        editCategory.addEventListener("click", () => {
          // Extract category ID from the button's ID attribute
          let categoryId = editCategory.id;

          // Select relevant form elements using jQuery
          let nameEnglish = $("#form_catagory_edit #id_name_ENG");
          let nameAmharic = $("#form_catagory_edit #id_name_AMH");
          let topic = $("#form_catagory_edit #id_topic");

          // Clear form fields before populating
          nameEnglish.val('');
          nameAmharic.val('');
          topic.val('').trigger("change");  // Clear and trigger change for Select2

          // Find the selected category in the fetched data
          let selectedCategory = data.categories.find(
            (cat) => String(cat.id) === String(categoryId)
          );

          // Check if all necessary elements and data are available
          if (nameEnglish && nameAmharic && topic && selectedCategory) {
            // Populate form fields with selected category data
            nameEnglish.val(selectedCategory.name_ENG);
            nameAmharic.val(selectedCategory.name_AMH);
            topic.val(selectedCategory.topic_id).trigger("change");  // Trigger change for Select2

            // Set the category ID in a hidden field for form submission
            $("#id_catagory_id").val(categoryId);
          } else {
            console.error(
              "Error: Could not find elements or selected category."
            );
          }
        });
      });
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
};
// Call the function when the document is ready
document.addEventListener("DOMContentLoaded", updateCategory);

// Function to update topic information
let updateTopic = () => {
  // Fetch topic data from the server
  fetch("/user-admin/json-filter-topic/")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Get all elements with the name "Edittopic"
      let btnEdittopic = document.getElementsByName("Edittopic");

      // Add click event listener to each "Edittopic" button
      btnEdittopic.forEach((edittopic) => {
        edittopic.addEventListener("click", () => {
          // Extract topic ID from the button's ID attribute
          let topicId = edittopic.id;

          // Select relevant form elements using jQuery
          let titleEnglish = $("form[name='topicFormValue'] #id_title_ENG");
          let titleAmharic = $("form[name='topicFormValue'] #id_title_AMH");

          // Find the selected topic in the fetched data
          let selectedTopic = data.topics.find(
            (topic) => String(topic_id) === String(topicId)
          );
          console.log(selectedTopic)

          // Check if all necessary elements and data are available
          if (titleEnglish && titleAmharic && selectedTopic) {
            // Populate form fields with selected topic data
            titleEnglish.val(selectedTopic.title_ENG);
            titleAmharic.val(selectedTopic.title_AMH);

            // Set the topic ID in a hidden field for form submission
            $("#id_topic_id").val(topicId);
            
          } else {
            console.error("Error: Could not find elements or selected topic.");
          }
        });
      });
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
};

// Call the function when the document is ready
document.addEventListener("DOMContentLoaded", updateTopic);

// Function to update source information
let updateSource = () => {
  console.log("called");
  fetch("/user-admin/json-filter-source/")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Get all elements with the name "EditSource"
      let btnEditSource = document.getElementsByName("EditSource");
      btnEditSource.forEach((editSource) => {
        editSource.addEventListener("click", () => {
            let sourceID = editSource.id;

            let titleEnglish = $("#form_Source_edit #id_title_ENG");
            let titleAmharic = $("#form_Source_edit #id_title_AMH");
            let sourceIdInput = $("#form_Source_edit #id_source_id");

            let selectedSource = data.sources.find(
                (source) => String(source.id) === String(sourceID)
            );

            if (titleEnglish && titleAmharic && sourceIdInput && selectedSource) {
                titleEnglish.val(selectedSource.title_ENG);
                titleAmharic.val(selectedSource.title_AMH);
                sourceIdInput.val(sourceID);

                $("#editModalSource").modal("show");
            } else {
                console.error("Error: Could not find elements or selected source.");
            }
        });
      });
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
};

// Call the function when the document is ready
document.addEventListener("DOMContentLoaded", updateSource);

let btndeletecatagory = () =>{
        //remove catagory
        let btnDelete = document.getElementsByName("catgorydelete");
        btnDelete.forEach((deleteCatagory)=>{
          deleteCatagory.addEventListener('click', ()=>{
            let approveAnchor = document.getElementById('forRemoveCatagory')
            approveAnchor.setAttribute('href', `/user-admin/category-delete/${deleteCatagory.id}`)
          })
        })
}

// Call the function when the document is ready
document.addEventListener("DOMContentLoaded", btndeletecatagory);

let btndeletetopic = () =>{
      //remove topic
      let btnDelete = document.getElementsByName("topicDelete");
      btnDelete.forEach((deleteTopic)=>{
        deleteTopic.addEventListener('click', ()=>{
          let approveAnchor = document.getElementById('forRemoveTopic')
          approveAnchor.setAttribute('href', `/user-admin/topic-delete/${deleteTopic.id}`)
        })
      })
    }
  // Call the function when the document is ready
document.addEventListener("DOMContentLoaded", btndeletetopic);


let btndeletesource = () =>{
      //remove source
      let btnDelete = document.getElementsByName("deleteSource");
      btnDelete.forEach((deletsource)=>{
        deletsource.addEventListener('click', ()=>{
          let approveAnchor = document.getElementById('forRemoveSource')
          console.log(deletsource.id)
          approveAnchor.setAttribute('href', `/user-admin/source-delete/${deletsource.id}`)
        })
      })
    }

// Call the function when the document is ready
document.addEventListener("DOMContentLoaded", btndeletesource);

let parentContainer = document.querySelector("#table-contain");

//Call After table paginator is Changed
parentContainer.addEventListener("click", (event) => {
  //Check Table is Changed
  updateTopic();
  updateCategory();
  updateSource();
  btndeletecatagory();
  btndeletetopic();
  btndeletesource();
});
