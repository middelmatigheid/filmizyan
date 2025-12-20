FROM python:3.11.9

WORKDIR /filmizyan

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "-m", "uvicorn", "backend:api", "--host", "0.0.0.0", "--port",  "5000", "--reload"]
