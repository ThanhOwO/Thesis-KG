import sys
import json
from bert import Ner

def main():
    try:
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
                    phrases.append({'text': ' '.join(current_phrase), 'label': current_tag[2:]})
                    current_phrase = []
                
                current_tag = tag
            if tag == f"I-{current_tag.split('-')[-1]}" or tag == current_tag:
                current_phrase.append(word)

        # Adding the last phrase
        if current_phrase:
            phrases.append({'text': ' '.join(current_phrase), 'label': current_tag[2:]})

        # Display the output in a JSON-like format
        print(json.dumps(phrases))

    except Exception as e:
        # If an exception occurs, print an empty array
        print(json.dumps(['']))

if __name__ == "__main__":
    main()
