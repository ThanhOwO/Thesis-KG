import requests
from bs4 import BeautifulSoup
from underthesea import sent_tokenize
from vncorenlp import VnCoreNLP
import sys
import json
import logging
from transformers import AutoTokenizer, AutoModel
import torch
from statistics import mean
from sklearn.metrics.pairwise import cosine_similarity

# Load VnCoreNLP model outside the loop
vncorenlp_model = VnCoreNLP("./vncorenlp/VnCoreNLP-1.2.jar", annotators="wseg", max_heap_size='-Xmx2g')

# Load PhoBERT model outside the loop
phobert_model = AutoModel.from_pretrained("./phobert_model")
phobert_tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")

def load_vncorenlp_model():
    return vncorenlp_model

def load_phobert_model():
    return phobert_model, phobert_tokenizer

def get_phobert_embedding(text):
    tokens = phobert_tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        outputs = phobert_model(**tokens)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

def extract_words_from_annotation(annotation):
    sentences = annotation['sentences']
    result_sentences = []
    for sentence in sentences:
        words = [word['form'] for word in sentence]
        result_sentences.append(words)
    return result_sentences

def main():
    try:
        urls = sys.argv[1].split(',')
        original_keyword = sys.argv[2]
        chatbot_res = sys.argv[3]
        web_contents = []
        result_annotations = []

        try:
            for url in urls:
                response = requests.get(url)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    paragraphs = [p.get_text() for p in soup.find_all('p')]
                    clean_content = ' '.join(paragraphs)
                    web_contents.append(clean_content)
                else:
                    web_contents.append("error")
                    logging.error(f"Error fetching content from {url}. Status code: {response.status_code}")
        except Exception as e:
            web_contents.append("error")
            logging.error(f"Error fetching content from {url}: {e}")

        # Bước 2: Trích xuất 5 câu chứa từ khóa từ mỗi trang web
        lowercase_keyword = original_keyword.lower()

        for content in web_contents:
            if content == "error":
                # Thay thế câu trích xuất bị lỗi bằng từ "error"
                keyword_sentences = ["error"] * 5
            else:
                sentences = sent_tokenize(content)
                keyword_sentences = [sentence for sentence in sentences if lowercase_keyword in sentence.lower()][:5]

            # Annotate từng câu
            annotations = []
            for sentence in keyword_sentences:
                annotation = load_vncorenlp_model().annotate(sentence)
                annotations.append(annotation)

            result_annotations.append(annotations)

        # Câu trả lời của chat bot
        ws_chatbot_res_annotation = load_vncorenlp_model().annotate(chatbot_res)

        # Trích xuất từ từ kết quả annotate của câu trả lời
        ws_chatbot_res_words = extract_words_from_annotation(ws_chatbot_res_annotation)

        # Bước 4: Tính toán điểm tương đồng và xếp hạng trang web
        phobert_chatbot_res_embedding = get_phobert_embedding(' '.join(ws_chatbot_res_words[0]))

        # Chứa điểm tương đồng cho từng trang web
        web_similarity_scores = []

        # Tính cosine similarity cho từng câu của mỗi trang web
        for i, (url, annotations) in enumerate(zip(urls, result_annotations)):
            web_scores = []
            for j, annotation in enumerate(annotations):
                # Trích xuất từ từ kết quả annotate của câu trang web
                web_words = extract_words_from_annotation(annotation)
                # Biểu diễn vector cho câu từ trang web
                web_sentence_embedding = get_phobert_embedding(' '.join(web_words[0]))
                # Tính cosine similarity
                similarity_score = cosine_similarity([phobert_chatbot_res_embedding], [web_sentence_embedding])[0][0]

                web_scores.append(similarity_score)

            # Tính trung bình điểm cho trang web hiện tại
            web_average_score = mean(web_scores)
            web_similarity_scores.append((url, web_average_score))

        # Xếp hạng trang web dựa trên điểm trung bình
        sorted_web_scores = sorted(web_similarity_scores, key=lambda x: x[1], reverse=True)

        # Convert NumPy float32 to native Python float
        sorted_web_scores = [(url, score.item()) for url, score in sorted_web_scores]

        # Organize the ranking information
        ranking_info = [{"url": url, "relevant score": score} for url, score in sorted_web_scores]

        # Print the result as JSON for API call
        print(json.dumps({"web_ranking": ranking_info}, indent=2))

    except Exception as e:
        logging.error(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
