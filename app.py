from flask import Flask, request, jsonify, render_template, session
import numpy as np
import nltk
from nltk.corpus import wordnet, stopwords
from nltk.tokenize import word_tokenize
from nltk import pos_tag
import spacy
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer
from collections import Counter
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
print(os.urandom(24).hex())



ambiguous_words = []

nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

nlp = spacy.load("models/en_core_web_md/en_core_web_md-3.7.1")
model = SentenceTransformer('all-MiniLM-L6-v2')

def convert_numpy_floats(obj):
    if isinstance(obj, np.float32):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_numpy_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_floats(v) for v in obj]
    return obj

@app.route('/')
def home():
    return render_template('index.html')

def calculate_word_similarities(ambiguous_words, ambiguous_dict, abstract_embedding):
    for word, data in ambiguous_dict.items():
        definitions = data['definitions']
        definition_similarities = []
        for definition in definitions:
            definition_embedding = embed_sentence(definition)
            print(f"Abstract embedding shape: {abstract_embedding.shape}, Definition embedding shape: {definition_embedding.shape}")
            similarity = cosine_similarity(abstract_embedding.reshape(1, -1), definition_embedding.reshape(1, -1))[0][0]
            definition_similarities.append(similarity)
        data['definition_similarities'] = definition_similarities

@app.route('/process_abstract', methods=['POST'])
def process_abstract():
    data = request.json
    abstract = data.get('abstract')
    if not abstract:
        return jsonify({"error": "No abstract provided"}), 400

    processed_abstract, word_frequency_counts = preprocess_text(abstract)
    
    # Try with a higher frequency first
    ambiguous_words, ambiguous_dict = extract_ambiguous_words(processed_abstract, word_frequency_counts, min_frequency=2)
    abstract_embedding = embed_sentence(abstract)
    
    # If not enough ambiguous words, include words with frequency of 1
    if len(ambiguous_words) < 15:
        _, ambiguous_dict_low_freq = extract_ambiguous_words(processed_abstract, word_frequency_counts, min_frequency=1)
        # Update ambiguous_dict to include or update entries from ambiguous_dict_low_freq
        for word, data in ambiguous_dict_low_freq.items():
            if word in ambiguous_dict:
                # If already exists, ensure the data (definitions, similarities) are updated if necessary
                # This is more relevant if the logic for processing low frequency words differs
                pass 
            else:
                ambiguous_dict[word] = data

    # Calculate similarities for all selected ambiguous words
    calculate_word_similarities(list(ambiguous_dict.keys()), ambiguous_dict, abstract_embedding)

    # Sort ambiguous words based on similarity and frequency
    sorted_ambiguous_words = sort_ambiguous_words(list(ambiguous_dict.keys()), ambiguous_dict, word_frequency_counts)

    # Prepare result, limiting to top 15
    result_ready_for_json = convert_numpy_floats({
        "ambiguousWords": sorted_ambiguous_words[:15],
        "ambiguousDict": {word: ambiguous_dict[word] for word in sorted_ambiguous_words[:15]}
    })

    session['ambiguous_words'] = ambiguous_words


    return jsonify(result_ready_for_json)


def sort_ambiguous_words(ambiguous_words, ambiguous_dict, word_frequency_counts):
    print("Before sorting:")
    for word in ambiguous_words:
        print(f"Word: {word}, Frequency: {word_frequency_counts[word]}, Max Similarity: {max(ambiguous_dict[word]['definition_similarities'])}")

    sorted_words = sorted(ambiguous_words, key=lambda word: (-word_frequency_counts[word], -max(ambiguous_dict[word]['definition_similarities'] if ambiguous_dict[word]['definition_similarities'] else [0])))

    print("After sorting:")
    for word in sorted_words:
        print(f"Word: {word}, Frequency: {word_frequency_counts[word]}, Max Similarity: {max(ambiguous_dict[word]['definition_similarities'])}")

    return sorted_words





@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/process_sentence', methods=['POST'])
def process_sentence():
    data = request.json
    sentence = data.get('sentence')
    if not sentence:
        return jsonify({"error": "No sentence provided"}), 400

    # Retrieve from session or equivalent storage
    ambiguous_words = session.get('ambiguous_words', [])
    if not ambiguous_words:
        return jsonify({"error": "Ambiguous words not found. Process abstract first."}), 400

    keywords = extract_keywords([sentence], top_n=5)    
    similarity_results = calculate_keyword_similarities(keywords, ambiguous_words)
    similarity_results_ready_for_json = convert_numpy_floats(similarity_results)
    return jsonify({"similarityResults": similarity_results_ready_for_json})



def extract_keywords(sentences, top_n=5):
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(sentences)
    sorted_indices = tfidf_matrix.sum(axis=0).argsort()[0, ::-1].tolist()[0][:top_n]
    keywords = [vectorizer.get_feature_names_out()[index] for index in sorted_indices]
    return keywords


def preprocess_text(text):
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(text.lower())
    filtered_words = [word for word in words if word not in stop_words and word.isalnum()]
    word_frequency_counts = Counter(filtered_words)
    return filtered_words, word_frequency_counts


def extract_ambiguous_words(words, word_frequency_counts, min_frequency=2):
    ambiguous_words = []
    ambiguous_dict = {}
    # Adjust excluded_tags as needed
    excluded_tags = {'DT', 'CC', 'RB', 'PRP', 'PRP$', 'IN', 'TO', 'MD', 'UH', 'EX', 'PDT', 'WDT', 'WP', 'WP$', 'WRB'}

    for word, tag in pos_tag(words):
        frequency = word_frequency_counts.get(word, 0)
        if frequency >= min_frequency:
            synsets = wordnet.synsets(word)
            if tag[:2] not in excluded_tags and len(synsets) > 1 and not any(s.pos() == 'v' for s in synsets):
                ambiguous_words.append(word)
                ambiguous_dict[word] = {
                    "definitions": [synset.definition() for synset in synsets[:3]],
                    "frequency": frequency,
                }
    return ambiguous_words, ambiguous_dict



def embed_sentence(sentence):
    # Encoding the sentence to get the embedding
    embedding = model.encode([sentence], convert_to_tensor=True)
    # Ensuring the embedding is 2D: (1, number_of_features)
    embedding = embedding.reshape(1, -1)
    return embedding


def calculate_similarity(embedding1, embedding2):
    return cosine_similarity([embedding1], [embedding2])[0][0]

def process_final_words(ambiguous_words, word_similarity_scores, word_frequency_counts, ambiguous_dict):
    final_words = {}
    for word in set(ambiguous_words):
        if word.endswith('s') and word[:-1] in ambiguous_words:
            singular = word[:-1]
            plural = word
            selected_word = singular if word_frequency_counts.get(singular, 0) >= word_frequency_counts.get(plural, 0) else plural
        else:
            selected_word = word
        final_words[selected_word] = word_similarity_scores[selected_word]

    sorted_ambiguous_words = sorted(final_words.keys(), key=lambda x: (final_words[x], -word_frequency_counts[x]), reverse=True)
    return final_words, sorted_ambiguous_words

def calculate_keyword_similarities(keywords, ambiguous_words):
    print(f"Calculating similarities for keywords: {keywords}")
    print(f"Using ambiguous words: {ambiguous_words}")
    similarity_results = {}
    for keyword in keywords:
        keyword_embedding = embed_sentence(keyword)
        similarity_scores = {}
        for ambiguous_word in ambiguous_words:
            ambiguous_word_embedding = embed_sentence(ambiguous_word)
            similarity = cosine_similarity(keyword_embedding.reshape(1, -1), ambiguous_word_embedding.reshape(1, -1))[0][0]
            similarity_scores[ambiguous_word] = similarity
            print(f"Similarity between '{keyword}' and '{ambiguous_word}': {similarity}")
        similarity_results[keyword] = similarity_scores
    print(f"Similarity results: {similarity_results}")
    return similarity_results



if __name__ == "__main__":
    app.run(debug=True)
