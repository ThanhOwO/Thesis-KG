import requests
from bs4 import BeautifulSoup
from underthesea import sent_tokenize
from vncorenlp import VnCoreNLP
import sys
import json
import logging
from transformers import AutoTokenizer, AutoModel
import torch
import re
from sklearn.metrics.pairwise import cosine_similarity

# Load VnCoreNLP model
vncorenlp_model = VnCoreNLP("./vncorenlp/VnCoreNLP-1.2.jar", annotators="wseg", max_heap_size='-Xmx2g')

# Load PhoBERT model
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

def remove_unwanted_characters(text):
    unwanted_characters = r"[\(\);{}\[\]/'\"\\\-+=<>]"
    clean_text = re.sub(unwanted_characters, "", text)
    return clean_text

def main():
    try:
        urls = sys.argv[1].split(',')
        original_keyword = sys.argv[2].split(',')
        chatbot_res = sys.argv[3]
        web_contents = []
        result_annotations = []
        valid_urls = []

        for url in urls:
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    paragraphs = [p.get_text() for p in soup.find_all('p')]
                    clean_content = ' '.join(paragraphs)
                    web_contents.append(clean_content)
                    valid_urls.append(url)
                else:
                    logging.error(f"Error fetching content from {url}. Status code: {response.status_code}")
            except Exception as e:
                logging.error(f"Error fetching content from {url}: {e}")

        # Trích xuất câu chứa từ khóa từ mỗi trang web
        lowercase_keyword = [keyword.lower() for keyword in original_keyword]

        for content in web_contents:
            if not content:
                continue
            sentences = sent_tokenize(content)
            keyword_sentences = [sentence for sentence in sentences if all(keyword.lower() in sentence.lower() for keyword in lowercase_keyword)][:10]

            # Loại bỏ các ký tự không mong muốn từ câu
            cleaned_sentences = [remove_unwanted_characters(sentence) for sentence in keyword_sentences]

            # Annotate từng câu
            annotations = []
            for sentence in cleaned_sentences:
                annotation = load_vncorenlp_model().annotate(sentence)
                annotations.append(annotation)

            result_annotations.append(annotations)

        # Câu trả lời của chat bot
        ws_chatbot_res_annotation = load_vncorenlp_model().annotate(chatbot_res)

        # Trích xuất từ từ kết quả annotate của câu trả lời
        ws_chatbot_res_words = extract_words_from_annotation(ws_chatbot_res_annotation)

        # Tính điểm tương đồng và xếp hạng trang web
        phobert_chatbot_res_embedding = get_phobert_embedding(' '.join(ws_chatbot_res_words[0]))

        # Chứa điểm tương đồng cho từng trang web
        result_data = []

        for i, (url, annotations) in enumerate(zip(valid_urls, result_annotations)):
            highest_score = 0.0
            best_sentence = None

            for j, annotation in enumerate(annotations):
                # Trích xuất từ từ kết quả annotate của câu trang web
                web_words = extract_words_from_annotation(annotation)
                # Biểu diễn vector cho câu từ trang web
                web_sentence_embedding = get_phobert_embedding(' '.join(web_words[0])).astype(float)
                # Tính cosine similarity
                similarity_score = cosine_similarity([phobert_chatbot_res_embedding], [web_sentence_embedding])[0][0]

                # Kiểm tra nếu điểm tương đồng cao nhất
                if similarity_score > highest_score:
                    highest_score = similarity_score
                    best_sentence = ' '.join(web_words[0])

            # Tạo dictionary chứa thông tin về URL, câu có điểm cao nhất, và điểm tương đồng
            result_entry = {"url": url, "best_sentence": best_sentence, "similarity_score": highest_score}
            result_data.append(result_entry)

        # Sắp xếp danh sách kết quả theo giảm dần của điểm tương đồng
        sorted_result_data = sorted(result_data, key=lambda x: x["similarity_score"], reverse=True)
        # In ra kết quả dưới dạng JSON
        print(json.dumps({"web_results": sorted_result_data}, indent=2))

    except Exception as e:
        logging.error(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
