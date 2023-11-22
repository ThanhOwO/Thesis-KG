import sys
import json
from bert import Ner

def main():
        model = Ner("./out_base")
        text = sys.argv[1]
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