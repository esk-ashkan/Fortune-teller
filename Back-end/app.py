from flask import Flask 
from flask_cors import CORS 
import os 
from dotenv import load_dotenv 
 
load_dotenv() 
 
app = Flask(__name__) 
CORS(app) 
 
@app.route('/') 
def home(): 
    return "Fortune Teller Backend is running!" 
 
@app.route('/health') 
def health(): 
    return {"status": "ok"} 
 
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=5000, debug=True)

