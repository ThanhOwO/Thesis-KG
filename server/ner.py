import sys
import spacy
import json

def main():
    nlp = spacy.load("./model-last")
    text = sys.argv[1]
    doc = nlp(text)
    entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
    print(json.dumps(entities))

if __name__ == "__main__":
    main()
