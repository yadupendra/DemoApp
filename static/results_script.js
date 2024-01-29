function paginateTable(rowsPerPage, tableId, paginationId) {
    const tableRows = document.querySelectorAll(`#${tableId} tbody tr`);
    const pageCount = Math.ceil(tableRows.length / rowsPerPage);
    const paginationDiv = document.getElementById(paginationId);

    // Use Bootstrap's pagination classes
    let paginationUl = document.createElement('ul');
    paginationUl.className = 'pagination';

    for (let i = 1; i <= pageCount; i++) {
        let pageLi = document.createElement('li');
        pageLi.className = 'page-item';

        let pageButton = document.createElement('a');
        pageButton.className = 'page-link';
        pageButton.href = '#';
        pageButton.innerText = i;

        pageButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            tableRows.forEach((row, index) => {
                row.style.display = (index >= (i - 1) * rowsPerPage && index < i * rowsPerPage) ? "" : "none";
            });

            // Update active class on buttons
            let currentActive = paginationUl.querySelector('.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            pageLi.classList.add('active');
        });

        pageLi.appendChild(pageButton);
        paginationUl.appendChild(pageLi);
    }

    paginationDiv.appendChild(paginationUl);

    // Initially display the first page and set the first page button as active
    tableRows.forEach((row, index) => {
        row.style.display = index < rowsPerPage ? "" : "none";
    });
    if (paginationUl.firstChild) {
        paginationUl.firstChild.classList.add('active');
    }
}


document.addEventListener('DOMContentLoaded', function () {
    function displaySimilarityResults(data) {
        let resultsDiv = document.getElementById('results');
        if (!resultsDiv) {
            // Not the right page, exit the function
            return;
        }
        resultsDiv.innerHTML = '<h2>Similarity Analysis Results</h2>';

        let tableIndex = 0;

        for (const [word, scores] of Object.entries(data.similarityResults)) {
            let content = `<h3>Word: ${word}</h3>`;
            let irrelevant = true;
            let sortedScores = [];

            for (const [ambiguousWord, score] of Object.entries(scores)) {
                sortedScores.push({ word: ambiguousWord, score });
                if (score >= 0.4) {
                    irrelevant = false;
                }
            }

            sortedScores.sort((a, b) => b.score - a.score);

            let tableId = `table-${tableIndex}`;
            let paginationId = `pagination-${tableIndex}`;
            let tableContent = `<table id="${tableId}" class="table table-hover table-bordered"><thead><tr><th>Similarity with Word</th><th>Similarity Value</th></tr></thead><tbody>`;
            for (const { word: ambiguousWord, score } of sortedScores) {
                tableContent += `<tr><td>${ambiguousWord}</td><td>${score.toFixed(2)}</td></tr>`;
            }
            tableContent += '</tbody></table>';

            if (irrelevant) {
                tableContent += `<p style="bold">This word is irrelevant as the highest similarity score is only ${sortedScores[0].score.toFixed(2)}</p>`;
            }

            // Create a container div for each table and its pagination
            let tableContainer = document.createElement('div');
            tableContainer.innerHTML = content + tableContent;
            resultsDiv.appendChild(tableContainer);

            // Create and append pagination div
            let paginationDiv = document.createElement('div');
            paginationDiv.id = paginationId;
            tableContainer.appendChild(paginationDiv);

            paginateTable(10, tableId, paginationId);

            tableIndex++;
        }}

    

    // Retrieve and display the results
    let similarityData = sessionStorage.getItem('resultsData');
    if (similarityData) {
        displaySimilarityResults(JSON.parse(similarityData));
    } else {
        console.error('No similarity data found.');
    }
});
