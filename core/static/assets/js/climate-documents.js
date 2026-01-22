/**
 * Climate Documents - Documents Page Script
 */

document.addEventListener('DOMContentLoaded', function () {
    // Document Category Tabs
    let currentDocumentCategory = '';
    document.querySelectorAll('.document-category-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const categoryId = this.dataset.categoryId || '';

            // Update active tab
            document.querySelectorAll('.document-category-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            currentDocumentCategory = categoryId;
            filterDocuments();
        });
    });

    // Document Search
    const documentSearchInput = document.getElementById('document-search-input');

    function filterDocuments() {
        if (!documentSearchInput) return;

        const searchQuery = documentSearchInput.value.toLowerCase();
        const categoryId = currentDocumentCategory;
        const documents = document.querySelectorAll('.document-item');
        let visibleCount = 0;

        // Count documents per category
        const categoryCounts = {};
        documents.forEach(doc => {
            const docCategoryId = doc.dataset.categoryId || '';
            if (!categoryCounts[docCategoryId]) {
                categoryCounts[docCategoryId] = 0;
            }
            categoryCounts[docCategoryId]++;
        });

        // Update category counts
        document.querySelectorAll('.doc-category-count').forEach(countEl => {
            const catId = countEl.dataset.category;
            countEl.textContent = categoryCounts[catId] || 0;
        });

        // Filter documents
        documents.forEach(doc => {
            const docCategoryId = doc.dataset.categoryId || '';
            const docTitle = doc.textContent.toLowerCase();

            const matchesSearch = !searchQuery || docTitle.includes(searchQuery);
            const matchesCategory = !categoryId || docCategoryId === categoryId;

            if (matchesSearch && matchesCategory) {
                doc.style.display = '';
                visibleCount++;
            } else {
                doc.style.display = 'none';
            }
        });

        // Update total count
        const docCountEl = document.getElementById('document-count');
        if (docCountEl) docCountEl.textContent = visibleCount;

        const allDocsCountEl = document.getElementById('all-docs-count');
        if (allDocsCountEl) allDocsCountEl.textContent = documents.length;
    }

    if (documentSearchInput) {
        documentSearchInput.addEventListener('input', filterDocuments);
    }

    // Initialize document counts on page load
    filterDocuments();
});
