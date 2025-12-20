import aiohttp
import requests
import asyncio

import os
from dotenv import load_dotenv
import logging

from app import database as db
from app.schemas import *


"""
This file contains functions for collecting information about the film, 
everything works through the api from 
https://github.com/masterWeber/kinopoisk-api-unofficial-client
"""


load_dotenv()
# Configuring logging
# logging.basicConfig(level=logging.ERROR, filename="/logs/logging.log", filemode="a", format="%(asctime)s - %(levelname)s - %(filename)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S", encoding="utf-8")
logging.basicConfig(level=logging.ERROR, filename="../logs/logging.log", filemode="a", format="%(asctime)s - %(levelname)s - %(filename)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S", encoding="utf-8")
logging.getLogger("sqlalchemy").setLevel(logging.ERROR)
logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)


HEADERS = {"X-API-KEY": os.getenv("KINOPOISK_UNOFFICIAL_API_KEY"),
           "Content-Type": "application/json"}

RELATION_TYPES = {
    "REMAKE": "ремейк",
    "SEQUEL": "сиквел",
    "PREQUEL": "приквел"}


def safe_str(data):
    if not data:
        return None
    return str(data).encode("utf-8", "replace").decode("utf-8").strip().replace("'", "").replace("\"", "")


def safe_int(data):
    if not data:
        return None
    
    if isinstance(data, int):
        return data
        
    data_str = safe_str(data)
    if not data_str:
        return None
    
    try:
        return int(data_str)
    except:
        return None
    

def safe_float(data):
    if not data:
        return None
    
    if isinstance(data, float):
        return data
        
    data_str = safe_str(data).replace(",", ".")
    if not data_str:
        return None
    
    try:
        return float(data_str)
    except:
        return None


def safe_bool(data):
    return bool(data) if data is not None else False


async def budget_and_fee(kinopoisk_id: int) -> dict:

    """
    Obtaining data on the budget and box office receipts of a film
    in the world and in Russia
    """

    async with aiohttp.ClientSession() as session:
        url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{kinopoisk_id}/box_office"
        async with session.get(url, headers=HEADERS) as request:
            data = (await request.json()).get("items")
        budgetData = {}
        for elem in data:
            if elem.get("type") == "BUDGET":
                budget = safe_str(f"{elem.get('amount'):,}".replace(",", " "))
                budgetData["budget"] = f"{budget} {elem.get('symbol')}"
            elif elem.get("type") == "RUS":
                rus = safe_str(f"{elem.get('amount'):,}".replace(",", " "))
                budgetData["rus"] = f"{rus} {elem.get('symbol')}"
            elif elem.get("type") == "USA":
                usa = safe_str(f"{elem.get('amount'):,}".replace(",", " "))
                budgetData["usa"] = f"{usa} {elem.get('symbol')}"
            elif elem.get("type") == "WORLD":
                world = safe_str(f"{elem.get('amount'):,}".replace(",", " "))
                budgetData["world"] = f"{world} {elem.get('symbol')}"
        return budgetData

        
async def get_film_info(kinopoisk_id: int) -> bool:

    """
    This function collects primary information 
    about a specific movie by its kinopoiskID
    """

    if not kinopoisk_id:
        return False
    
    async with aiohttp.ClientSession() as session:
        url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{kinopoisk_id}"
        async with session.get(url, headers=HEADERS) as request:
            try:
                data = await request.json()
            except Exception as e:
                logging.error(f"An exception occurred while getting info from https://kinopoiskapiunofficial.tech/api/v2.2/films/{kinopoisk_id}\n{e}\n")
                return False
        budget_data = await budget_and_fee(kinopoisk_id)

        try:
            new_film = FilmCreate(kinopoisk_id = safe_int(data.get("kinopoiskId")),
                                name_ru = safe_str(data.get("nameRu")),
                                name_original = safe_str(data.get("nameOriginal")),
                                poster_url = safe_str(data.get("posterUrl")),
                                poster_preview_url = safe_str(data.get("posterUrlPreview")),
                                rating_good_review_vote_count = safe_int(data.get("ratingGoodReviewVoteCount")),
                                rating_kinopoisk = safe_float(data.get("ratingKinopoisk")),
                                rating_kinopoisk_vote_count = safe_int(data.get("ratingKinopoiskVoteCount")),
                                rating_imdb= safe_float(data.get("ratingImdb")),
                                rating_imdb_vote_count= safe_int(data.get("ratingImdbVoteCount")),
                                year = safe_int(data.get("year")),
                                length = safe_int(data.get("filmLength")),
                                slogan = safe_str(data.get("slogan")),
                                description = safe_str(data.get("description")),
                                short_description = safe_str(data.get("shortDescription")),
                                content_type =safe_str( data.get("type")),
                                rating_age_limits = safe_int(safe_str(data.get("ratingAgeLimits")[3:]) + "+") if data.get("ratingAgeLimits") else None,
                                countries = ', '.join([safe_str(x["country"]) for x in data.get("countries", [])]),
                                genres = (', '.join([safe_str(x["genre"]) for x in data.get("genres", [])])).capitalize(),
                                start_year = safe_int(data.get("startYear")),
                                end_year = safe_int(data.get("endYear")),
                                is_serial = safe_bool(data.get("serial")),
                                budget = safe_str(budget_data.get("budget")),
                                earnings_world = safe_str(budget_data.get("world")),
                                earnings_rus = safe_str(budget_data.get("rus")),
                                has_additional_info = False)
            
            await db.add_film(new_film=new_film)
        except Exception as e:
            logging.error(f"An exception occurred while adding new film kinopoisk_id={kinopoisk_id} to the database\n{e}\n")
            
        return True


async def awards(kinopoisk_id: int) -> dict:

    """
    Get data on movie awards, also display who won if there is information on specific people in this award
    """

    async with aiohttp.ClientSession() as session:
        url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{kinopoisk_id}/awards"
        async with session.get(url, headers=HEADERS) as request:
            data = (await request.json()).get("items")
        movie_award_data = []
        for elem in data:
            if (elem.get("win")) and (elem.get("persons")):
                movie_award_data.append({"name": elem.get("name"),
                                        "nomination_name": elem.get("nominationName"),
                                        "year": elem.get("year"),
                                        "name_ru": elem.get("persons")[0].get("nameRu"),
                                        "name_en": elem.get("persons")[0].get("nameEn")})
            else:
                movie_award_data.append({"name": elem.get("name"),
                                        "nomination_name": elem.get("nominationName"),
                                        "year": elem.get("year")})       
        return movie_award_data


async def trailers(kinopoisk_id: int) -> dict:

    """
    Getting videos for a movie, trailers, etc.
    """
    async with aiohttp.ClientSession() as session:
        url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{kinopoisk_id}/videos"
        async with session.get(url, headers=HEADERS) as request:
            data = (await request.json()).get("items")
        movie_videos_data = []
        for elem in data:
            if "https://www.youtube.com" in elem.get("url") and requests.get(f"https://i.ytimg.com/vi/{elem.get('url')[32:]}/maxresdefault.jpg").status_code == 200:
                movie_videos_data.append({"name": elem.get("name"),
                                          "url": elem.get("url")})
            elif "https://www.imdb.com" in elem.get("url") or "https://widgets.kinopoisk.ru/" in elem.get("url"):
                movie_videos_data.append({"name": elem.get("name"),
                                          "url": elem.get("url")})
        return movie_videos_data
    

async def similars(kinopoisk_id: int) -> dict:

    """
    Getting a list of similar movies id
    """

    async with aiohttp.ClientSession() as session:
        url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{kinopoisk_id}/similars"
        async with session.get(url, headers=HEADERS) as request:
            data = (await request.json()).get("items")
        films_ids = []
        for elem in data:
            films_ids.append(safe_str(elem.get("filmId")))
        return films_ids


async def sequels(kinopoisk_id: int) -> dict:

    """
    Getting sequels and prequels to the film
    """

    async with aiohttp.ClientSession() as session:
        url = f"https://kinopoiskapiunofficial.tech/api/v2.1/films/{kinopoisk_id}/sequels_and_prequels"
        async with session.get(url, headers=HEADERS) as request:
            data = await request.json()
        sequels_data = []
        for elem in data:
            sequels_data.append({"sequel_kinopoisk_id": elem.get("filmId"),
                                "kinopoisk_id": kinopoisk_id,
                                "type": RELATION_TYPES.get(elem.get("relationType"))})
        return sequels_data
    

async def posters(kinopoisk_id: int) -> dict:

    """
    Getting movie related images such as posters, covers etc.
    """

    async with aiohttp.ClientSession() as session:
        url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{kinopoisk_id}/images"
        async with session.get(url, headers=HEADERS) as request:
            data = (await request.json()).get("items")
        posters_data = []
        for elem in data:
            posters_data.append(elem.get("imageUrl"))
        return posters_data


async def get_film_additional_info(kinopoisk_id: int) -> None:
    awards_data = await awards(kinopoisk_id)
    trailers_data = await trailers(kinopoisk_id)
    similars_ids = await similars(kinopoisk_id)
    sequels_data = await sequels(kinopoisk_id)
    posters_data = await posters(kinopoisk_id)

    for award_data in awards_data:
        try:
            new_award = AwardCreate(kinopoisk_id = safe_int(kinopoisk_id), 
                                    name = safe_str(award_data.get("name")), 
                                    nomination_name = safe_str(award_data.get("nomination_name")), 
                                    year = safe_int(award_data.get("year")), 
                                    persons = safe_str(f"{award_data.get('name_ru')} - {award_data.get('name_en')}"))
            await db.add_award(new_award=new_award)
        except Exception as error:
            logging.error(f"An exception occurred while adding new award name={award_data.get('name')} to film kinopoisk_id={kinopoisk_id} to the database\n{error}\n")

    for trailer_data in trailers_data:
        try:
            new_trailer = TrailerCreate(kinopoisk_id = safe_int(kinopoisk_id), 
                                        name = safe_str(trailer_data.get("name")), 
                                        url = safe_str(trailer_data.get("url")))
            await db.add_trailer(new_trailer=new_trailer)
        except Exception as error:
            logging.error(f"An exception occurred while adding new trailer url={trailer_data.get('url')} to film kinopoisk_id={kinopoisk_id} to the database\n{error}\n")

    for similar_id in similars_ids:
        try:
            new_similar = SimilarCreate(kinopoisk_id = safe_int(kinopoisk_id), similar_kinopoisk_id = safe_int(similar_id))
            await get_film_info(new_similar.similar_kinopoisk_id)
            await db.add_similar(new_similar=new_similar)
        except Exception as error:
            logging.error(f"An exception occurred while adding new similar similar_kinopoisk_id={similar_id} to film kinopoisk_id={kinopoisk_id} to the database\n{error}\n")

    for sequel_data in sequels_data:
        try:
            new_sequel = SequelCreate(kinopoisk_id = safe_int(kinopoisk_id), 
                                    sequel_kinopoisk_id = safe_int(sequel_data.get("sequel_kinopoisk_id")), 
                                    type = safe_str(sequel_data.get("type")))
            await db.add_sequel(new_sequel=new_sequel)
        except Exception as error:
            logging.error(f"An exception occurred while adding new sequel sequel_kinopoisk_id={sequel_data.get('sequel_kinopoisk_id')} to film kinopoisk_id={kinopoisk_id} to the database\n{error}\n")
        
    for poster_data in posters_data:
        try:
            new_poster = PosterCreate(kinopoisk_id = safe_int(kinopoisk_id), 
                                    url = safe_str(poster_data))
            await db.add_poster(new_poster=new_poster)
        except Exception as error:
            logging.error(f"An exception occurred while adding new poster url={poster_data} to film kinopoisk_id={kinopoisk_id} to the database\n{error}\n")

    await db.update_film(FilmUpdate(kinopoisk_id=kinopoisk_id, has_additional_info=True))


async def get_films_by_title(message: str) -> list:

    """
    This function collects all matching movies by title and returns their kinopoiskID
    """
    
    async with aiohttp.ClientSession() as session:
        url = f"https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword={message}"
        async with session.get(url, headers=HEADERS) as request:
            films = (await request.json()).get("films")
        film_ids = []
        if films:
            for film in films:
                if not safe_str(film.get("description")):
                    continue
                film_id = safe_int(film.get("filmId"))
                film_ids.append(film_id)
                if not await db.check_film(film_id):
                    await get_film_info(film_id)
        return film_ids


async def api_check() -> None:

    """
    Function for checking api data, displays total Quota and daily Quota
    """
    
    api = os.getenv("API_KEY")
    async with aiohttp.ClientSession() as session:
        url2 = f"https://kinopoiskapiunofficial.tech//api/v1/api_keys/{api}"
        async with session.get(url2, headers=HEADERS) as request:
            response = await request.json()
            print("Total Quota:\nvalue:", response.get("totalQuota").get("value"), "\nused:", response.get("totalQuota").get("used"))
            print("Daily Quota:\nvalue:", response.get("dailyQuota").get("value"), "\nused:", response.get("totalQuota").get("used"))


async def main():
    await api_check()


if __name__ == "__main__":
    asyncio.run(main())