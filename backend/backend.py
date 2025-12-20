from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

import app.database as db
import app.kinopoisk_api as kapi
from app.schemas import *
import app.password as pw
import app.email_sender as es

from contextlib import asynccontextmanager
from redis import Redis
import json

import jwt 
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

import os
from dotenv import load_dotenv
import logging

from datetime import datetime, timedelta, timezone
import re


load_dotenv()


# Configuring logging
# logging.basicConfig(level=logging.ERROR, filename="/logs/logging.log", filemode="a", format="%(asctime)s - %(levelname)s - %(filename)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S", encoding="utf-8")
logging.basicConfig(level=logging.ERROR, filename="../logs/logging.log", filemode="a", format="%(asctime)s - %(levelname)s - %(filename)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S", encoding="utf-8")
logging.getLogger("sqlalchemy").setLevel(logging.ERROR)
logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)
limiter = Limiter(key_func=get_remote_address)
# Initizaling api
@asynccontextmanager
async def lifespan(api: FastAPI):
    api.state.redis = Redis(host=os.getenv("REDIS_HOST"), port=os.getenv("REDIS_PORT"))
    yield
    api.state.redis.close()
api = FastAPI(lifespan=lifespan)
# Configure CORS
api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000", "http://frontend:8000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"]  # Allow all headers
)
# JWT configuration
SECRET_KEY = os.getenv("JWT_ACCESS_TOKEN_SECRET")
ALGORITHM = "HS256"


# Function verify_token takes jwt as an argument and decodes it
async def verify_token(token: str):
    try:
        # Decoding jwt
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                "verify_exp": True, 
                "verify_signature": True 
            }
        )
        return {"status_code": 200, "payload": payload}
    # Token has expired
    except ExpiredSignatureError:
        return {"status_code": 408, "message": "token-has-expired"}
    # Invalid token
    except InvalidTokenError:
        return {"status_code": 406, "message": "invalid-token"}


# Function create_access_token takes dictionary data and expires_delta as argument and creates jwt
async def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    to_encode.update({"iat": datetime.now(timezone.utc)})

    # If token has expiration
    if expires_delta:
        to_encode.update({"exp": datetime.now(timezone.utc) + expires_delta})

    # Encoding jwt
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Getting current user from access_token
# access_token sent as url query param
@api.get("/get-current-user/")
async def get_current_user(access_token: str = ""):
    try:
        # Decoding jwt
        payload = jwt.decode(
            access_token, 
            SECRET_KEY,              
            algorithms=[ALGORITHM],
            options={"verify_exp": True}
        )
            
        user_id = payload.get("sub") 
        # Unknown user
        if not user_id:
            return {"status_code": 404}
        
        user = None
        # Searching in redis
        user_json = api.state.redis.get(f"user:id:{user_id}")
        if user_json:
            user = json.loads(user_json)
        # Searching in the database
        if not user:
            user = await db.get_user_by_id(int(user_id))
            if user:
                api.state.redis.setex(f"user:id:{user_id}", 3600*24, json.dumps(user.__dict__, default=str))
        # Unknown user
        if not user:
            return {"status_code": 404}
        
        return {"status_code": 200, "user": user, "type": payload.get("type")}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /get-current-user:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}


# Getting user watch later list
# user_id sent as url query param
@api.get("/get-user-watch-later/")
async def get_user_watch_later(user_id: int = 0):
    try:
        # Searching in redis
        watch_later = []
        watch_later_ids = api.state.redis.lrange(f"watch_later:user_id:{user_id}", 0, -1)
        for kinopoisk_id in watch_later_ids:
            film = await film_info(kinopoisk_id, additional_info=False)
            if film["status_code"] == 200:
                watch_later.append(film["film"])
            else:
                api.state.redis.lrem(f"watch_later:user_id:{user_id}", kinopoisk_id)
        
        # Searching in the database
        if len(watch_later) == 0:
            watch_later = await db.get_user_watch_later(user_id)
            if watch_later:
                logging.error([film.kinopoisk_id for film in watch_later])
                for film in watch_later:
                    api.state.redis.lpush(f"watch_later:user_id:{user_id}", film.kinopoisk_id)

        return {"status_code": 200 if watch_later else 404, "watch_later": watch_later}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /get-user-watch-later/?user_id={user_id}:\n{error}")
        return {"status_code": 500, "watch_later": []}


# Adding review
@api.post("/add-review")
async def add_review(new_review: ReviewCreate):
    try:
        await db.add_review(new_review)
        return {"status_code": 200}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /add-review:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}


# Getting user reviews
# user_id sent as url query param
@api.get("/get-user-reviews/")
async def get_user_reviews(user_id: int = 0):
    try:
        # Searching in redis
        reviews = {"reviews": [], "without_reviews": []}
        for review_id in api.state.redis.lrange(f"user_reviews:user_id:{user_id}", 0, -1):
            review_json = api.state.redis.get(f"review:id:{review_id}")
            if review_json:
                reviews["reviews"].append(json.loads(review_json))
            else:
                api.state.redis.lrem(f"user_reviews:user_id:{user_id}", 0, review_id)
        for review_id in api.state.redis.lrange(f"user_without_reviews:user_id:{user_id}", 0, -1):
            review_json = api.state.redis.get(f"review:id:{review_id}")
            if review_json:
                reviews["without_reviews"].append(json.loads(review_json))
            else:
                api.state.redis.lrem(f"user_without_reviews:user_id:{user_id}", 0, review_id)
        
        # Searching in the database
        if len(reviews["reviews"]) == 0 and len(reviews["without_reviews"]) == 0:
            reviews = await db.get_user_reviews(user_id)
            if reviews:
                for review in reviews["reviews"]:
                    api.state.redis.lpush(f"user_reviews:{user_id}", review.review_id)
                    api.state.redis.setex(f"review:id:{review.review_id}", 3600*24, json.dumps(review, default=str))
                for review in reviews["without_reviews"]:
                    api.state.redis.lpush(f"user_without_reviews:{user_id}", review.review_id)
                    api.state.redis.setex(f"review:id:{review.review_id}", 3600*24, json.dumps(review, default=str))

        return {"status_code": 200 if reviews["reviews"] or reviews["without_reviews"] else 404, "reviews": reviews["reviews"], "without_reviews": reviews["without_reviews"]}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /get-user-reviews/?user_id={user_id}:\n{error}")
        return {"status_code": 500, "reviews": [], "without_reviews": []}
    

# Deleting review
@api.delete("/delete-review")
async def delete_review(review: Review):
    try:
        api.state.redis.delete(f"reviews:id:{review.id}")
        await db.delete_review(review)
        return {"status_code": 200}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /delete-review:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}
    

# Getting user film review
# user_id & kinopoisk_id sent as url query params
@api.get("/get-user-film-review/")
async def get_user_film_review(user_id: int = 0, kinopoisk_id: int = 0):
    try:
        user_review = await db.get_user_film_review(user_id, kinopoisk_id)
        if user_review:
            api.state.redis.setex(f"review:id:{user_review.id}", 3600*24, json.dumps(user_review.__dict__, default=str))
        return {"status_code": 200 if user_review else 404, "user_review": user_review}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /get-user-film-review/?user_id={user_id}&kinopoisk_id={kinopoisk_id}:\n{error}")
        return {"status_code": 500, "user_review": None}
    

# Adding film to user watch later list
@api.post("/add-watch-later")
async def add_watch_later(watch_later: FilmAndUser):
    try:
        await db.add_watch_later(watch_later)
        if watch_later.kinopoisk_id not in api.state.redis.lrange(f"watch_later:user_id:{watch_later.user_id}", 0, -1):
            api.state.redis.lpush(f"watch_later:user_id:{watch_later.user_id}", watch_later.kinopoisk_id)
        return {"status_code": 200}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /add-watch-later:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}
    

# Checking if the film is added in user watch later list
@api.get("/check-watch-later")
async def check_watch_later(user_id: int = 0, kinopoisk_id: int = 0):
    try:
        return {"status_code": 200, "res": await db.check_watch_later(user_id, kinopoisk_id)}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /generate-password:\n{error}")
        return {"status_code": 500, "res": False, "message": "Произошла непредвиденная ошибка"}
    

# Deleting film from user watch later list
@api.delete("/delete-watch-later")
async def delete_watch_later(watch_later: FilmAndUser):
    try:
        api.state.redis.lrem(f"watch_later:user_id:{watch_later.user_id}", 0, watch_later.kinopoisk_id)
        await db.delete_watch_later(watch_later)
        return {"status_code": 200}
    except Exception as error:
        logging.error(f"An error occurred while serving /delete-watch-later:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}


# Adding review like
@api.post("/add-review-like")
async def add_review_like(new_review_like: ReviewLike):
    try:
        await db.add_review_like(new_review_like)
        if new_review_like.review_id not in api.state.redis.lrange(f"user_likes:user_id:{new_review_like.user_id}", 0, -1):
            api.state.redis.lpush(f"user_likes:user_id:{new_review_like.user_id}", new_review_like.review_id)
        return {"status_code": 200}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /add-review-like:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}
    

# Getting user review likes
# user_id sent as url query param
@api.get("/get-user-review-likes/")
async def get_user_likes(user_id: int = 0):
    try:
        # Searching in redis
        user_likes = list(map(int, api.state.redis.lrange(f"user_likes:user_id:{user_id}", 0, -1)))
        # Searching in the database
        if not user_likes:
            user_likes = await db.get_user_review_likes(user_id)
            if user_likes:
                for user_like in user_likes:
                    api.state.redis.lpush(f"user_likes:user_id:{user_like.user_id}", user_like.review_id)

        return {"status_code": 200 if user_likes else 404, "user_likes": user_likes}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /get-user-review-likes/?user_id={user_id}:\n{error}")
        return {"status_code": 500, "user_likes": []}
    

# Deleting review like
@api.delete("/delete-review-like")
async def delete_review_like(review_like: ReviewLike):
    try:
        api.state.redis.lrem(f"user_likes:user_id:{review_like.user_id}", 0, review_like.review_id)
        await db.delete_review_like(review_like)
        return {"status_code": 200}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /delete-review-like:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}



# Getting user by id
@api.get("/get-user-by-id/")
async def get_user(user_id: int = 0):
    try:
        # Searching in redis
        user = None
        user_json = api.state.redis.get(f"user:id:{user_id}")
        if user_json:
            user = json.loads(user_json)

        # Searching in the database
        if not user:
            user = await db.get_user_by_id(int(user_id))
            if user:
                api.state.redis.setex(f"user:id:{user_id}", 3600*24, json.dumps(user.__dict__, default=str))

        return {"status_code": 200 if user else 404, "user": user}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /get-user-by-id/{user_id}:\n{error}")
        return {"status_code": 500}
    

# Updating user
@api.put("/update-user")
async def update(user: UserUpdate):
    try:
        old_user = await db.get_user_by_id(int(user.id))
        if old_user and (old_user.login == user.login or await db.check_login(user.login)):
            api.state.redis.delete(f"user:id:{user.id}")
            await db.update_user(user)
            return {"status_code": 200}
        return {"status_code": 403, "message": "Данный логин уже занят"}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /update-user:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}


# Deleting user from the database
@api.delete("/delete-user/{user_id}")
async def delete_user(user_id: str):
    try:
        api.state.redis.delete(f"user:id:{user_id}")
        api.state.redis.delete(f"user_reviews:user_id:{user_id}")
        api.state.redis.delete(f"user_without_reviews:user_id:{user_id}")
        api.state.redis.delete(f"watch_later:user_id:{user_id}")
        await db.delete_user(int(user_id))
        return {"status_code": 200}
    except Exception as error:
        logging.error(f"An error occurred while serving /delete-user/{user_id}:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}


# Getting user profile
@api.get("/profile/{user_login}")
async def get_user_profile(user_login: str):
    try:
        # Searching in redis
        user = None
        user_json = api.state.redis.get(f"user:login:{user_login}")
        if user_json:
            user = json.loads(user_json)

        # Searching in the database
        if not user:
            user = await db.get_user_by_login(user_login)
            if user:
                api.state.redis.setex(f"user:login:{user_login}", 3600*24, json.dumps(user.__dict__, default=str))

        return {"status_code": 200 if user else 404, "user": user}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /profile/{user_login}:\n{error}")
        return {"status_code": 500}
    

# Generating password
@api.get("/generate-password")
async def generate_password():
    try:
        return {"status_code": 200, "password": await pw.generate_password()}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /generate-password:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}


# Serving login forms
@api.post("/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(data: UserAuthorization, request: Request):
    try:
        # Authorization form
        if data.type == "authorization":
            # Searching in redis
            user = None
            user_json = api.state.redis.get(f"user:login:{data.login}")
            if user_json:
                user = json.loads(user_json)
            # Searching in the database
            if not user:
                user = await db.get_user_by_login(data.login)
                if user:
                    api.state.redis.setex(f"user:login:{data.login}", 3600*24, json.dumps(user.__dict__, default=str))
            # Unknown user
            if not user:
                return {"status_code": 404}
            # Correct authorization
            if await pw.login(user.password, data.password):
                token = await create_access_token(data={"sub": str(user.id), "type": "access"})
                return {"status_code": 200, "access_token": token}
            # Incorrect password
            return {"status_code": 403}
        
        # Regisatration form
        elif data.type == "registration":
            # Login is already taken
            if not await db.check_login(data.login):
                return {"status_code": 403, "message": "Данный логин занят"}
            # Email is already taken
            if not await db.check_email(data.email):
                return {"status_code": 403, "message": "Данная почта уже используется"}
            # Login is too long
            if len(data.login) > 50:
                return {"status_code": 403, "message": "Максимальная длина логина 50 символов"}
            # Nickname is too long
            if len(data.nickname) > 50:
                return {"status_code": 403, "message": "Максимальная длина имени аккаунта 50 символов"}
            # Email is too long
            if len(data.email) > 50:
                return {"status_code": 403, "message": "Максимальная длина почты 50 символов"}
            # Password is too long
            if len(data.password) > 50:
                return {"status_code": 403, "message": "Максимальная длина пароля 50 символов"}
            # Password is too short
            if len(data.password) < 8:
                return {"status_code": 403, "message": "Минимальная длина пароля 8 символов"}
            # Login contains forbidden symbols
            if not re.fullmatch(r'[.а-яА-ЯёЁa-zA-Z0-9_-]+', data.login):
                return {"status_code": 403, "message": "Логин содержит запрещенные символы"}
            # Nickname contains forbidden symbols
            if not re.fullmatch(r'[.а-яА-ЯёЁa-zA-Z0-9_-]+', data.nickname):
                return {"status_code": 403, "message": "Имя аккаунта содержит запрещенные символы"}
            # Password contains forbidden symbols
            if not re.fullmatch(r'[.а-яА-ЯёЁa-zA-Z0-9_-]+', data.password):
                return {"status_code": 403, "message": "Пароль содержит запрещенные символы"}
            # Email contains forbidden symbols or is in incorrect format
            if not re.fullmatch(r'[.а-яА-ЯёЁa-zA-Z0-9_-]+@[.а-яА-ЯёЁa-zA-Z0-9_-]+.[.а-яА-ЯёЁa-zA-Z0-9_-]+', data.email):
                return {"status_code": 403, "message": "Неверная почта"}
            
            # Correct form
            password = await pw.hasher(data.password)
            verification_token = await create_access_token(expires_delta=timedelta(days=1), 
                                                           data={"login": data.login,
                                                            "password": password,
                                                            "nickname": data.nickname,
                                                            "email": data.email,
                                                            "registration_date": datetime.now().strftime("%d-%m-%Y"),
                                                            "type": "verification"})
            # Sending email
            if await es.registration_email(data.email, verification_token):
                return {"status_code": 200, "message": "Письмо с подтверждением было выслано на вашу почту"}
            # An error while sending email
            return {"status_code": 500, "message": "Не удалось отправить письмо с подтверждением"}
        
        # Uknown form
        else:
            return {"status_code": 404, "message": "Произошла непредвиденная ошибка"}
    
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /login:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}
    

# Serving recovery forms
@api.post("/recovery")
async def recovery(data: UserRecovery, request: Request):
    try:
        # Login form
        if data.type == "login":
            # Searcing in redis
            user = None
            user_json = api.state.redis.get(f"user:login:{data.login}")
            if user_json:
                user = json.loads(user_json)
            # Searching in the database
            if not user:
                user = await db.get_user_by_login(data.login)
                if user:
                    api.state.redis.setex(f"user:login:{data.login}", 3600*24, json.dumps(user.__dict__, default=str))
            # Unknown user
            if not user:
                return {"status_code": 400, "message": "Данный аккаунт не найден"}
            recovery_token = await create_access_token(expires_delta=timedelta(days=1), data={"sub": str(user.id), "type": "recovery"})
            # Sending email
            if await es.password_recovery_email(user.email, recovery_token):
                return {"status_code": 200, "message": "Письмо было выслано на вашу почту"}
            # An error while sending email
            return {"status_code": 500, "message": "Не удалось отправить письмо с подтверждением"}
        
        # Reset password form
        elif data.type == "password":
            result = await verify_token(data.access_token)
            # Incorrect recovery token
            if result["status_code"] != 200:
                return {"status_code": 400, "message": result["message"]}
            
            # Searching in redis
            user = None
            user_json = api.state.redis.get(f'user:id:{result["payload"]["sub"]}')
            if user_json:
                user = json.loads(user_json)
            # Searching in the database
            if not user:
                user = await db.get_user_by_id(int(result["payload"]["sub"]))
                if user:
                    api.state.redis.setex(f'user:id:{result["payload"]["sub"]}', 3600*24, json.dumps(user.__dict__, default=str))
            # Unknown user
            if not user:
                return {"status_code": 404, "message": "Пользователь не найден"}
            # User login doesn't match with form login
            if user.login != data.login:
                return {"status_code": 400, "message": "Произошла непредвиденная ошибка"}
            # Password is too long
            if len(data.password) > 50:
                return {"status_code": 403, "message": "Максимальная длина пароля 50 символов"}
            # Password is too short
            if len(data.password) < 8:
                return {"status_code": 403, "message": "Минимальная длина пароля 8 символов"}
            # Password contains forbidden symbols
            if not re.fullmatch(r'[.а-яА-ЯёЁa-zA-Z0-9_-]+', data.password):
                return {"status_code": 403, "message": "Пароль содержит запрещенные символы"}
            
            # Updating password in the database
            await db.update_user(UserUpdate(id=user.id, password=await pw.hasher(data.password)))
            return {"status_code": 200}
        
        # Unknown form
        else:
            return {"status_code": 404, "message": "Произошла непредвиденная ошибка"}
        
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /recovery:\n{error}")
        return {"status_code": 500, "message": "Произошла непредвиденная ошибка"}


# Verifying recovery token
@api.get("/recovery/{recovery_token}")
async def recovery_main(recovery_token: str):
    data = await verify_token(recovery_token)
    if data["status_code"] == 200:
        # Invalid token type
        if data["payload"]["type"] != "recovery":
            return {"status_code": 403, "message": "invalid-token"}
        
        # Searching in redis
        user = None
        user_json = api.state.redis.get(f'user:login:{data["payload"]["sub"]}')
        if user_json:
            user = json.loads(user_json)
        # Searching in the database
        if not user:
            user = await db.get_user_by_id(int(data["payload"]["sub"]))
            if user:
                api.state.redis.setex(f'user:login:{data["payload"]["sub"]}', 3600*24, json.dumps(user.__dict__, default=str))
        # Unknown user
        if not user:
            return {"status_code": 404, "message": "user-not-found"}

        return {"status_code": 200, "access_token": recovery_token}
    
    # Invalid token
    else:
        return {"status_code": 500, "message": data["message"]}


# Verifying verification token
@api.get("/verify/{verification_token}")
async def verify(verification_token: str):
    data = await verify_token(verification_token)
    if data["status_code"] == 200:
        user = data["payload"]
        # Invalid token type
        if user["type"] != "verification":
            return {"status_code": 403, "message": "invalid-token"}
        # Email is alredy taken
        if not await db.check_email(user["email"]):
            return {"status_code": 400}
        
        # Adding user to the database
        user_id = await db.add_user(UserCreate(login=user["login"],
                                     password=user["password"],
                                     nickname=user["nickname"],
                                     email=user["email"],
                                     registration_date=datetime.strptime(user["registration_date"], "%d-%m-%Y")))
        token = await create_access_token(data={"sub": str(user_id), "type": "access"})
        return {"status_code": 200, "access_token": token}
    
    # Invalid token
    else:
        return {"status_code": 403, "message": data["message"]}


# Searching for a film title
@api.get("/search/{film_title}")
async def search(film_title: str):
    try:
        # Getting films_ids
        films_ids = await kapi.get_films_by_title(film_title)
        films = []
        # Getting films info
        for film_id in films_ids:
            # Searching in redis
            film = None
            film_json = api.state.redis.get(f"film:kinopoisk_id:{film_id}")
            if film_json:
                film = json.loads(film_json)
            # Searching in the database
            if not film:
                film = await db.get_film_by_kinopoisk_id(film_id)
                if film:
                    api.state.redis.setex(f"film:kinopoisk_id:{film_id}", 3600*24, json.dumps(film.__dict__, default=str))
            if film:
                films.append(film)
        return {"status_code": 200 if len(films) != 0 else 404, "search": film_title, "films": films}
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /search/{film_title}:\n{error}")
        return {"status_code": 500, "search": film_title}
    

# Getting film info
@api.get("/film/{kinopoisk_id}")
async def film_info(kinopoisk_id: str, additional_info=True):
    try:
        kinopoisk_id = int(kinopoisk_id)
        # Searching in redis
        film = None
        film_json = api.state.redis.get(f"film:kinopoisk_id:{kinopoisk_id}")
        film_is_dict = False
        if film_json:
            film_is_dict = True
            film = json.loads(film_json)
            if additional_info:
                awards_json = api.state.redis.get(f"film:awards:kinopoisk_id:{kinopoisk_id}")
                film["awards"] = json.loads(awards_json) if awards_json else None
                trailers_json = api.state.redis.get(f"film:trailers:kinopoisk_id:{kinopoisk_id}")
                film["trailers"] = json.loads(trailers_json) if trailers_json else None
                similars_json = api.state.redis.get(f"film:similars:kinopoisk_id:{kinopoisk_id}")
                film["similars"] = json.loads(similars_json) if similars_json else None
                sequels_json = api.state.redis.get(f"film:sequels:kinopoisk_id:{kinopoisk_id}")
                film["sequels"] = json.loads(sequels_json) if sequels_json else None
                posters_json = api.state.redis.get(f"film:posters:kinopoisk_id:{kinopoisk_id}")
                film["posters"] = json.loads(posters_json) if posters_json else None
                film["reviews"] = []
                for review_id in api.state.redis.lrange(f"film:reviews:kinopoisk_id:{kinopoisk_id}", 0, -1):
                    review_json = api.state.redis.get(f"review:id:{review_id}")
                    if review_json:
                        film["reviews"].append(json.loads(review_json))
                    else:
                        api.state.redis.lrem(f"film:reviews:kinopoisk_id:{kinopoisk_id}", review_id)
        # Searching in the database
        if not film:
            film = await db.get_film_by_kinopoisk_id(kinopoisk_id)
        # Film not found
        if not film:
            # Adding film to the database
            await kapi.get_film_info(kinopoisk_id)
            if additional_info:
                await kapi.get_film_additional_info(kinopoisk_id)
            film = await db.get_film_by_kinopoisk_id(kinopoisk_id)

        # Unknown film
        if not film:
            return {"status_code": 404}
        
        # Film has not yet additional info, stored in the database
        if additional_info and (film_is_dict and not film.get("has_additional_info")) or (not film_is_dict and not film.has_additional_info):
            film_is_dict = False
            await kapi.get_film_additional_info(kinopoisk_id)
            film = await db.get_film_by_kinopoisk_id(kinopoisk_id)
        
        # Adding film to redis
        if additional_info and film and not film_is_dict:
            if film.reviews:
                for review in film.reviews:
                    api.state.redis.lpush(f"film:reviews:kinopoisk_id:{kinopoisk_id}", review.id)
                for review in film.reviews:
                    api.state.redis.setex(f"review:id:{review.id}", 3600*24, json.dumps(review.__dict__, default=str))
            api.state.redis.setex(f"film:kinopoisk_id:{kinopoisk_id}", 3600*24, json.dumps(film.__dict__, default=str))
            api.state.redis.setex(f"film:awards:kinopoisk_id:{kinopoisk_id}", 3600*24, json.dumps([award.__dict__ for award in film.awards], default=str))
            api.state.redis.setex(f"film:trailers:kinopoisk_id:{kinopoisk_id}", 3600*24, json.dumps([trailer.__dict__ for trailer in film.trailers], default=str))
            api.state.redis.setex(f"film:similars:kinopoisk_id:{kinopoisk_id}", 3600*24, json.dumps([similar.__dict__ for similar in film.similars], default=str))
            api.state.redis.setex(f"film:sequels:kinopoisk_id:{kinopoisk_id}", 3600*24, json.dumps([sequel.__dict__ for sequel in film.sequels], default=str))
            api.state.redis.setex(f"film:posters:kinopoisk_id:{kinopoisk_id}", 3600*24, json.dumps([poster.__dict__ for poster in film.posters], default=str))

        return {"status_code": 200, "film": film}
    
    # An error has occurred
    except Exception as error:
        logging.error(f"An error occurred while serving /film/{kinopoisk_id}:\n{error}")
        return {"status_code": 500}


# Reloading the database
@api.get("/reload-database")
async def index():
    try:
        api.state.redis.flushall()
        await db.delete_tables()
        await db.create_tables()
        await db.add_user(UserCreate(login="middelmatigheid", password=await pw.hasher("123"), nickname="middelmatigheid", email="123"))
        logging.info(f"The database was reloaded")
        return {"status_code": 200, "message": "Database was reloaded successfully"}
    except Exception as e:
        logging.error(f"An error occured while reloading the database:\n{e}")
        return {"status_code": 500, "message": "An error occured while reloading the database"}
