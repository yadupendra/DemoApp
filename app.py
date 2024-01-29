from flask import Flask, request, jsonify, render_template
import nltk
from nltk.corpus import wordnet
import spacy
from sklearn.metrics.pairwise import cosine_similarity
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer



app = Flask(__name__)

nltk.download('stopwords')
nltk.download('punkt')
nltk.download('wordnet')

# Initialize spaCy and Sentence Transformers
nlp = spacy.load("en_core_web_md")
model = SentenceTransformer('all-MiniLM-L6-v2')

ambiguous_words = []

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process_abstract', methods=['POST'])
def process_abstract():
    data = request.json
    abstract = data.get('abstract')
    if not abstract:
        return jsonify({"error": "No abstract provided"}), 400
    
    processed_abstract = preprocess_text(abstract)
    _, ambiguous_dict = extract_ambiguous_words(processed_abstract)

    global ambiguous_words
    ambiguous_words = list(ambiguous_dict.keys())

    abstract_embedding = embed_sentence(abstract)[0]    
    result = {
        "ambiguousWords": ambiguous_words,
        "ambiguousDict": ambiguous_dict,
        # More processing can be added here
    }
    
    return jsonify(result)

# More endpoints can be added here

@app.route('/process_similarity', methods=['POST'])
def process_similarity():
    data = request.json
    words = data.get('words', '').split()  # Splitting the input into individual words

    similarity_results = {}

    for word in words:
        word_embedding = embed_sentence(word)[0]
        similarity_scores = {}
        for ambiguous_word in ambiguous_words:  
            ambiguous_word_embedding = embed_sentence(ambiguous_word)[0]
            similarity_score = calculate_similarity(word_embedding, ambiguous_word_embedding)[0][0]
            similarity_scores[ambiguous_word] = float(similarity_score)
        similarity_results[word] = similarity_scores

    return jsonify({"similarityResults": similarity_results})



@app.route('/results')
def results():
    return render_template('results.html')


@app.route('/process_sentence', methods=['POST'])
def process_sentence():
    data = request.json
    sentence = data.get('sentence')
    if not sentence:
        return jsonify({"error": "No sentence provided"}), 400
    
    global ambiguous_words

    keywords = extract_keywords([sentence])

    similarity_results = {}

    # Placeholder for list of ambiguous words

    for keyword in keywords:
        keyword_embedding = embed_sentence(keyword)[0]
        similarity_scores = {}
        for ambiguous_word in ambiguous_words:
            ambiguous_word_embedding = embed_sentence(ambiguous_word)[0]
            similarity_score = calculate_similarity(keyword_embedding, ambiguous_word_embedding)[0][0]
            similarity_scores[ambiguous_word] = float(similarity_score)
            similarity_results[keyword] = similarity_scores  

    return jsonify({
        "keywords": keywords,
        "similarityResults": similarity_results
    })


# Preprocess text function
def preprocess_text(text):
    stop_words = set(stopwords.words('english'))
    words = nltk.word_tokenize(text)
    return [word for word in words if word.lower() not in stop_words]

# Extract ambiguous words function
def extract_ambiguous_words(words):
    ambiguous_words = []
    ambiguous_dict = {}
    for word in words:
        synsets = wordnet.synsets(word)
        if len(synsets) > 1:
            ambiguous_words.append(word)
            ambiguous_dict[word] = [synset.definition() for synset in synsets]
    return ambiguous_words, ambiguous_dict

# Embed a sentence
def embed_sentence(sentence):
    return model.encode([sentence])

# Extract keywords
def extract_keywords(sentences, top_n=5):
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(sentences)
    sorted_indices = tfidf_matrix.sum(axis=0).argsort()[0, ::-1].tolist()[0]
    keywords = [vectorizer.get_feature_names_out()[index] for index in sorted_indices[:top_n]]
    return keywords

# Calculate cosine similarity
def calculate_similarity(embedding1, embedding2):
    return cosine_similarity([embedding1], [embedding2])



if __name__ == "__main__":
    app.run(debug=True)
