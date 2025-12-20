from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


# Films


class Film(BaseModel):
    kinopoisk_id: int = Field(..., description="Film Kinopoisk id")
    name_ru: str = Field(..., description="Film russian name")
    name_original: str = Field(..., description="Film original name")
    poster_url: str = Field(..., description="Film poster url")
    poster_preview_url: str = Field(..., description="Film preview url")
    rating_good_review_vote_count: int = Field(..., description="Film rating")
    rating_user_sum: int = Field(..., description="Film user rating sum")
    rating_user_vote_count: int = Field(..., description="Film user rating vote count")
    rating_kinopoisk: float = Field(..., description="Film rating in Kinopoisk")
    rating_kinopoisk_vote_count: int = Field(..., description="Film rating vote count in Kinopoisk")
    rating_imdb: float = Field(..., description="Film rating in IMDb")
    rating_imdb_vote_count: int = Field(..., description="Film rating vote count in IMDb")
    year: int = Field(..., description="Year in which the film was released")
    length: int = Field(..., description="Film length in minutes")
    slogan: str = Field(..., description="Film slogan")
    description: str = Field(..., description="Film description")
    short_description: str = Field(..., description="Film short description")
    content_type: str = Field(..., description="Film content type")
    rating_age_limits: int = Field(..., description="Film rating age limits")
    countries: str = Field(..., description="Countries which produced the film")
    genres: str = Field(..., description="Film genres")
    start_year: int = Field(..., description="Start year in which the serial first episode was released")
    end_year: int = Field(..., description="End year in which the serial last episode was released")
    is_serial: bool = Field(..., description="If it is a serial")
    budget: str = Field(..., description="Film budget")
    earnings_world: str = Field(..., description="Film earnings in the world")
    earnings_rus: str = Field(..., description="Film earnings in Russia")
    has_additional_info: bool = Field(..., description="If the film additional info has been already added to the database")


class FilmCreate(BaseModel):
    kinopoisk_id: int = Field(..., description="Film Kinopoisk id")
    name_ru: Optional[str] = Field(None, description="Film russian name")
    name_original: Optional[str] = Field(None, description="Film original name")
    poster_url: Optional[str] = Field(None, description="Film poster url")
    poster_preview_url: Optional[str] = Field(None, description="Film preview url")
    rating_good_review_vote_count: Optional[int] = Field(None, description="Film rating")
    rating_user_sum: Optional[int] = Field(0, description="Film user rating")
    rating_user_vote_count: Optional[int] = Field(0, description="Film user rating vote count")
    rating_kinopoisk: Optional[float] = Field(None, description="Film rating in Kinopoisk")
    rating_kinopoisk_vote_count: Optional[int] = Field(None, description="Film rating vote count in Kinopoisk")
    rating_imdb: Optional[float] = Field(None, description="Film rating in IMDb")
    rating_imdb_vote_count: Optional[int] = Field(None, description="Film rating vote count in IMDb")
    year: Optional[int] = Field(None, description="Year in which the film was released")
    length: Optional[int] = Field(None, description="Film length in minutes")
    slogan: Optional[str] = Field(None, description="Film slogan")
    description: Optional[str] = Field(None, description="Film description")
    short_description: Optional[str] = Field(None, description="Film short description")
    content_type: Optional[str] = Field(None, description="Film content type")
    rating_age_limits: Optional[int] = Field(None, description="Film rating age limits")
    countries: Optional[str] = Field(None, description="Countries which produced the film")
    genres: Optional[str] = Field(None, description="Film genres")
    start_year: Optional[int] = Field(None, description="Start year in which the serial first episode was released")
    end_year: Optional[int] = Field(None, description="End year in which the serial last episode was released")
    is_serial: Optional[bool] = Field(False, description="If it is a serial")
    budget: Optional[str] = Field(None, description="Film budget")
    earnings_world: Optional[str] = Field(None, description="Film earnings in the world")
    earnings_rus: Optional[str] = Field(None, description="Film earnings in Russia")
    has_additional_info: Optional[bool] = Field(False, description="If the film additional info has been already added to the database")


class FilmUpdate(BaseModel):
    kinopoisk_id: int = Field(..., description="Film Kinopoisk id")
    name_ru: Optional[str] = Field(None, description="Film russian name")
    name_original: Optional[str] = Field(None, description="Film original name")
    poster_url: Optional[str] = Field(None, description="Film poster url")
    poster_preview_url: Optional[str] = Field(None, description="Film preview url")
    rating_user_sum: Optional[int] = Field(0, description="Film user rating")
    rating_user_vote_count: Optional[int] = Field(0, description="Film user rating vote count")
    rating_good_review_vote_count: Optional[int] = Field(None, description="Film rating")
    rating_kinopoisk: Optional[float] = Field(None, description="Film rating in Kinopoisk")
    rating_kinopoisk_vote_count: Optional[int] = Field(None, description="Film rating vote count in Kinopoisk")
    rating_imdb: Optional[float] = Field(None, description="Film rating in IMDb")
    rating_imdb_vote_count: Optional[int] = Field(None, description="Film rating vote count in IMDb")
    year: Optional[int] = Field(None, description="Year in which the film was released")
    length: Optional[int] = Field(None, description="Film length in minutes")
    slogan: Optional[str] = Field(None, description="Film slogan")
    description: Optional[str] = Field(None, description="Film description")
    short_description: Optional[str] = Field(None, description="Film short description")
    content_type: Optional[str] = Field(None, description="Film content type")
    rating_age_limits: Optional[int] = Field(None, description="Film rating age limits")
    countries: Optional[str] = Field(None, description="Countries which produced the film")
    genres: Optional[str] = Field(None, description="Film genres")
    start_year: Optional[int] = Field(None, description="Start year in which the serial first episode was released")
    end_year: Optional[int] = Field(None, description="End year in which the serial last episode was released")
    is_serial: Optional[bool] = Field(False, description="If it is a serial")
    budget: Optional[str] = Field(None, description="Film budget")
    earnings_world: Optional[str] = Field(None, description="Film earnings in the world")
    earnings_rus: Optional[str] = Field(None, description="Film earnings in Russia")
    has_additional_info: Optional[bool] = Field(False, description="If the film additional info has been already added to the database")


# Awards


class FilmAward(BaseModel):
    id: int = Field(..., description="Award id")
    name: str = Field(..., description="Award name")
    count: int = Field(..., description="Award amount")


class Award(BaseModel):
    kinopoisk_id: int = Field(..., description="Kinopoisk id of a film that was awarded")
    name: str = Field(..., description="Award name")
    nomination_name: str = Field(..., description="Award nomination name")
    year: int = Field(..., description="The year in which award was")
    persons: str = Field(..., description="Persons which were nominated in the award")


class AwardCreate(BaseModel):
    kinopoisk_id: int = Field(..., description="Kinopoisk id of a film that was awarded")
    name: str = Field(..., description="Award name")
    nomination_name: Optional[str] = Field(None, description="Award nomination name")
    year: Optional[int] = Field(None, description="The year in which award was")
    persons: Optional[str] = Field(None, description="Persons which were nominated in the award")


class AwardUpdate(BaseModel):
    id: int = Field(..., description="Award id in the database")
    kinopoisk_id: Optional[int] = Field(None, description="Kinopoisk id of a film that was awarded")
    name: Optional[str] = Field(None, description="Award name")
    nomination_name: Optional[str] = Field(None, description="Award nomination name")
    year: Optional[int] = Field(None, description="The year in which award was")
    persons: Optional[str] = Field(None, description="Persons which were nominated in the award")


# Trailers


class Trailer(BaseModel):
    id: int = Field(..., description="Trailer id in the database")
    kinopoisk_id: int = Field(..., description="Trailer's film Kinopoisk id")
    name: str = Field(..., description="Trailer name")
    url: str = Field(..., description="Trailer url")


class TrailerCreate(BaseModel):
    kinopoisk_id: int = Field(..., description="Trailer's film Kinopoisk id")
    name: Optional[str] = Field(None, description="Trailer name")
    url: str = Field(..., description="Trailer url")


class TrailerUpdate(BaseModel):
    id: int = Field(..., description="Trailer id in the database")
    kinopoisk_id: Optional[int] = Field(None, description="Trailer's film Kinopoisk id")
    name: Optional[str] = Field(None, description="Trailer name")
    url: Optional[str] = Field(None, description="Trailer url")


# Similars


class Similar(BaseModel):
    id: int = Field(..., description="Similar movie id in the database")
    kinopoisk_id: int = Field(..., description="Kinopoisk id of a film, for which the movie is being similar")
    similar_kinopoisk_id: int = Field(..., description="Similar movie's film id in Kinopoisk")


class SimilarCreate(BaseModel):
    kinopoisk_id: int = Field(..., description="Kinopoisk id of a film, for which the movie is being similar")
    similar_kinopoisk_id: int = Field(..., description="Similar movie's film id in Kinopoisk")


class SimilarUpdate(BaseModel):
    id: int = Field(..., description="Similar movie id in the database")
    kinopoisk_id: Optional[int] = Field(None, description="Kinopoisk id of a film, for which the movie is being similar")
    similar_kinopoisk_id: Optional[int] = Field(None, description="Similar movie's film id in Kinopoisk")


# Sequels


class Sequel(BaseModel):
    id: int = Field(..., description="Sequel id in the database")
    kinopoisk_id: int = Field(..., description="Kinopoisk id of a film, for which the sequel belongs")
    sequel_kinopoisk_id: int = Field(..., description="Sequel's film Kinopoisk id")
    type: Optional[str] = Field(None, description="Sequel type")


class SequelCreate(BaseModel):
    kinopoisk_id: int = Field(..., description="Kinopoisk id of a film, for which the sequel belongs")
    sequel_kinopoisk_id: int = Field(..., description="Sequel's film Kinopoisk id")
    type: Optional[str] = Field(None, description="Sequel type")


class SequelUpdate(BaseModel):
    id: int = Field(..., description="Sequel id in the database")
    kinopoisk_id: Optional[int] = Field(None, description="Kinopoisk id of a film, for which the sequel belongs")
    sequel_kinopoisk_id: Optional[int] = Field(None, description="Sequel's film Kinopoisk id")
    type: Optional[str] = Field(None, description="Sequel type")


# Posters


class Poster(BaseModel):
    id: int = Field(..., description="Poster id in the database")
    kinopoisk_id: int = Field(..., description="Poster's film id in Kinopoisk")
    url: str = Field(..., description="Poster url")


class PosterCreate(BaseModel):
    kinopoisk_id: int = Field(..., description="Poster's film id in Kinopoisk")
    url: str = Field(..., description="Poster url")


class PosterUpdate(BaseModel):
    id: int = Field(..., description="Poster id in the database")
    kinopoisk_id: Optional[int] = Field(None, description="Poster's film id in Kinopoisk")
    url: Optional[str] = Field(None, description="Poster url")


# Users


class User(BaseModel):
    id: Optional[int] = Field(None, description="User id in the database")
    img: Optional[str] = Field(None, description="User image link")
    login: Optional[str] = Field(None, description="User login")
    password: Optional[str] = Field(None, description="User password")
    nickname: Optional[str] = Field(None, description="User nickname")
    email: Optional[str] = Field(None, description="User email")
    description: Optional[str] = Field(None, description="User description")
    registration_date: Optional[datetime] = Field(None, description="User registration date")


class UserCreate(BaseModel):
    login: str = Field(..., description="User login")
    password: str = Field(..., description="User password")
    nickname: str = Field(..., description="User nickname")
    email: str = Field(..., description="User email")
    description: Optional[str] = Field("Напишите о себе", description="User description")
    registration_date: Optional[datetime] = Field(datetime.now(), description="User registration date")


class UserAuthorization(BaseModel):
    type: str = Field(..., description="Authorization type")
    login: str = Field(..., description="User login")
    password: str = Field(..., description="User password")
    repeat_password: Optional[str] = Field(None, description="User repeated password")
    nickname: Optional[str] = Field(None, description="User nickname")
    email: Optional[str] = Field(None, description="User email")


class UserRecovery(BaseModel):
    type: str = Field(..., description="Authorization type")
    login: str = Field(..., description="User login")
    password: Optional[str] = Field(None, description="User password")
    repeat_password: Optional[str] = Field(None, description="User repeated password")
    access_token: Optional[str] = Field(None, description="User password")


class UserUpdate(BaseModel):
    id: int = Field(..., description="User id in the database")
    login: Optional[str] = Field(None, description="User login")
    password: Optional[str] = Field(None, description="User password")
    nickname: Optional[str] = Field(None, description="User nickname")
    description: Optional[str] = Field(None, description="User description")
    email: Optional[str] = Field(None, description="User email")
    registration_date: Optional[datetime] = Field(datetime.now(), description="User registration date")


# Watch later


class FilmAndUser(BaseModel):
    kinopoisk_id: int = Field(..., description="Film id in Kinopoisk")
    user_id: int = Field(..., description="User id in the database")


# Reviews


class ReviewCreate(BaseModel):
    user_id: int = Field(..., description="User id in the database")
    kinopoisk_id: int = Field(..., description="Film id in Kinopoisk")
    title: Optional[str] = Field(None, description="Review title")
    text: Optional[str] = Field(None, description="Review text")
    rating: int = Field(..., description="Review rating")
    date: Optional[datetime] = Field(datetime.now(), description="Review date")
    likes_amount: Optional[int] = Field(0, description="Review likes amount")


class Review(BaseModel):
    id: Optional[int] = Field(None, description="Review id in the database")
    user_id: Optional[int] = Field(None, description="User id in the database")
    kinopoisk_id: Optional[int] = Field(None, description="Film id in Kinopoisk")
    title: Optional[str] = Field(None, description="Review title")
    text: Optional[str] = Field(None, description="Review text")
    rating: Optional[int] = Field(None, description="Review rating")
    date: Optional[datetime] = Field(datetime.now(), description="Review date")
    likes_amount: Optional[int] = Field(0, description="Review likes amount")


class FilmReview(BaseModel):
    id: Optional[int] = Field(None, description="User id in the database")
    user: Optional[User] = Field(None, description="Review title")
    rating: Optional[int] = Field(None, description="Review rating")
    title: Optional[str] = Field(None, description="Review title")
    text: Optional[str] = Field(None, description="Review text")
    date: Optional[str] = Field(None, description="Review date")
    likes_amount: Optional[int] = Field(0, description="Review likes amount")


class ReviewUpdate(BaseModel):
    id: int = Field(..., description="Review id in the database")
    user_id: Optional[int] = Field(None, description="User id in the database")
    kinopoisk_id: Optional[int] = Field(None, description="Film id in Kinopoisk")
    title: Optional[str] = Field(None, description="Review title")
    text: Optional[str] = Field(None, description="Review text")
    rating: Optional[int] = Field(None, description="Review rating")
    date: Optional[datetime] = Field(datetime.now(), description="Review date")
    likes_amount: Optional[int] = Field(None, description="Review likes amount")


# Review likes


class ReviewLike(BaseModel):
    review_id: int = Field(..., description="Review id in the database")
    user_id: int = Field(..., description="User id in the database")


class ReviewLikeCreate(BaseModel):
    review_id: int = Field(..., description="Review id in the database")
    user_id: int = Field(..., description="User id in the database")


class ReviewLikeUpdate(BaseModel):
    id: int = Field(..., description="Review like id in the database")
    review_id: Optional[int] = Field(None, description="Review id in the database")
    user_id: Optional[int] = Field(None, description="User id in the database")
