import sys
import requests
from bs4 import BeautifulSoup
import json

# Function to extract relevant sentences
def extract_relevant_sentences(paragraph, keywords, max_sentences=2):
    sentences = paragraph.split('.')
    relevant_sentences = []
    for sentence in sentences:
        if len(relevant_sentences) >= max_sentences:
            break
        if any(keyword.lower() in sentence.lower() for keyword in keywords):
            relevant_sentences.append(sentence.strip())
    return relevant_sentences

def extract_information(url, keywords, max_sentences=2):
    try:
        response = requests.get(url)

        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')

            title = soup.title.text.strip()
            paragraphs = soup.find_all("p")

            relevant_sentences = []  # Store the relevant sentences

            for paragraph in paragraphs:
                # Check if the paragraph contains any of the keywords
                if any(keyword.lower() in paragraph.text.lower() for keyword in keywords):
                    sentences = extract_relevant_sentences(paragraph.text, keywords, max_sentences)
                    relevant_sentences.extend(sentences)
                    if len(relevant_sentences) >= max_sentences:
                        break  # Limit to 2 relevant sentences

            extracted_info = {
                "title": title,
                "relevant_sentences": relevant_sentences[:max_sentences]
            }

            return extracted_info

        else:
            print(f"Failed to fetch the website: {url}")
            return None

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None

if __name__ == "__main__":
    # Get command-line arguments (URLs and keywords)
    urls = sys.argv[1].split(',')
    keywords = sys.argv[2].split(',')

    extracted_information = []

    for url in urls:
        extracted_info = extract_information(url, keywords)
        if extracted_info:
            extracted_information.append(extracted_info)

    # Print the extracted information as JSON
    print(json.dumps(extracted_information))
