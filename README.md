# split-bill-app
cd backend
python -m venv venv
source venv/bin/activate
venv\Scripts\activate
pip install -r requirements.txt
pip freeze > requirements.txt

uvicorn app.main:app --reload 