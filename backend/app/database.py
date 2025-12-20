from sqlalchemy import Column, Integer, Float, String, Text, Date, Boolean, ForeignKey, select, text, delete
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

import os
from dotenv import load_dotenv
import logging

from app.schemas import *


"""
File for operating with the PostgreSQL database via SQLAclhemy
"""


# Connecting to the PostgreSQL database
load_dotenv()
HOST = os.getenv("DB_HOST")
DBNAME = os.getenv("DB_NAME")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
PORT = os.getenv("DB_PORT")
engine = create_async_engine(f"postgresql+asyncpg://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}", echo=False)
# Creating session
Session = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Configuring logging
# logging.basicConfig(level=logging.ERROR, filename="/logs/logging.log", filemode="a", format="%(asctime)s - %(levelname)s - %(filename)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S", encoding="utf-8")
logging.basicConfig(level=logging.ERROR, filename="../logs/logging.log", filemode="a", format="%(asctime)s - %(levelname)s - %(filename)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S", encoding="utf-8")
logging.getLogger("sqlalchemy").setLevel(logging.ERROR)
logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)
# Declaring classes
Base = declarative_base()


# Table films
class FilmModel(Base):
    __tablename__ = "films"
    kinopoisk_id = Column(Integer, primary_key=True) 
    name_ru = Column(String)
    name_original = Column(String)
    poster_url = Column(String)
    poster_preview_url = Column(String)
    rating_good_review_vote_count = Column(Integer)
    rating_user_sum = Column(Integer)
    rating_user_vote_count = Column(Integer)
    rating_kinopoisk = Column(Float)
    rating_kinopoisk_vote_count = Column(Integer)
    rating_imdb = Column(Float)
    rating_imdb_vote_count = Column(Integer)
    year = Column(Integer)
    length = Column(Integer)
    slogan = Column(String)
    description = Column(Text)
    short_description = Column(String)
    content_type = Column(String)
    rating_age_limits = Column(Integer)
    countries = Column(String)
    genres = Column(String)
    start_year = Column(Integer)
    end_year = Column(Integer)
    is_serial = Column(Boolean)
    budget = Column(String)
    earnings_world = Column(String)
    earnings_rus = Column(String)
    has_additional_info = Column(Boolean)


# Table awards
class AwardModel(Base):
    __tablename__ = "awards"
    id = Column(Integer, primary_key=True)
    kinopoisk_id = Column(Integer, ForeignKey("films.kinopoisk_id"))
    name = Column(String)
    nomination_name = Column(String)
    year = Column(Integer)
    persons = Column(String)


# Table trailers
class TrailerModel(Base):
    __tablename__ = "trailers"
    id = Column(Integer, primary_key=True)
    kinopoisk_id = Column(Integer, ForeignKey("films.kinopoisk_id"))
    name = Column(String)
    url = Column(String)


# Table similars
class SimilarModel(Base):
    __tablename__ = "similars"
    id = Column(Integer, primary_key=True)
    kinopoisk_id = Column(Integer, ForeignKey("films.kinopoisk_id"))
    similar_kinopoisk_id = Column(Integer)


# Table sequels
class SequelModel(Base):
    __tablename__ = "sequels"
    id = Column(Integer, primary_key=True)
    kinopoisk_id = Column(Integer, ForeignKey("films.kinopoisk_id"))
    sequel_kinopoisk_id = Column(Integer)
    type = Column(String)


# Table posters
class PosterModel(Base):
    __tablename__ = "posters"
    id = Column(Integer, primary_key=True)
    kinopoisk_id = Column(Integer, ForeignKey("films.kinopoisk_id"))
    url = Column(String)


# Table users
class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    login = Column(String)
    password = Column(String)
    nickname = Column(String)
    description = Column(String)
    email = Column(String)
    registration_date = Column(Date)
    

# Table watch_later
class WatchLaterModel(Base):
    __tablename__ = "watch_later"
    id = Column(Integer, primary_key=True)
    kinopoisk_id = Column(Integer, ForeignKey("films.kinopoisk_id"))
    user_id = Column(Integer, ForeignKey("users.id"))


# Table reviews
class ReviewModel(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    kinopoisk_id = Column(Integer, ForeignKey("films.kinopoisk_id"))
    title = Column(String)
    text = Column(Text)
    rating = Column(Integer)
    date = Column(Date)
    likes_amount = Column(Integer)


# Table review_likes
class ReviewLikeModel(Base):
    __tablename__ = "review_likes"
    id = Column(Integer, primary_key=True)
    review_id = Column(Integer, ForeignKey("reviews.id"))
    user_id = Column(Integer, ForeignKey("users.id"))


# Function create_tables takes no arguments and creates tables
async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logging.info("The tables were successfully created")


# Function delete_tables takes no arguments and deletes tables
async def delete_tables() -> None:
    async with engine.begin() as conn:
        try:
            await conn.execute("SET CONSTRAINTS ALL DEFERRED")
            await conn.run_sync(Base.metadata.drop_all)
            logging.info("The tables were successfully deleted")
        except:
            tables = ["films", "awards", "trailers", "similars", "similar_movies", "sequels", "posters", "users", "review_likes", "reviews", "watch_later"]
            for table in tables:
                try:
                    await conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                except Exception as e:
                    logging.error(f"Could not drop {table}: {e}")



# Adding a new film to the database
async def add_film(new_film: FilmCreate):
    async with Session() as session:
        if not await session.scalar(select(FilmModel.kinopoisk_id).where(FilmModel.kinopoisk_id == new_film.kinopoisk_id)) and (new_film.name_ru or new_film.name_original):
            session.add(FilmModel(**new_film.model_dump()))
            await session.commit()
            logging.info(f"A new film kinopoisk_id={new_film.kinopoisk_id} has been added to the database")


# Updating film
async def update_film(updated_film: FilmUpdate):
    async with Session() as session:
        film = await session.scalar(select(FilmModel).where(FilmModel.kinopoisk_id == updated_film.kinopoisk_id))
        if film:
            updated_film_data = updated_film.model_dump(exclude_unset=True)
            for field, value in updated_film_data.items():
                setattr(film, field, value)
            await session.commit()


# Checking if the film exists in the database
async def check_film(kinopoisk_id: int) -> bool:
    async with Session() as session:
        return await session.scalar(select(FilmModel).where(FilmModel.kinopoisk_id == kinopoisk_id)) is not None


# Getting a film by kinopoisk_id
async def get_film_by_kinopoisk_id(kinopoisk_id: int):
    async with Session() as session:
        film = await session.scalar(select(FilmModel).where(FilmModel.kinopoisk_id == kinopoisk_id, (FilmModel.name_original != "") | (FilmModel.name_ru != "")))
        if film:
            # Getting film awards
            awards = {}
            for award in (await session.scalars(select(AwardModel.name).where(AwardModel.kinopoisk_id == kinopoisk_id))).all():
                awards[award] = awards.get(award, 0) + 1
            film.awards = []
            for i, award in enumerate(awards):
                film.awards.append(FilmAward(id=i, name=award, count=awards[award]))

            # Getting film trailers
            film.trailers = (await session.scalars(select(TrailerModel).where(TrailerModel.kinopoisk_id == kinopoisk_id))).all()

            # Getting film similars
            similars = []
            for similar in (await session.scalars(select(SimilarModel.similar_kinopoisk_id).where(SimilarModel.kinopoisk_id == kinopoisk_id))).all():
                similar = await session.scalar(select(FilmModel).where(FilmModel.kinopoisk_id == similar, (FilmModel.name_original != "") | (FilmModel.name_ru != "")))
                if similar:
                    similars.append(similar)
            film.similars = similars

            # Getting film sequels
            sequels = []
            for sequel in (await session.scalars(select(SequelModel.sequel_kinopoisk_id).where(SequelModel.kinopoisk_id == kinopoisk_id))).all():
                sequel = await session.scalar(select(FilmModel).where(FilmModel.kinopoisk_id == sequel, (FilmModel.name_original != "") | (FilmModel.name_ru != "")))
                if sequel:
                    sequels.append(sequel)
            film.sequels = sequels

            # Getting film posters
            film.posters = (await session.scalars(select(PosterModel).where(PosterModel.kinopoisk_id == kinopoisk_id))).all()

            # Getting film reviews
            reviews = (await session.scalars(select(ReviewModel).where(ReviewModel.kinopoisk_id == kinopoisk_id, ReviewModel.title != ""))).all()
            film.reviews = []
            for review in reviews:
                user_info = await session.scalar(select(UserModel).where(UserModel.id == review.user_id))
                film.reviews.append(FilmReview(id=review.id, user=User(login=user_info.login, 
                                                                        nickname=user_info.nickname, 
                                                                        img=await get_user_img(user_info.id)),
                                                                        rating=review.rating,
                                                                        title=review.title,
                                                                        text=review.text,
                                                                        date=review.date.strftime("%d-%m-%Y"),
                                                                        likes_amount=review.likes_amount))
        return film
    

# Adding a new award to the database
async def add_award(new_award: AwardCreate):
    async with Session() as session:
        new_award_data = new_award.model_dump()
        session.add(AwardModel(**new_award_data))
        await session.commit()


# Adding a new trailer to the database
async def add_trailer(new_trailer: TrailerCreate):
    async with Session() as session:
        new_trailer_data = new_trailer.model_dump()
        session.add(TrailerModel(**new_trailer_data))
        await session.commit()
    

# Adding a new similar to the database
async def add_similar(new_similar: SimilarCreate):
    async with Session() as session:
        new_similar_data = new_similar.model_dump()
        session.add(SimilarModel(**new_similar_data))
        await session.commit()


# Adding a new sequel to the database
async def add_sequel(new_sequel: SequelCreate):
    async with Session() as session:
        new_sequel_data = new_sequel.model_dump()
        session.add(SequelModel(**new_sequel_data))
        await session.commit()

    
# Adding a new poster to the database
async def add_poster(new_poster: PosterCreate):
    async with Session() as session:
        new_poster_data = new_poster.model_dump()
        session.add(PosterModel(**new_poster_data))
        await session.commit()
    

# Adding a new user to the database
async def add_user(new_user: UserCreate):
    async with Session() as session:
        new_user_data = new_user.model_dump()
        session.add(UserModel(**new_user_data))
        await session.commit()
        logging.info(f"A new user login={new_user.login} has been added to the database")
        return await session.scalar(select(UserModel.id).where(UserModel.login == new_user.login and UserModel.email == new_user.email))


# Updating user
async def update_user(updated_user: UserUpdate):
    async with Session() as session:
        user = await session.scalar(select(UserModel).where(UserModel.id == updated_user.id))
        if user:
            updated_user_data = updated_user.model_dump(exclude_unset=True)
            for field, value in updated_user_data.items():
                setattr(user, field, value)
            logging.info(f"User info login={updated_user.login} has been updated in the database")
            await session.commit()


# Getting user image format
async def get_user_img(user_id):
    if os.path.exists(f"../frontend/static/images/users/{user_id}.jpg"):
        return f"/static/images/users/{user_id}.jpg"
    elif os.path.exists(f"../frontend/static/images/users/{user_id}.jpeg"):
        return f"/static/images/users/{user_id}.jpeg"
    elif os.path.exists(f"../frontend/static/images/users/{user_id}.png"):
        return f"/static/images/users/{user_id}.png"
    else:
        return "/static/images/basic/user.png"
    

# Getting user reviews
async def get_user_reviews(user_id):
    async with Session() as session:
        reviews = []
        without_reviews = []
        reviews_arr = (await session.scalars(select(ReviewModel).where(ReviewModel.user_id == user_id))).all()
        # No reviews
        if not reviews_arr:
            return {"reviews": reviews, "without_reviews": without_reviews}
        
        for review in reviews_arr:
            film = await session.scalar(select(FilmModel).where(FilmModel.kinopoisk_id == review.kinopoisk_id))
            film.review_id = review.id
            film.likes_amount = review.likes_amount
            film.review_rating = review.rating
            film.review_date = review.date
            if review.title:
                film.review_title = review.title
                film.review_text = review.text
                reviews.append(film)
            else:
                without_reviews.append(film)
        return {"reviews": reviews, "without_reviews": without_reviews}


# Getting user watch later list
async def get_user_watch_later(user_id: int):
    async with Session() as session:
        watch_later_ids = (await session.scalars(select(WatchLaterModel.kinopoisk_id).where(WatchLaterModel.user_id == user_id))).all()
        watch_later = []
        for kinopoisk_id in watch_later_ids:
            watch_later.append(await get_film_by_kinopoisk_id(kinopoisk_id))
        return watch_later


# Getting user review likes
async def get_user_review_likes(user_id: int):
    async with Session() as session:
        return (await session.scalars(select(ReviewLikeModel.review_id).where(ReviewLikeModel.user_id == user_id))).all()


# Getting user by id in the database
async def get_user_by_id(user_id: int):
    async with Session() as session:
        user = await session.scalar(select(UserModel).where(UserModel.id == user_id))
        if user:
            user.img = await get_user_img(user.id)
        return user
    

# Getting user by login in the database
async def get_user_by_login(login: str):
    async with Session() as session:
        user = await session.scalar(select(UserModel).where(UserModel.login == login))
        if user:
            user.img = await get_user_img(user.id)
        return user


# Getting user by verification_token
async def get_user_by_verification_token(verification_token: str):
    async with Session() as session:
        user = await session.scalar(select(UserModel).where(UserModel.verification_token == verification_token))
        if user:
            user.img = await get_user_img(user.id)
        return user
    

# Getting user by recovery_token
async def get_user_by_recovery_token(recovery_token: str):
    async with Session() as session:
        user = await session.scalar(select(UserModel).where(UserModel.recovery_token == recovery_token))
        if user:
            user.img = await get_user_img(user.id)
        return user


# Checking if the login is free
async def check_login(login: str) -> bool:
    async with Session() as session:
        return await session.scalar(select(UserModel).where(UserModel.login == login)) is None
    

# Checking if the email is free
async def check_email(email: str) -> bool:
    async with Session() as session:
        return await session.scalar(select(UserModel).where(UserModel.email == email)) is None


# Checking if the verification token is free
async def check_verification_token(verification_token: str) -> bool:
    async with Session() as session:
        return await session.scalar(select(UserModel).where(UserModel.verification_token == verification_token)) is None
    

# Checking if the recivery token is free
async def check_recovery_token(recovery_token: str) -> bool:
    async with Session() as session:
        return await session.scalar(select(UserModel).where(UserModel.recovery_token == recovery_token)) is None
    

# Deleting the user from the database
async def delete_user(user_id: int) -> None:
    async with Session() as session:
        await session.execute(delete(WatchLaterModel).where(WatchLaterModel.user_id == user_id))
        await session.execute(delete(ReviewLikeModel).where(ReviewLikeModel.user_id == user_id))
        await session.execute(delete(ReviewModel).where(ReviewModel.user_id == user_id))
        await session.execute(delete(UserModel).where(UserModel.id == user_id))
        user_img = await get_user_img(user_id)
        if user_img != "/static/images/basic/user.png":
            try:
                os.remove(user_img[1:])
            except Exception as error:
                logging.error(f"No such file {user_img[1:]}: {error}")
        await session.commit()


# Deleting all users from the database
async def delete_all_users() -> None:
    async with Session() as session:
        await session.execute(delete(WatchLaterModel))
        await session.execute(delete(ReviewLikeModel))
        await session.execute(delete(ReviewModel))
        await session.execute(delete(UserModel))
        os.remove("static/images/users")
        os.mkdir("static/images/users")
        await session.commit()


# Adding a new watch later to the database
async def add_watch_later(watch_later: FilmAndUser):
    async with Session() as session:
        if not await check_watch_later(watch_later.user_id, watch_later.kinopoisk_id):
            watch_later_data = watch_later.model_dump()
            session.add(WatchLaterModel(**watch_later_data))
            logging.info(f"A new watch_later user={watch_later.user_id} kinopoisk_id={watch_later.kinopoisk_id} has been added to the database")
            await session.commit()


# Checking if the user has already added a film to watch later list
async def check_watch_later(user_id, kinopoisk_id):
    async with Session() as session:
        watch_later = await session.scalar(select(WatchLaterModel).where(WatchLaterModel.kinopoisk_id == kinopoisk_id, WatchLaterModel.user_id == user_id))
        return watch_later is not None
    

# Deleting the film from user watch later list
async def delete_watch_later(watch_later: FilmAndUser) -> None:
    async with Session() as session:
        await session.execute(delete(WatchLaterModel).where(WatchLaterModel.kinopoisk_id == watch_later.kinopoisk_id, WatchLaterModel.user_id == watch_later.user_id))
        await session.commit()


# Adding a new review to the database
async def add_review(new_review: ReviewCreate):
    async with Session() as session:
        film = await session.scalar(select(FilmModel).where(FilmModel.kinopoisk_id == new_review.kinopoisk_id))
        if film:
            new_review_data = new_review.model_dump()
            session.add(ReviewModel(**new_review_data))
            setattr(film, "rating_user_sum", film.rating_user_sum + new_review.rating)
            setattr(film, "rating_user_vote_count", film.rating_user_vote_count + 1)
            logging.info(f"A new review user_id={new_review.user_id} kinopoisk_id={new_review.kinopoisk_id} has been added to the database")
            await session.commit()


# Getting review by its id in the database
async def get_review_by_id(review_id: int):
    async with Session() as session:
        return await session.scalar(select(ReviewModel).where(ReviewModel.id == review_id))
    

# Getting user likes
async def get_user_likes(user_id):
    async with Session() as session:
        return (await session.scalars(select(ReviewLikeModel.review_id).where(ReviewLikeModel.user_id == user_id))).all()


# Getting user film review
async def get_user_film_review(user_id, kinopoisk_id):
    async with Session() as session:
        return await session.scalar(select(ReviewModel).where(ReviewModel.kinopoisk_id == kinopoisk_id, ReviewModel.user_id == user_id))


# Deleting review
async def delete_review(review: Review) -> None:
    async with Session() as session:
        review = await session.scalar(select(ReviewModel).where(ReviewModel.kinopoisk_id == review.kinopoisk_id, ReviewModel.user_id == review.user_id))
        if review:
            film = await session.scalar(select(FilmModel).where(FilmModel.kinopoisk_id == review.kinopoisk_id))
            setattr(film, "rating_user_sum", film.rating_user_sum - review.rating)
            setattr(film, "rating_user_vote_count", film.rating_user_vote_count - 1)
            await session.execute(delete(ReviewLikeModel).where(ReviewLikeModel.review_id == review.id))
            await session.execute(delete(ReviewModel).where(ReviewModel.kinopoisk_id == review.kinopoisk_id, ReviewModel.user_id == review.user_id))
            logging.info(f"Review user_id={review.user_id} kinopoisk_id={review.kinopoisk_id} was deleted from the database")
            await session.commit()


# Adding a new review like
async def add_review_like(new_review_like: ReviewLikeCreate):
    async with Session() as session:
        new_review_like_data = new_review_like.model_dump()
        if not await session.scalar(select(ReviewLikeModel).where(ReviewLikeModel.user_id == new_review_like.user_id, ReviewLikeModel.review_id == new_review_like.review_id)):
            session.add(ReviewLikeModel(**new_review_like_data))
            review = await session.scalar(select(ReviewModel).where(ReviewModel.id == new_review_like.review_id))
            if review:
                review.likes_amount += 1
            logging.info(f"A new review like user_id={new_review_like.user_id} review_id={new_review_like.review_id} has been added to the database")
            await session.commit()


# Checking if user liked the review
async def check_user_review_like(review_id: int, user_id: int):
    async with Session() as session:
        return await session.scalar(select(ReviewLikeModel).where(ReviewLikeModel.review_id == review_id, ReviewLikeModel.user_id == user_id)) is not None


# Deleting review like
async def delete_review_like(review_like: ReviewLike) -> None:
    async with Session() as session:
        review = await session.scalar(select(ReviewModel).where(ReviewModel.id == review_like.review_id))
        if review:
            review.likes_amount -= 1
            await session.execute(delete(ReviewLikeModel).where(ReviewLikeModel.review_id == review_like.review_id, ReviewLikeModel.user_id == review_like.user_id))
            logging.info(f"Review like user_id={review_like.user_id} review_id={review_like.review_id} was deleted from the database")
            await session.commit()
