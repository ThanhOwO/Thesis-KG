import sys
import json
import re
from bert import Ner

def main():
        model = Ner("./out_base")
        text = sys.argv[1].lower()
        # List of words to be deleted
        with open('./stopwords_en.txt', 'r') as file:
            content = file.read()
        stopwords = [word.strip() for word in content.split(',')]
        # List of words to be replaced
        replace_words = [","]

        # Check if the first word is 'In'
        start_delete_words = ["in", "did", "is", "am", "are", "was", "were", 'a']

        # Check if the first word is in the start_delete_words list
        if text.split(' ', 1)[0] in start_delete_words:
        # Remove the first word
            text = text.split(' ', 1)[1]

        # Iterate over the delete_words list and replace each word with an empty string
        for word in stopwords:
            text = re.sub(r'\b{}\b'.format(re.escape(word)), '', text)

        # Iterate over the replace_words list and replace each word with ','
        for word in replace_words:
            text = text.replace(word, " and")

        output = model.predict(text)
        phrases = []
        current_tag = None
        current_phrase = []
        for word_info in output:
            tag = word_info['tag']
            word = word_info['word']
    
            if tag.startswith('B-'):
                if current_phrase:
                    phrases.append({'label': current_tag[2:], 'text': ' '.join(current_phrase)})
                    current_phrase = []
        
                current_tag = tag
                current_phrase.append(word)
            elif current_tag and (tag == f"I-{current_tag.split('-')[-1]}" or tag == current_tag):
                current_phrase.append(word)
            else:
                if current_phrase:
                    phrases.append({'label': current_tag[2:], 'text': ' '.join(current_phrase)})
                    current_phrase = []
                    current_tag = None
                if tag.startswith('B-'):
                    current_tag = tag
                    current_phrase.append(word)
            # Adding the last phrase
        if current_phrase:
            phrases.append({'text': ' '.join(current_phrase), 'label': current_tag[2:]})
        # Display the output in a JSON-like format
        if not phrases:
            phrases = [{'label': 'O', 'text': ''}]
        print(json.dumps(phrases))

if __name__ == "__main__":
    main()