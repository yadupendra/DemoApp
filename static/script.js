document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('abstractForm').onsubmit = async function(e) {
        e.preventDefault(); // Prevent the form from submitting the traditional way

        let abstract = document.getElementById('abstractText').value;
        let response = await fetch('/process_abstract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({abstract: abstract})
        });

        if (response.ok) {
            let result = await response.json();
            displayResults(result);
        } else {
            alert("Error processing abstract.");
        }
    };
    document.getElementById('sentenceForm').onsubmit = async function(e) {
        e.preventDefault();
    
        let sentence = document.getElementById('sentenceText').value;
        let response = await fetch('/process_sentence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({sentence: sentence})
        });
    
        if (response.ok) {
            let result = await response.json();
            displaySentenceAnalysis(result);
        } else {
            alert("Error analyzing sentence.");
        }
    };
    
    function displaySentenceAnalysis(data) {
        // Check if similarity results are available
        if (data.similarityResults && Object.keys(data.similarityResults).length > 0) {
            console.log('Similarity Results:', data.similarityResults);
            sessionStorage.setItem('resultsData', JSON.stringify(data));
            window.location.href = '/results';
        } else {
            console.error('No similarity results found.');
            // Handle the case where no similarity results are available
        }
    }
    
    

    function displayResults(data) {
        let resultsDiv = document.getElementById('results');
        console.log(data);
        resultsDiv.innerHTML = ''; // Clear previous content
    
        // Display ambiguous words and their definitions
        if (data.ambiguousWords && data.ambiguousDict) {
            let ambiguousContent = '<h2>Ambiguous Words and Definitions</h2>';
            data.ambiguousWords.forEach(word => {
                ambiguousContent += `<h3>${word}:</h3>`;
                ambiguousContent += '<ol>';
                data.ambiguousDict[word].forEach(meaning => {
                    ambiguousContent += `<li>${meaning}</li>`;
                });
                ambiguousContent += '</ol>';
            });
            resultsDiv.innerHTML += ambiguousContent;
        }
    
        // Show the similarity analysis section
        document.getElementById('sentenceAnalysisSection').style.display = 'block';
        // paginateTable(10); // example: 10 rows per page

    }

  
    
    
    // Get the button
let mybutton = document.getElementById("goTopBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}    
    
});
