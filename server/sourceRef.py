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
        urls = ["https://vi.wikipedia.org/wiki/Phở",
                "https://en.wikipedia.org/wiki/Pho",
                "https://foodelivietnam.com/nguon-goc-cua-pho-pho-bat-nguon-tu-dau.html",
                "https://vnexpress.net/pho-viet-duoc-vi-nhu-ban-giao-huong-huong-vi-4625542.html",
                "https://tuoitre.vn/pho-mon-an-khien-ta-phai-nhoc-long-20230926234819187.htm"]
        web_contents = []

        try:
            for url in urls:
                response = requests.get(url)
                soup = BeautifulSoup(response.text, 'html.parser')
                paragraphs = [p.get_text() for p in soup.find_all('p')]
                clean_content = ' '.join(paragraphs)
                web_contents.append(clean_content)
        except Exception as e:
            web_contents.append("")
            logging.error(f"Error fetching content from {url}: {e}")

        # Bước 2: Trích xuất 5 câu chứa từ khóa từ mỗi trang web
        original_keyword = "Phở"  # Replace with your original keyword
        lowercase_keyword = original_keyword.lower()
        result_annotations = []

        for content in web_contents:
            sentences = sent_tokenize(content)
            keyword_sentences = [sentence for sentence in sentences if lowercase_keyword in sentence.lower()][:5]

            # Annotate từng câu
            annotations = []
            for sentence in keyword_sentences:
                annotation = load_vncorenlp_model().annotate(sentence)
                annotations.append(annotation)

            result_annotations.append(annotations)

        # Câu trả lời của chat bot
        chatbot_res = "Đúng, Phở là món ăn truyền thống của Việt Nam và là đặc sản ở Nam Định."
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
            print(f"\nWeb {i + 1} ({url}):\n")
            for j, annotation in enumerate(annotations):
                # Trích xuất từ từ kết quả annotate của câu trang web
                web_words = extract_words_from_annotation(annotation)
                # Biểu diễn vector cho câu từ trang web
                web_sentence_embedding = get_phobert_embedding(' '.join(web_words[0]))
                # Tính cosine similarity
                similarity_score = cosine_similarity([phobert_chatbot_res_embedding], [web_sentence_embedding])[0][0]

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
        json_result = json.dumps({"web_ranking": ranking_info}, indent=2)
        print(json_result)

    except Exception as e:
        logging.error(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
