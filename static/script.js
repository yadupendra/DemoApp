console.log('Script loaded')
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('abstractForm').onsubmit = async function(e) {
        e.preventDefault(); // Prevent the form from submitting the traditional way

    const words = "absent, abstract, address, alternate, articulate, attribute, compound, content, contest, convert, decrease, defect, deliberate, desert, designate, digest, duplicate, escort, implement, incense, insert, invalid, leaded, minute, present, produce, progress, protest, readied, refuse, retreat, subject, torment, ultimate, accelerate, acknowledge, alternative, application, calculate, celebrate, commentary, communicate, concentrate, consequence, conservation, consideration, differentiate, disappointment, dissemination, documentation, cardiovascular, neurology, gastroenteritis, dermatological, endocrinologist, ophthalmologist, anesthesiologist, rheumatologist, orthopedic, urologist, establishment, exaggerate, explanation, inappropriate, intellectual, interpretation, intervention, investigate, manipulation, measurement, organization, participate, performance, perspective, preposterous, publication, recommendation, representative, responsibility, significant, solicitation, sophisticated, substantial, supplementation, transparency, transportation, unambiguous, unacceptable, underestimate, understand, uninterested, unorthodox, utilization, adapter, algorithm, bandwidth, browser, cache, database, encryption, firewall, framework, hardware, interface, malware, operating, peripheral, protocol, software, architecture, authentication, bytecode, client, component, configuration, console, controller, data, driver, functionality, middleware, parameter, password, platform, repository, resource, security, session, specification, system, vulnerability, absorb, acid, aerosol, aquatic, bacteria, biodiversity, carbon, climate, community, contamination, deforestation, ecology, ecosystem, emission, environment, erosion, evaporation, greenhouse, habitat, hydrology, invasive, landfill, migration, nitrogen, organism, ozone, particulate, pesticide, pollutant, pollution, precipitation, radiation, rainforest, recycling, renewable, sediment, species, sustainability, toxic, troposphere, wastewater, weather, wetland, abscess, anemia, biopsy, carcinoma, catheter, clinical, diagnosis, disorder, dose, estrogen, hormone, infection, inflammation, laboratory, lesion, medication, monitor, organ, palliate, parasite, pathology, patient, pharynx, placebo, prognosis, radiate, radiation, recurrence, remission, replicate, respiratory, response, sepsis, symptom, syndrome, therapy, transfusion, tumor, vaccine, vasectomy, vitamin, antibody, bacteria, cell, gene, organ, protein, tissue, virus";
    const wordsArray = words.split(', '); // Split into an array
    const homonymsDiv = document.getElementById('Homonyms');

    // Populate div with words as clickable spans
    wordsArray.forEach((word, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.textContent = word + (index < wordsArray.length - 1 ? ', ' : ''); // Add comma
        wordSpan.classList.add('word');
        wordSpan.setAttribute('data-toggle', 'tooltip');
        wordSpan.setAttribute('title', 'Click to copy');
        wordSpan.style.cursor = 'pointer';
        wordSpan.onclick = function() { copyAndPasteText(word); };
        homonymsDiv.appendChild(wordSpan);
    });

    // Initialize Bootstrap tooltips
    $('[data-toggle="tooltip"]').tooltip();

    const sentenceText = document.getElementById('sentenceText');
    
    // Function to "copy" text and paste it directly
    function copyAndPasteText(text) {
        sentenceText.value += text + ', '; // Append the clicked word with comma for readability
        $('[data-toggle="tooltip"]').tooltip('hide'); // Optionally hide the tooltip after click
    }

    document.getElementById('analyzeSentenceBtn').addEventListener('click', async function(e) {
        e.preventDefault(); // Prevent default button behavior
    
        // Show the spinner
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = 'inline-block';
    
        let sentence = document.getElementById('sentenceText').value;
    
        try {
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
        } catch (error) {
            console.error('Error:', error);
            alert("Failed to analyze the sentence.");
        } finally {
            // Hide the spinner regardless of the outcome
            spinner.style.display = 'none';
        }
    });
    
    


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

        let mybutton = document.getElementById("goTopBtn");
            if (mybutton) {
                mybutton.addEventListener('click', toggleScrollFunction);
    }
    window.onscroll = function() {scrollFunction()};

    function scrollFunction() {
        let scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (scrollTop > 20 && scrollTop < height - 20) {
            mybutton.style.display = "block"; // Show the button
        } else {
            mybutton.style.display = "none";
        }
        // Change button icon based on scroll position
        if (scrollTop < height / 2) { // If in the upper half of the page
            mybutton.innerHTML = '<i class="fas fa-arrow-down"></i>'; // Down arrow icon
            mybutton.title = "Go to bottom";
        } else { // If in the lower half
            mybutton.innerHTML = '<i class="fas fa-arrow-up"></i>'; // Up arrow icon
            mybutton.title = "Go to top";
        }
    }
    
    
    function toggleScrollFunction() {
        let scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (scrollTop < height / 2) {
            // If in the upper half, scroll to the bottom
            document.body.scrollTop = height;
            document.documentElement.scrollTop = height;
        } else {
            // If in the lower half, scroll to the top
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }
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
    
    // This ensures the textarea is explicitly scrollable, though it should be by default
    document.getElementById('homonymsText').style.overflowY = 'scroll';
    
    function displayResults(data) {
        let resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = ''; // Clear previous content
    
        if (data.ambiguousWords && data.ambiguousDict) {
            let ambiguousContent = '<h2>Ambiguous Words, Definitions, Similarity Scores, and Frequencies</h2>';
            console.log("Ambiguous words to display:", data.ambiguousWords);

            data.ambiguousWords.forEach(word => {
                let wordData = data.ambiguousDict[word];
                let frequency = wordData.frequency; // Access the frequency
                
                // Pair each definition with its similarity, then sort
                let definitionsWithSimilarity = wordData.definitions.map((definition, index) => {
                    return {
                        definition: definition,
                        similarity: wordData.definition_similarities[index] ? wordData.definition_similarities[index] : 0 // Ensure a similarity exists, default to 0
                    };
                });
    
                // Sort definitions by similarity from highest to lowest
                definitionsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    
                ambiguousContent += `<h3>${word} (Frequency: ${frequency}):</h3><ul>`;
                definitionsWithSimilarity.forEach(item => {
                    ambiguousContent += `<li>${item.definition} (Similarity: ${item.similarity.toFixed(4)})</li>`;
                });
                ambiguousContent += '</ul>';
            });
            resultsDiv.innerHTML += ambiguousContent;
        }
    
        document.getElementById('sentenceAnalysisSection').style.display = 'block';
    }
    
    
    
});
